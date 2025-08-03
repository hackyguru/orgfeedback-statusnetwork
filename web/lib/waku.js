import { createLightNode, waitForRemotePeer, createDecoder, createEncoder } from '@waku/sdk';

class WakuService {
  constructor() {
    this.node = null;
    this.isInitialized = false;
    this.listeners = new Set();
  }

  async initialize() {
    if (this.isInitialized) return;

    try {
      // Create and start the light node
      this.node = await createLightNode({ defaultBootstrap: true });
      await this.node.start();
      
      // Wait for peer connection
      await waitForRemotePeer(this.node);
      
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
      const contentTopic = this.createContentTopic(userAddress);
      const decoder = createDecoder(contentTopic);

      // Check if store is available (light nodes might not have store)
      if (!this.node.store || typeof this.node.store.query !== 'function') {
        console.log('⚠️ Store not available in light node, returning empty array');
        return [];
      }

      // Query for messages from the last 7 days
      const startTime = new Date();
      startTime.setDate(startTime.getDate() - 7);
      
      try {
        const messages = await this.node.store.query([decoder], {
          timeFilter: {
            startTime,
            endTime: new Date()
          }
        });

        const requests = [];
        for (const message of messages) {
          if (!message.payload) continue;

          try {
            const payload = JSON.parse(new TextDecoder().decode(message.payload));
            
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

              requests.push(request);
            }
          } catch (error) {
            console.error('❌ Error parsing stored message:', error);
          }
        }

        console.log('📦 Retrieved stored requests:', requests.length);
        return requests;
      } catch (storeError) {
        console.error('❌ Store query failed:', storeError);
        console.log('⚠️ Falling back to empty array');
        return [];
      }
    } catch (error) {
      console.error('❌ Failed to get stored requests:', error);
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