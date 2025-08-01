import { useAccount, useReadContract } from 'wagmi';
import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Sidebar from '@/components/Sidebar';
import { CONTRACT_ADDRESS } from '@/lib/config';
import { ORG_FEEDBACK_ABI } from '@/lib/abi';
import Link from 'next/link';

// Dynamically import FeedbackCard to prevent SSR issues
const FeedbackCard = dynamic(() => import('@/components/FeedbackCard'), {
  ssr: false,
  loading: () => (
    <div className="bg-white border border-zinc-200 rounded-lg p-6 animate-pulse">
      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="h-5 bg-zinc-200 rounded w-48 mb-2"></div>
          <div className="h-3 bg-zinc-200 rounded w-32"></div>
        </div>
        <div className="h-3 bg-zinc-200 rounded w-8"></div>
      </div>
      <div className="space-y-2 mb-4">
        <div className="h-4 bg-zinc-200 rounded w-full"></div>
        <div className="h-4 bg-zinc-200 rounded w-3/4"></div>
      </div>
      <div className="flex justify-between items-center">
        <div className="h-3 bg-zinc-200 rounded w-32"></div>
        <div className="h-6 bg-zinc-200 rounded w-20"></div>
      </div>
    </div>
  ),
});

function FeedbackPageContent() {
  const { address, isConnected } = useAccount();
  const [feedbacks, setFeedbacks] = useState([]);
  const [filterType, setFilterType] = useState('all'); // all, sent, received, admin

  // Get accessible feedbacks using direct ethers call (wagmi has issues)
  const [feedbackData, setFeedbackData] = useState(null);
  const [isLoadingFeedbacks, setIsLoadingFeedbacks] = useState(false);
  const [feedbackError, setFeedbackError] = useState(null);

  const fetchFeedbacks = async () => {
    if (!address || !window.ethereum) {
      console.log('⚠️ No address or MetaMask not available');
      return;
    }
    
    try {
      setIsLoadingFeedbacks(true);
      setFeedbackError(null);
      
      console.log('🔄 Fetching feedbacks for:', address);
      
      // Import ethers dynamically
      const { ethers } = await import('ethers');
      
      // Check if MetaMask is connected
      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      if (!accounts || accounts.length === 0) {
        throw new Error('MetaMask not connected. Please connect your wallet first.');
      }
      
      // Create provider using MetaMask
      const provider = new ethers.BrowserProvider(window.ethereum);
      
      // Get signer (needed for contract to know msg.sender)
      const signer = await provider.getSigner();
      
      // Create contract instance with signer (required for access control)
      const contract = new ethers.Contract(CONTRACT_ADDRESS, ORG_FEEDBACK_ABI, signer);
      
      // Call the function directly (needs signer for msg.sender context)
      const result = await contract.getAccessibleFeedbacks();
      console.log('✅ Feedbacks fetched successfully:', result.map(arr => arr.length));
      
      setFeedbackData(result);
      
    } catch (error) {
      console.error('❌ Error fetching feedbacks:', error);
      
      // Handle specific error types
      if (error.code === 'UNKNOWN_ERROR' && error.payload?.method === 'eth_requestAccounts') {
        setFeedbackError(new Error('MetaMask connection issue. Please refresh the page and ensure MetaMask is connected.'));
      } else if (error.message?.includes('user rejected')) {
        setFeedbackError(new Error('Connection was rejected. Please connect your wallet and try again.'));
      } else if (error.code === -32002) {
        setFeedbackError(new Error('MetaMask is busy. Please wait a moment and try again.'));
      } else {
        setFeedbackError(error);
      }
    } finally {
      setIsLoadingFeedbacks(false);
    }
  };

  useEffect(() => {
    fetchFeedbacks();
  }, [address]);

  // Test direct contract call to compare with debug script
  const { data: totalFeedbackCount } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: ORG_FEEDBACK_ABI,
    functionName: 'getFeedbackCount',
    enabled: !!address,
  });

  // Simple connection logging
  useEffect(() => {
    if (address) {
      console.log('🔗 Connected to:', address.slice(0, 6) + '...' + address.slice(-4));
    }
  }, [address]);

  useEffect(() => {
    if (feedbackError) {
      console.error('Error fetching feedbacks:', feedbackError);
    }
  }, [feedbackError]);



  // Get feedback count for stats
  const { data: feedbackCount } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: ORG_FEEDBACK_ABI,
    functionName: 'getFeedbackCount',
  });



  useEffect(() => {
    if (feedbackData && feedbackData.length === 5) {
      const [orgIds, senders, receivers, messages, timestamps] = feedbackData;
      
      console.log('📥 Processing feedback data:', orgIds?.length || 0, 'feedbacks found');
      
      if (orgIds && orgIds.length > 0) {
        const formattedFeedbacks = orgIds.map((orgId, index) => ({
          id: index,
          orgId,
          sender: senders[index],
          receiver: receivers[index],
          encryptedMessage: messages[index],
          timestamp: timestamps[index],
        }));

        setFeedbacks(formattedFeedbacks);
        console.log('✅ Feedbacks loaded successfully:', formattedFeedbacks.length);
      } else {
        setFeedbacks([]);
        console.log('📭 No feedbacks available for this address');
      }
    }
  }, [feedbackData]);

  const filteredFeedbacks = feedbacks.filter((feedback) => {
    if (filterType === 'all') return true;
    
    const isReceiver = feedback.receiver.toLowerCase() === address?.toLowerCase();
    const isSenderVisible = feedback.sender !== '0x0000000000000000000000000000000000000000' && 
                           feedback.sender.toLowerCase() === address?.toLowerCase();
    
    // For 'sent' - we need to identify feedback where user is the sender
    // This is tricky because sender might be hidden due to privacy settings
    // We can infer it by process of elimination:
    if (filterType === 'sent') {
      // Only show if sender is visible and matches user
      return isSenderVisible;
    }
    
    if (filterType === 'received') return isReceiver;
    
    if (filterType === 'admin') {
      // Admin view: user has access but is neither sender nor receiver
      return !isSenderVisible && !isReceiver;
    }
    
    return true;
  });

  const getFilterCounts = () => {
    const all = feedbacks.length;
    
    let sent = 0, received = 0, admin = 0;
    
    feedbacks.forEach(feedback => {
      const isReceiver = feedback.receiver.toLowerCase() === address?.toLowerCase();
      const isSenderVisible = feedback.sender !== '0x0000000000000000000000000000000000000000' && 
                             feedback.sender.toLowerCase() === address?.toLowerCase();
      const isHiddenSenderOrAdmin = !isSenderVisible && !isReceiver;
      
      if (isReceiver) {
        received++;
      } else if (isSenderVisible) {
        sent++;
      } else if (isHiddenSenderOrAdmin) {
        // User has access but is neither visible sender nor receiver
        // This means they're viewing as admin (sender chose to be anonymous to admin)
        admin++;
      }
    });
    
    return { all, sent, received, admin };
  };

  const counts = getFilterCounts();

  if (!isConnected) {
    return (
      <div className="min-h-screen flex">
        <Sidebar />
        <div className="flex-1 p-8 lg:p-12">
          <div className="max-w-6xl mx-auto">
            <div className="glass-card-solid p-8 text-center">
              <h1 className="text-2xl font-bold text-gray-800 mb-4">
                Feedback Center
              </h1>
              <p className="text-gray-700 mb-6">
                Use the sidebar to connect your wallet and view your feedback
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      <Sidebar />
      
      <div className="flex-1 p-8 lg:p-12">
        <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-800">
              Feedback Center
            </h1>
            <Link
              href="/feedback/new"
              className="px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition-all transform hover:scale-105"
              style={{ background: '#22262b', color: '#ffffff' }}
            >
              Send Feedback
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg p-6 border border-zinc-200">
              <div className="text-2xl font-bold text-gray-800">
                {feedbackCount ? feedbackCount.toString() : '0'}
              </div>
              <div className="text-zinc-600">
                Total Platform Feedback
              </div>
            </div>
            <div className="bg-white rounded-lg p-6 border border-zinc-200">
              <div className="text-2xl font-bold text-gray-800">
                {counts.all}
              </div>
              <div className="text-zinc-600">
                Your Accessible Feedback
              </div>
            </div>
            <div className="bg-white rounded-lg p-6 border border-zinc-200">
              <div className="text-2xl font-bold text-gray-800">
                {counts.sent}
              </div>
              <div className="text-zinc-600">
                Sent by You
              </div>
            </div>
            <div className="bg-white rounded-lg p-6 border border-zinc-200">
              <div className="text-2xl font-bold text-gray-800">
                {counts.received}
              </div>
              <div className="text-zinc-600">
                Received by You
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg p-6 border border-zinc-200">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFilterType('all')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filterType === 'all'
                    ? 'bg-zinc-900 text-gray-800'
                    : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
                }`}
              >
                All ({counts.all})
              </button>
              <button
                onClick={() => setFilterType('sent')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filterType === 'sent'
                    ? 'bg-zinc-900 text-gray-800'
                    : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
                }`}
              >
                Sent ({counts.sent})
              </button>
              <button
                onClick={() => setFilterType('received')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filterType === 'received'
                    ? 'bg-zinc-900 text-gray-800'
                    : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
                }`}
              >
                Received ({counts.received})
              </button>
              {counts.admin > 0 && (
                <button
                  onClick={() => setFilterType('admin')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    filterType === 'admin'
                      ? 'bg-zinc-900 text-gray-800'
                      : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
                  }`}
                >
                  Admin View ({counts.admin})
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Refresh Button */}
        <div className="mb-6 flex gap-3">
          <button
            onClick={fetchFeedbacks}
            disabled={isLoadingFeedbacks}
                          className="px-4 py-2 rounded hover:opacity-90 disabled:opacity-50"
              style={{ background: '#22262b', color: '#ffffff' }}
          >
            {isLoadingFeedbacks ? '🔄 Loading...' : '🔄 Refresh Feedbacks'}
          </button>
          
          {feedbackError && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded">
              ⚠️ {feedbackError.message}
            </div>
          )}
        </div>



        {/* Feedback List */}
        <div className="space-y-6">
          {isLoadingFeedbacks ? (
            <div className="space-y-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-white border border-zinc-200 rounded-lg p-6 animate-pulse">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="h-5 bg-zinc-200 rounded w-48 mb-2"></div>
                      <div className="h-3 bg-zinc-200 rounded w-32"></div>
                    </div>
                    <div className="h-3 bg-zinc-200 rounded w-8"></div>
                  </div>
                  <div className="space-y-2 mb-4">
                    <div className="h-4 bg-zinc-200 rounded w-full"></div>
                    <div className="h-4 bg-zinc-200 rounded w-3/4"></div>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="h-3 bg-zinc-200 rounded w-32"></div>
                    <div className="h-6 bg-zinc-200 rounded w-20"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredFeedbacks.length > 0 ? (
            filteredFeedbacks.map((feedback) => (
              <FeedbackCard
                key={feedback.id}
                orgId={feedback.orgId}
                sender={feedback.sender}
                receiver={feedback.receiver}
                encryptedMessage={feedback.encryptedMessage}
                timestamp={feedback.timestamp}
                index={feedback.id}
              />
            ))
          ) : (
            <div className="glass-card-solid p-12 text-center">
              <div className="text-gray-700 mb-4">
                {filterType === 'all' ? (
                  "You don't have any accessible feedback yet"
                ) : filterType === 'sent' ? (
                  "You haven't sent any feedback yet"
                ) : filterType === 'received' ? (
                  "You haven't received any feedback yet"
                ) : (
                  "No feedback to review as admin"
                )}
              </div>
              <p className="text-gray-700 text-sm mb-6">
                {filterType === 'sent' || filterType === 'all' ? (
                  "Start by sending feedback to your team members"
                ) : (
                  "Feedback will appear here when available"
                )}
              </p>
              {(filterType === 'sent' || filterType === 'all') && (
                <Link
                  href="/feedback/new"
                  className="inline-block px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition-all transform hover:scale-105"
                  style={{ background: '#22262b', color: '#ffffff' }}
                >
                  Send Your First Feedback
                </Link>
              )}
            </div>
          )}
        </div>
        </div>
      </div>
    </div>
  );
}

// Export the page with client-side only rendering to prevent hydration issues
export default dynamic(() => Promise.resolve(FeedbackPageContent), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex">
      <div className="flex-1 p-8 lg:p-12">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-300 rounded w-64"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="glass-card-solid p-6">
                  <div className="h-8 bg-gray-300 rounded w-16 mb-2"></div>
                  <div className="h-4 bg-gray-300 rounded w-32"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  ),
});