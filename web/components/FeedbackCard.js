import { useState, useEffect } from 'react';
import { useAccount, useReadContract } from 'wagmi';
import { CONTRACT_ADDRESS } from '@/lib/config';
import { ORG_FEEDBACK_ABI } from '@/lib/abi';

const FeedbackCard = ({ 
  orgId, 
  sender, 
  receiver, 
  encryptedMessage, 
  timestamp, 
  index 
}) => {
  const { address } = useAccount();
  const [orgName, setOrgName] = useState('');

  // Get organization name
  const { data: orgMetadata } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: ORG_FEEDBACK_ABI,
    functionName: 'getOrgMetadata',
    args: [orgId],
  });

  useEffect(() => {
    if (orgMetadata) {
      setOrgName(orgMetadata[0]);
    }
  }, [orgMetadata]);

  // No encryption/decryption - just use the message directly

  const formatAddress = (address) => {
    if (!address || address === '0x0000000000000000000000000000000000000000') {
      return 'Anonymous';
    }
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(Number(timestamp) * 1000);
    // Use a consistent format that doesn't vary by locale to prevent hydration issues
    return date.toISOString().replace('T', ' ').substring(0, 16);
  };

  const getSenderDisplay = () => {
    const isReceiver = receiver.toLowerCase() === address?.toLowerCase();
    const isSenderVisible = sender !== '0x0000000000000000000000000000000000000000';
    const isSender = isSenderVisible && sender.toLowerCase() === address?.toLowerCase();
    
    if (isSender) {
      return `You → ${formatAddress(receiver)}`;
    } else if (isReceiver) {
      return `${formatAddress(sender)} → You`;
    } else {
      // Admin view - don't assume hidden sender means "You"
      // Show "Anonymous" when sender is hidden to admin
      const senderDisplay = isSenderVisible ? formatAddress(sender) : 'Anonymous';
      return `${senderDisplay} → ${formatAddress(receiver)}`;
    }
  };

  const getMessageContent = () => {
    if (!encryptedMessage) {
      return (
        <div className="text-zinc-400 text-sm">
          No message content
        </div>
      );
    }
    
    return (
      <div className="text-zinc-700 leading-relaxed break-words overflow-wrap-anywhere">
        {encryptedMessage}
      </div>
    );
  };

  return (
    <div className="bg-white border border-zinc-200 rounded-lg p-4 sm:p-6 hover:border-zinc-300 transition-colors overflow-hidden">
      {/* Header */}
      <div className="flex justify-between items-start mb-4 gap-4">
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium text-zinc-900 mb-1 truncate">
            {getSenderDisplay()}
          </div>
          <div className="text-xs text-zinc-500 truncate">
            {orgName && `${orgName} • `}
            {formatTimestamp(timestamp)}
          </div>
        </div>
        <div className="text-xs text-zinc-400 font-mono flex-shrink-0">
          #{index}
        </div>
      </div>

      {/* Message Content */}
      <div className="mb-4">
        {getMessageContent()}
      </div>

      {/* Footer */}
      <div className="flex justify-between items-center text-xs text-zinc-500">
        <div>
          Organization: {formatAddress(orgId)}
        </div>
        <div className="flex items-center space-x-2">
          {(() => {
            const isReceiver = receiver.toLowerCase() === address?.toLowerCase();
            const isSenderVisible = sender !== '0x0000000000000000000000000000000000000000';
            const isSender = isSenderVisible && sender.toLowerCase() === address?.toLowerCase();
            
            if (isSender) {
              return (
                <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                  Sent by you
                </span>
              );
            } else if (isReceiver) {
              return (
                <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full">
                  Sent to you
                </span>
              );
            } else {
              // Admin viewing feedback (sender may be anonymous)
              return (
                <span className="bg-zinc-100 text-zinc-700 px-2 py-1 rounded-full">
                  Admin view
                </span>
              );
            }
          })()}
        </div>
      </div>
    </div>
  );
};

export default FeedbackCard;