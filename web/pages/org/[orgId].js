import { useRouter } from 'next/router';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { CONTRACT_ADDRESS } from '@/lib/config';
import { ORG_FEEDBACK_ABI } from '@/lib/abi';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function OrgDetailPage() {
  const router = useRouter();
  const { orgId } = router.query;
  const { address, isConnected } = useAccount();
  const [newMemberAddress, setNewMemberAddress] = useState('');
  const [removeMemberAddress, setRemoveMemberAddress] = useState('');
  const [orgData, setOrgData] = useState(null);
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [isRemovingMember, setIsRemovingMember] = useState(false);

  const { writeContract, data: hash, error } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  // Get organization metadata
  const { data: orgMetadata, isLoading: isLoadingOrg } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: ORG_FEEDBACK_ABI,
    functionName: 'getOrgMetadata',
    args: orgId ? [orgId] : undefined,
    enabled: !!orgId,
  });

  // Check if current user is a member
  const { data: isMember } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: ORG_FEEDBACK_ABI,
    functionName: 'isMember',
    args: orgId && address ? [orgId, address] : undefined,
    enabled: !!(orgId && address),
  });

  useEffect(() => {
    if (orgMetadata) {
      setOrgData({
        name: orgMetadata[0],
        description: orgMetadata[1],
        owner: orgMetadata[2],
      });
    }
  }, [orgMetadata]);

  useEffect(() => {
    if (isConfirmed) {
      setIsAddingMember(false);
      setIsRemovingMember(false);
      setNewMemberAddress('');
      setRemoveMemberAddress('');
      toast.success('Member operation completed successfully!');
    }
  }, [isConfirmed]);

  useEffect(() => {
    if (error) {
      setIsAddingMember(false);
      setIsRemovingMember(false);
      toast.error('Operation failed');
      console.error('Transaction error:', error);
    }
  }, [error]);

  const isOwner = address && orgData && address.toLowerCase() === orgData.owner.toLowerCase();

  const handleAddMember = async (e) => {
    e.preventDefault();
    
    if (!newMemberAddress.trim()) {
      toast.error('Please enter a valid address');
      return;
    }

    if (!newMemberAddress.startsWith('0x') || newMemberAddress.length !== 42) {
      toast.error('Please enter a valid Ethereum address');
      return;
    }

    try {
      setIsAddingMember(true);
      writeContract({
        address: CONTRACT_ADDRESS,
        abi: ORG_FEEDBACK_ABI,
        functionName: 'addMember',
        args: [orgId, newMemberAddress.trim()],
      });
    } catch (err) {
      setIsAddingMember(false);
      toast.error('Failed to add member');
      console.error('Error adding member:', err);
    }
  };

  const handleRemoveMember = async (e) => {
    e.preventDefault();
    
    if (!removeMemberAddress.trim()) {
      toast.error('Please enter a valid address');
      return;
    }

    if (!removeMemberAddress.startsWith('0x') || removeMemberAddress.length !== 42) {
      toast.error('Please enter a valid Ethereum address');
      return;
    }

    if (removeMemberAddress.toLowerCase() === orgData.owner.toLowerCase()) {
      toast.error('Cannot remove the organization owner');
      return;
    }

    try {
      setIsRemovingMember(true);
      writeContract({
        address: CONTRACT_ADDRESS,
        abi: ORG_FEEDBACK_ABI,
        functionName: 'removeMember',
        args: [orgId, removeMemberAddress.trim()],
      });
    } catch (err) {
      setIsRemovingMember(false);
      toast.error('Failed to remove member');
      console.error('Error removing member:', err);
    }
  };

  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-zinc-50">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-16">
          <div className="bg-white rounded-lg p-8 border border-zinc-200 text-center">
            <h1 className="text-2xl font-bold text-zinc-900 mb-4">
              Organization Details
            </h1>
            <p className="text-zinc-600 mb-6">
              Please connect your wallet to view organization details
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (isLoadingOrg) {
    return (
      <div className="min-h-screen bg-zinc-50">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-white rounded-lg p-8 border border-zinc-200">
            <div className="animate-pulse">
              <div className="h-8 bg-zinc-200 rounded w-1/2 mb-4"></div>
              <div className="h-4 bg-zinc-200 rounded w-full mb-2"></div>
              <div className="h-4 bg-zinc-200 rounded w-3/4"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!orgData) {
    return (
      <div className="min-h-screen bg-zinc-50">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-white rounded-lg p-8 border border-zinc-200 text-center">
            <h1 className="text-2xl font-bold text-zinc-900 mb-4">
              Organization Not Found
            </h1>
            <p className="text-zinc-600 mb-6">
              The organization you're looking for doesn't exist.
            </p>
            <Link
              href="/"
              className="inline-block bg-zinc-900 text-white px-6 py-3 rounded-lg font-medium hover:bg-zinc-800 transition-colors"
            >
              Go Back Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!isMember) {
    return (
      <div className="min-h-screen bg-zinc-50">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-white rounded-lg p-8 border border-zinc-200 text-center">
            <h1 className="text-2xl font-bold text-zinc-900 mb-4">
              Access Denied
            </h1>
            <p className="text-zinc-600 mb-6">
              You are not a member of this organization.
            </p>
            <Link
              href="/"
              className="inline-block bg-zinc-900 text-white px-6 py-3 rounded-lg font-medium hover:bg-zinc-800 transition-colors"
            >
              Go Back Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Organization Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <Link
              href="/"
              className="text-zinc-500 hover:text-zinc-700 transition-colors"
            >
              ← Back to Dashboard
            </Link>
          </div>
          
          <div className="bg-white rounded-lg p-8 border border-zinc-200">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h1 className="text-3xl font-bold text-zinc-900 mb-2">
                  {orgData.name}
                </h1>
                <p className="text-zinc-600 leading-relaxed mb-4">
                  {orgData.description}
                </p>
                <div className="text-sm text-zinc-500">
                  Owner: {formatAddress(orgData.owner)}
                  {isOwner && <span className="ml-2 text-green-600">(You)</span>}
                </div>
              </div>
              {isOwner && (
                <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
                  Organization Owner
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-zinc-50 rounded-lg p-4">
                <div className="text-sm text-zinc-500 mb-1">Organization ID</div>
                <div className="font-mono text-sm text-zinc-900">{orgId}</div>
              </div>
              <div className="bg-zinc-50 rounded-lg p-4">
                <div className="text-sm text-zinc-500 mb-1">Your Role</div>
                <div className="font-medium text-zinc-900">
                  {isOwner ? 'Owner' : 'Member'}
                </div>
              </div>
              <div className="bg-zinc-50 rounded-lg p-4">
                <div className="text-sm text-zinc-500 mb-1">Quick Action</div>
                <Link
                  href="/feedback/new"
                  className="text-zinc-900 font-medium hover:text-zinc-700 transition-colors"
                >
                  Send Feedback →
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Member Management (Owner Only) */}
        {isOwner && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Add Member */}
            <div className="bg-white rounded-lg p-6 border border-zinc-200">
              <h2 className="text-xl font-bold text-zinc-900 mb-4">
                Add Member
              </h2>
              <p className="text-zinc-600 mb-6 text-sm">
                Add new members to your organization by entering their wallet address.
              </p>
              
              <form onSubmit={handleAddMember} className="space-y-4">
                <div>
                  <label htmlFor="newMember" className="block text-sm font-medium text-zinc-700 mb-2">
                    Member Wallet Address
                  </label>
                  <input
                    type="text"
                    id="newMember"
                    value={newMemberAddress}
                    onChange={(e) => setNewMemberAddress(e.target.value)}
                    placeholder="0x..."
                    className="w-full px-4 py-3 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-zinc-500 focus:border-transparent outline-none transition-colors font-mono text-sm"
                    disabled={isAddingMember || isConfirming}
                  />
                </div>
                
                <button
                  type="submit"
                  disabled={isAddingMember || isConfirming || !newMemberAddress.trim()}
                  className="w-full bg-green-600 text-white px-4 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isAddingMember || isConfirming ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                      <span>Adding...</span>
                    </div>
                  ) : (
                    'Add Member'
                  )}
                </button>
              </form>
            </div>

            {/* Remove Member */}
            <div className="bg-white rounded-lg p-6 border border-zinc-200">
              <h2 className="text-xl font-bold text-zinc-900 mb-4">
                Remove Member
              </h2>
              <p className="text-zinc-600 mb-6 text-sm">
                Remove members from your organization. Note: You cannot remove yourself as the owner.
              </p>
              
              <form onSubmit={handleRemoveMember} className="space-y-4">
                <div>
                  <label htmlFor="removeMember" className="block text-sm font-medium text-zinc-700 mb-2">
                    Member Wallet Address
                  </label>
                  <input
                    type="text"
                    id="removeMember"
                    value={removeMemberAddress}
                    onChange={(e) => setRemoveMemberAddress(e.target.value)}
                    placeholder="0x..."
                    className="w-full px-4 py-3 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-zinc-500 focus:border-transparent outline-none transition-colors font-mono text-sm"
                    disabled={isRemovingMember || isConfirming}
                  />
                </div>
                
                <button
                  type="submit"
                  disabled={isRemovingMember || isConfirming || !removeMemberAddress.trim()}
                  className="w-full bg-red-600 text-white px-4 py-3 rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isRemovingMember || isConfirming ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                      <span>Removing...</span>
                    </div>
                  ) : (
                    'Remove Member'
                  )}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Member View */}
        {!isOwner && (
          <div className="bg-white rounded-lg p-8 border border-zinc-200 text-center">
            <h2 className="text-xl font-bold text-zinc-900 mb-4">
              Organization Member
            </h2>
            <p className="text-zinc-600 mb-6">
              You are a member of this organization. You can send and receive feedback within this team.
            </p>
            <Link
              href="/feedback/new"
              className="inline-block bg-zinc-900 text-white px-6 py-3 rounded-lg font-medium hover:bg-zinc-800 transition-colors"
            >
              Send Feedback
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}