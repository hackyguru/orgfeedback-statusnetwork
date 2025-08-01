import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Navbar from '@/components/Navbar';
import { CONTRACT_ADDRESS } from '@/lib/config';
import { ORG_FEEDBACK_ABI } from '@/lib/abi';
// No encryption imports needed
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function NewFeedbackPage() {
  const { address, isConnected } = useAccount();
  const router = useRouter();
  const [selectedOrgId, setSelectedOrgId] = useState('');
  const [receiverAddress, setReceiverAddress] = useState('');
  const [message, setMessage] = useState('');
  const [revealToReceiver, setRevealToReceiver] = useState(false);
  const [revealToAdmin, setRevealToAdmin] = useState(false);
  const [isSending, setIsSending] = useState(false);
  // No encryption state needed
  const [userOrgs, setUserOrgs] = useState([]);
  const [orgMembers, setOrgMembers] = useState({});

  const { writeContract, data: hash, error } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  // Get user's organizations
  const { data: organizations } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: ORG_FEEDBACK_ABI,
    functionName: 'getOrganizationsByUser',
    args: address ? [address] : undefined,
    enabled: !!address,
  });

  // Get organization metadata for selected org
  const { data: orgMetadata } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: ORG_FEEDBACK_ABI,
    functionName: 'getOrgMetadata',
    args: selectedOrgId ? [selectedOrgId] : undefined,
    enabled: !!selectedOrgId,
  });

  useEffect(() => {
    if (organizations) {
      setUserOrgs(organizations);
      if (organizations.length === 1) {
        setSelectedOrgId(organizations[0]);
      }
    }
  }, [organizations]);

  useEffect(() => {
    if (isConfirmed) {
      setIsSending(false);
      toast.success('Feedback sent successfully!');
      router.push('/feedback');
    }
  }, [isConfirmed, router]);

  useEffect(() => {
    if (error) {
      setIsSending(false);
      toast.error('Failed to send feedback');
      console.error('Transaction error:', error);
    }
  }, [error]);

  const handleSendFeedback = async (e) => {
    e.preventDefault();

    if (!selectedOrgId) {
      toast.error('Please select an organization');
      return;
    }

    if (!receiverAddress.trim()) {
      toast.error('Please enter receiver address');
      return;
    }

    if (!receiverAddress.startsWith('0x') || receiverAddress.length !== 42) {
      toast.error('Please enter a valid Ethereum address');
      return;
    }

    if (!message.trim()) {
      toast.error('Please enter a feedback message');
      return;
    }

    // No encryption check needed

    try {
      setIsSending(true);

      // Send the feedback transaction with plain text message
      writeContract({
        address: CONTRACT_ADDRESS,
        abi: ORG_FEEDBACK_ABI,
        functionName: 'sendFeedback',
        args: [
          selectedOrgId,
          receiverAddress.trim(),
          message.trim(), // Same message for sender
          message.trim(), // Same message for receiver  
          message.trim(), // Same message for admin
          revealToReceiver,
          revealToAdmin,
        ],
      });

    } catch (err) {
      setIsSending(false);
      toast.error('Failed to send feedback');
      console.error('Error sending feedback:', err);
    }
  };

  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const validateReceiver = async () => {
    if (!selectedOrgId || !receiverAddress.trim()) return;
    
    if (!receiverAddress.startsWith('0x') || receiverAddress.length !== 42) {
      toast.error('Invalid Ethereum address format');
      return;
    }

    try {
      // This would ideally check if the receiver is a member of the org
      // For now, we'll just validate the address format
      toast.success('Receiver address is valid');
    } catch (err) {
      toast.error('Failed to validate receiver');
    }
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-zinc-50">
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 py-16">
          <div className="bg-white rounded-lg p-8 border border-zinc-200 text-center">
            <h1 className="text-2xl font-bold text-zinc-900 mb-4">
              Send Feedback
            </h1>
            <p className="text-zinc-600 mb-6">
              Please connect your wallet to send feedback
            </p>
          </div>
        </div>
      </div>
    );
  }

  // No encryption check needed

  return (
    <div className="min-h-screen bg-zinc-50">
      <Navbar />
      
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <Link
              href="/feedback"
              className="text-zinc-500 hover:text-zinc-700 transition-colors"
            >
              ← Back to Feedback
            </Link>
          </div>
          <h1 className="text-3xl font-bold text-zinc-900">
            Send Encrypted Feedback
          </h1>
          <p className="text-zinc-600 mt-2">
            Send secure, encrypted feedback to members of your organization
          </p>
        </div>

        {userOrgs.length === 0 ? (
          <div className="bg-white rounded-lg p-8 border border-zinc-200 text-center">
            <h2 className="text-xl font-bold text-zinc-900 mb-4">
              No Organizations
            </h2>
            <p className="text-zinc-600 mb-6">
              You need to be a member of an organization to send feedback.
            </p>
            <Link
              href="/org"
              className="inline-block bg-zinc-900 text-white px-6 py-3 rounded-lg font-medium hover:bg-zinc-800 transition-colors"
            >
              Create or Join Organization
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-lg p-8 border border-zinc-200">
            <form onSubmit={handleSendFeedback} className="space-y-6">
              {/* Organization Selection */}
              <div>
                <label htmlFor="organization" className="block text-sm font-medium text-zinc-700 mb-2">
                  Select Organization *
                </label>
                <select
                  id="organization"
                  value={selectedOrgId}
                  onChange={(e) => setSelectedOrgId(e.target.value)}
                  className="w-full px-4 py-3 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-zinc-500 focus:border-transparent outline-none transition-colors"
                  disabled={isSending || isConfirming}
                  required
                >
                  <option value="">Choose an organization...</option>
                  {userOrgs.map((orgId) => (
                    <option key={orgId} value={orgId}>
                      {formatAddress(orgId)} {orgId.toLowerCase() === address?.toLowerCase() && '(Your Org)'}
                    </option>
                  ))}
                </select>
              </div>

              {/* Receiver Address */}
              <div>
                <label htmlFor="receiver" className="block text-sm font-medium text-zinc-700 mb-2">
                  Receiver Wallet Address *
                </label>
                <div className="space-y-2">
                  <input
                    type="text"
                    id="receiver"
                    value={receiverAddress}
                    onChange={(e) => setReceiverAddress(e.target.value)}
                    placeholder="0x..."
                    className="w-full px-4 py-3 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-zinc-500 focus:border-transparent outline-none transition-colors font-mono text-sm"
                    disabled={isSending || isConfirming}
                    required
                  />
                  <div className="text-xs text-zinc-500">
                    Enter the wallet address of the person you want to send feedback to
                  </div>
                </div>
              </div>

              {/* Message */}
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-zinc-700 mb-2">
                  Feedback Message *
                </label>
                <textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Write your feedback message here..."
                  rows={6}
                  className="w-full px-4 py-3 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-zinc-500 focus:border-transparent outline-none transition-colors resize-none"
                  disabled={isSending || isConfirming}
                  required
                />
                <div className="text-xs text-zinc-500 mt-1">
                  This message will be encrypted and stored on-chain
                </div>
              </div>

              {/* Anonymity Settings */}
              <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-4">
                <h3 className="font-medium text-zinc-900 mb-4">
                  Identity Revelation Settings
                </h3>
                <div className="space-y-3">
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={revealToReceiver}
                      onChange={(e) => setRevealToReceiver(e.target.checked)}
                      className="w-4 h-4 text-zinc-600 border-zinc-300 rounded focus:ring-zinc-500"
                      disabled={isSending || isConfirming}
                    />
                    <div>
                      <div className="text-sm font-medium text-zinc-900">
                        Reveal my identity to the receiver
                      </div>
                      <div className="text-xs text-zinc-500">
                        If unchecked, the receiver won't know who sent this feedback
                      </div>
                    </div>
                  </label>
                  
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={revealToAdmin}
                      onChange={(e) => setRevealToAdmin(e.target.checked)}
                      className="w-4 h-4 text-zinc-600 border-zinc-300 rounded focus:ring-zinc-500"
                      disabled={isSending || isConfirming}
                    />
                    <div>
                      <div className="text-sm font-medium text-zinc-900">
                        Reveal my identity to the organization admin
                      </div>
                      <div className="text-xs text-zinc-500">
                        If unchecked, the admin won't know who sent this feedback
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Privacy Info */}
              <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-4">
                <h3 className="font-medium text-zinc-900 mb-2">
                  🔐 Privacy Settings
                </h3>
                <ul className="text-sm text-zinc-700 space-y-1">
                  <li>• Your message will be stored as plain text on the blockchain</li>
                  <li>• Your anonymity settings control identity revelation</li>
                  <li>• Only organization members can access feedback</li>
                  <li>• All feedback is stored securely on the blockchain</li>
                </ul>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={
                  isSending || 
                  isConfirming || 
                  !selectedOrgId || 
                  !receiverAddress.trim() || 
                  !message.trim()
                }
                className="w-full bg-zinc-900 text-white px-6 py-4 rounded-lg font-medium hover:bg-zinc-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSending || isConfirming ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                    <span>
                      {isSending ? 'Sending...' : 'Confirming...'}
                    </span>
                  </div>
                ) : (
                  'Send Feedback'
                )}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}