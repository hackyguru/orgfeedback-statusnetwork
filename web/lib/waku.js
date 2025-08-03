import { createLightNode, waitForRemotePeer, createDecoder, createEncoder, Protocols } from '@waku/sdk';

class WakuService {
  constructor() {
    this.node = null;
    this.isInitialized = false;
    this.listeners = new Set();
    this.storedMessages = new Map(); // Local storage for messages
  }

  async initialize() {
    if (this.isInitialized) return;

    try {
      // Create and start the light node
      this.node = await createLightNode({ defaultBootstrap: true });
      await this.node.start();
      
      // Wait for peer connection
      await waitForRemotePeer(this.node);
      
      // Wait for Store peers specifically with timeout
      try {
        const storePeerPromise = this.node.waitForPeers([Protocols.Store]);
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Store peer connection timeout')), 10000)
        );
        
        await Promise.race([storePeerPromise, timeoutPromise]);
        console.log('✅ Connected to Store peers');
      } catch (error) {
        console.log('⚠️ Store peer connection failed, continuing without Store Protocol');
        // Continue without Store peers - real-time messaging will still work
      }
      
      this.isInitialized = true;
      console.log('✅ Waku node initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Waku node:', error);
      throw error;
    }
  }

  // Create content topic for feedback requests
  createContentTopic(receiverAddress) {
    return `/statusfeedback/1/requests/${receiverAddress.toLowerCase()}`;
  }

  // Send feedback request
  async sendFeedbackRequest(senderAddress, receiverAddress, message) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const contentTopic = this.createContentTopic(receiverAddress);
      const encoder = createEncoder({ contentTopic });
      
      const payload = {
        sender: senderAddress.toLowerCase(),
        receiver: receiverAddress.toLowerCase(),
        message: message,
        timestamp: Date.now()
      };

      const encodedPayload = new TextEncoder().encode(JSON.stringify(payload));
      
      await this.node.lightPush.send(encoder, {
        payload: encodedPayload
      });

      console.log('✅ Feedback request sent to:', receiverAddress);
      return true;
    } catch (error) {
      console.error('❌ Failed to send feedback request:', error);
      throw error;
    }
  }

  // Send feedback requests to multiple recipients
  async sendFeedbackRequests(senderAddress, receiverAddresses, message) {
    const promises = receiverAddresses.map(address => 
      this.sendFeedbackRequest(senderAddress, address, message)
    );
    
    return Promise.all(promises);
  }

  // Listen for incoming feedback requests
  async listenForRequests(userAddress, onRequestReceived) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const contentTopic = this.createContentTopic(userAddress);
      const decoder = createDecoder(contentTopic);

      const unsubscribe = await this.node.filter.subscribe([decoder], (wakuMessage) => {
        if (!wakuMessage.payload) return;

        try {
          const payload = JSON.parse(new TextDecoder().decode(wakuMessage.payload));
          
          // Only process messages where this user is the receiver
          if (payload.receiver.toLowerCase() === userAddress.toLowerCase()) {
            const request = {
              id: `${payload.sender}-${payload.timestamp}`,
              sender: payload.sender,
              receiver: payload.receiver,
              message: payload.message,
              timestamp: payload.timestamp,
              receivedAt: Date.now()
            };

            // Store the message locally
            this.storedMessages.set(request.id, request);
            console.log('💾 Stored message locally:', request.id);

            console.log('📨 Received feedback request:', request);
            onRequestReceived(request);
          }
        } catch (error) {
          console.error('❌ Error parsing Waku message:', error);
        }
      });

      // Store unsubscribe function only if it's actually a function
      if (typeof unsubscribe === 'function') {
        this.listeners.add(unsubscribe);
        console.log('✅ Listening for feedback requests on:', contentTopic);
      } else {
        console.warn('⚠️ Unsubscribe function is not available');
      }
      
      return unsubscribe;
    } catch (error) {
      console.error('❌ Failed to listen for requests:', error);
      throw error;
    }
  }

  // Get stored feedback requests using store protocol
  async getStoredRequests(userAddress) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      // First, try to get messages from local storage
      const localRequests = Array.from(this.storedMessages.values())
        .filter(request => request.receiver.toLowerCase() === userAddress.toLowerCase());

      // Always try Store Protocol first, even if we have local messages
      // This ensures we get historical messages on page refresh

            // Query Store Protocol using the correct API
      const contentTopic = this.createContentTopic(userAddress);
      const decoder = createDecoder(contentTopic);

      // Check if store is available
      if (!this.node.store) {
        console.log('Store not available, using local storage only');
        return localRequests;
      }

      // Check if we have Store peers connected
      try {
        const peers = await this.node.libp2p.getConnections();
        const storePeers = peers.filter(conn => 
          conn.remotePeer && conn.remotePeer.toString().includes('store')
        );
        
        if (storePeers.length === 0) {
          console.log('No Store peers connected, using local storage only');
          return localRequests;
        }
        
        console.log(`Connected to ${storePeers.length} Store peers`);
      } catch (peerError) {
        console.log('Could not check Store peers, proceeding with query');
      }

      // Query for messages from the last 30 days
      const endTime = new Date();
      const startTime = new Date();
      startTime.setDate(startTime.getDate() - 30);

      const requests = [];
      
      try {
        // Use queryWithOrderedCallback for proper Store Protocol querying
        const callback = (wakuMessage) => {
          if (!wakuMessage.payload) {
            return;
          }

          try {
            const payload = JSON.parse(new TextDecoder().decode(wakuMessage.payload));
            
            // Only process messages where this user is the receiver
            if (payload.receiver.toLowerCase() === userAddress.toLowerCase()) {
              const request = {
                id: `${payload.sender}-${payload.timestamp}`,
                sender: payload.sender,
                receiver: payload.receiver,
                message: payload.message,
                timestamp: payload.timestamp,
                receivedAt: Date.now()
              };

              // Store locally for future access
              this.storedMessages.set(request.id, request);

              requests.push(request);
            }
          } catch (error) {
            console.error('Error parsing stored message:', error);
          }
        };

        // Try querying without time filter first (more reliable)
        const queryWithoutTimeFilter = async () => {
          try {
            const queryPromise = this.node.store.queryWithOrderedCallback([decoder], callback);
            const timeoutPromise = new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Store query timeout')), 5000)
            );
            
            await Promise.race([queryPromise, timeoutPromise]);
            return true; // Success
          } catch (error) {
            console.log('Query without time filter failed:', error.message);
            return false; // Failed
          }
        };

        const queryWithTimeFilter = async () => {
          try {
            const queryPromise = this.node.store.queryWithOrderedCallback([decoder], callback, {
              timeFilter: {
                startTime,
                endTime
              }
            });
            const timeoutPromise = new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Store query timeout')), 5000)
            );
            
            await Promise.race([queryPromise, timeoutPromise]);
            return true; // Success
          } catch (error) {
            console.log('Query with time filter failed:', error.message);
            return false; // Failed
          }
        };

        // Try both query strategies
        const success = await queryWithoutTimeFilter() || await queryWithTimeFilter();
        
        if (!success) {
          console.log('All Store Protocol queries failed, using local storage only');
        }

        // If no messages from Store Protocol, return local messages as fallback
        if (requests.length === 0 && localRequests.length > 0) {
          return localRequests;
        }
        
        return requests;
      } catch (storeError) {
        console.error('Store query failed:', storeError);
        console.log('Store error details:', {
          name: storeError.name,
          message: storeError.message,
          code: storeError.code,
          status: storeError.status
        });
        
        // Return local requests as fallback
        return localRequests;
      }
    } catch (error) {
      console.error('Failed to get stored requests:', error);
      return [];
    }
  }

  // Cleanup listeners
  cleanup() {
    this.listeners.forEach(unsubscribe => {
      try {
        if (typeof unsubscribe === 'function') {
          unsubscribe();
        } else {
          console.warn('⚠️ Skipping non-function unsubscribe:', unsubscribe);
        }
      } catch (error) {
        console.error('❌ Error unsubscribing:', error);
      }
    });
    this.listeners.clear();
  }

  // Stop the node
  async stop() {
    if (this.node) {
      await this.node.stop();
      this.node = null;
      this.isInitialized = false;
    }
  }


}

// Create singleton instance
const wakuService = new WakuService();

export default wakuService; 