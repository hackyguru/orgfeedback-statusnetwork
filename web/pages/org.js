import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Navbar from '@/components/Navbar';
import { CONTRACT_ADDRESS } from '@/lib/config';
import { ORG_FEEDBACK_ABI } from '@/lib/abi';
import toast from 'react-hot-toast';

export default function OrgPage() {
  const { address, isConnected } = useAccount();
  const router = useRouter();
  const [orgName, setOrgName] = useState('');
  const [orgDescription, setOrgDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [ownedOrg, setOwnedOrg] = useState(null);

  const { writeContract, data: hash, error } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  // Check if user already owns an organization
  const { data: orgMetadata, isLoading: isLoadingOrg } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: ORG_FEEDBACK_ABI,
    functionName: 'getOrgMetadata',
    args: address ? [address] : undefined,
    enabled: !!address,
  });

  useEffect(() => {
    if (orgMetadata && orgMetadata[0]) {
      setOwnedOrg({
        name: orgMetadata[0],
        description: orgMetadata[1],
        owner: orgMetadata[2],
      });
    }
  }, [orgMetadata]);

  useEffect(() => {
    if (isConfirmed) {
      setIsCreating(false);
      toast.success('Organization created successfully!');
      setOrgName('');
      setOrgDescription('');
      // Refresh the page to show the new organization
      window.location.reload();
    }
  }, [isConfirmed]);

  useEffect(() => {
    if (error) {
      setIsCreating(false);
      toast.error('Failed to create organization');
      console.error('Transaction error:', error);
    }
  }, [error]);

  const handleCreateOrganization = async (e) => {
    e.preventDefault();
    
    if (!orgName.trim() || !orgDescription.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    if (!isConnected) {
      toast.error('Please connect your wallet');
      return;
    }

    try {
      setIsCreating(true);
      writeContract({
        address: CONTRACT_ADDRESS,
        abi: ORG_FEEDBACK_ABI,
        functionName: 'createOrganization',
        args: [orgName.trim(), orgDescription.trim()],
      });
    } catch (err) {
      setIsCreating(false);
      toast.error('Failed to create organization');
      console.error('Error creating organization:', err);
    }
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-zinc-50">
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 py-16">
          <div className="bg-white rounded-lg p-8 border border-zinc-200 text-center">
            <h1 className="text-2xl font-bold text-zinc-900 mb-4">
              Organization Management
            </h1>
            <p className="text-zinc-600 mb-6">
              Please connect your wallet to manage organizations
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
        <div className="max-w-2xl mx-auto px-4 py-16">
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

  return (
    <div className="min-h-screen bg-zinc-50">
      <Navbar />
      
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-zinc-900 mb-8">
          Organization Management
        </h1>

        {ownedOrg ? (
          // User already owns an organization
          <div className="bg-white rounded-lg p-8 border border-zinc-200 mb-8">
            <h2 className="text-2xl font-bold text-zinc-900 mb-6">
              Your Organization
            </h2>
            
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-zinc-900 mb-2">
                {ownedOrg.name}
              </h3>
              <p className="text-zinc-600 leading-relaxed mb-4">
                {ownedOrg.description}
              </p>
              <div className="text-sm text-zinc-500">
                Organization ID: {address}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => router.push(`/org/${address}`)}
                className="bg-zinc-900 text-white px-6 py-3 rounded-lg font-medium hover:bg-zinc-800 transition-colors"
              >
                Manage Members
              </button>
              <button
                onClick={() => router.push('/feedback/new')}
                className="bg-zinc-100 text-zinc-800 px-6 py-3 rounded-lg font-medium hover:bg-zinc-200 transition-colors"
              >
                Send Feedback
              </button>
            </div>
          </div>
        ) : (
          // User doesn't own an organization yet
          <div className="bg-white rounded-lg p-8 border border-zinc-200">
            <h2 className="text-2xl font-bold text-zinc-900 mb-6">
              Create Your Organization
            </h2>
            
            <p className="text-zinc-600 mb-8">
              Each wallet address can create only one organization. Once created, 
              you'll be able to add members and manage feedback for your team.
            </p>

            <form onSubmit={handleCreateOrganization} className="space-y-6">
              <div>
                <label htmlFor="orgName" className="block text-sm font-medium text-zinc-700 mb-2">
                  Organization Name *
                </label>
                <input
                  type="text"
                  id="orgName"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  placeholder="Enter your organization name"
                  className="w-full px-4 py-3 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-zinc-500 focus:border-transparent outline-none transition-colors"
                  disabled={isCreating || isConfirming}
                />
              </div>

              <div>
                <label htmlFor="orgDescription" className="block text-sm font-medium text-zinc-700 mb-2">
                  Description *
                </label>
                <textarea
                  id="orgDescription"
                  value={orgDescription}
                  onChange={(e) => setOrgDescription(e.target.value)}
                  placeholder="Describe your organization and its purpose"
                  rows={4}
                  className="w-full px-4 py-3 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-zinc-500 focus:border-transparent outline-none transition-colors resize-none"
                  disabled={isCreating || isConfirming}
                />
              </div>

              <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-4">
                <h4 className="font-medium text-zinc-900 mb-2">
                  Important Notes:
                </h4>
                <ul className="text-sm text-zinc-600 space-y-1">
                  <li>• Each wallet can only create one organization</li>
                  <li>• You will automatically become a member of your organization</li>
                  <li>• Organization ID will be your wallet address</li>
                  <li>• You can add and remove members after creation</li>
                </ul>
              </div>

              <button
                type="submit"
                disabled={isCreating || isConfirming || !orgName.trim() || !orgDescription.trim()}
                className="w-full bg-zinc-900 text-white px-6 py-3 rounded-lg font-medium hover:bg-zinc-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCreating || isConfirming ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                    <span>
                      {isCreating ? 'Creating...' : 'Confirming...'}
                    </span>
                  </div>
                ) : (
                  'Create Organization'
                )}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}