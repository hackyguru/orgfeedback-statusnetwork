import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Sidebar from '@/components/Sidebar';
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
      <div className="min-h-screen flex">
        <Sidebar />
        <div className="flex-1 p-8 lg:p-12">
          <div className="max-w-6xl mx-auto">
            <div className="glass-card-solid p-8 text-center">
              <h1 className="text-3xl font-bold text-gray-800 mb-4">
                Organization Management
              </h1>
              <p className="text-gray-700 mb-6">
                Use the sidebar to connect your wallet and manage organizations
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isLoadingOrg) {
    return (
      <div className="min-h-screen flex">
        <Sidebar />
        <div className="flex-1 p-8 lg:p-12">
          <div className="max-w-6xl mx-auto">
            <div className="glass-card-solid p-8">
              <div className="animate-pulse">
                <div className="h-8 bg-gray-300 rounded w-1/2 mb-4"></div>
                <div className="h-4 bg-gray-300 rounded w-full mb-2"></div>
                <div className="h-4 bg-gray-300 rounded w-3/4"></div>
              </div>
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
        <h1 className="text-3xl font-bold text-gray-800 mb-6">
          Organization Management
        </h1>

        {ownedOrg ? (
          // User already owns an organization
          <div className="glass-card-solid p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              Your Organization
            </h2>
            
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                {ownedOrg.name}
              </h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                {ownedOrg.description}
              </p>
              <div className="text-sm text-zinc-500 font-mono">
                Organization ID: {address}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => router.push(`/org/${address}`)}
                className="px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition-all transform hover:scale-105"
                style={{ background: '#22262b', color: '#ffffff' }}
              >
                Manage Members
              </button>
              <button
                onClick={() => router.push('/feedback/new')}
                className="px-6 py-3 rounded-lg font-medium hover:opacity-90 transition-all transform hover:scale-105"
                style={{ background: '#cfc7b5', color: '#22262b' }}
              >
                Send Feedback
              </button>
            </div>
          </div>
        ) : (
          // User doesn't own an organization yet
          <div className="glass-card-solid p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              Create Your Organization
            </h2>
            
            <p className="text-gray-700 mb-8">
              Each wallet address can create only one organization. Once created, 
              you'll be able to add members and manage feedback for your team.
            </p>

            <form onSubmit={handleCreateOrganization} className="space-y-6">
              <div>
                <label htmlFor="orgName" className="block text-sm font-medium text-gray-700 mb-2">
                  Organization Name *
                </label>
                <input
                  type="text"
                  id="orgName"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  placeholder="Enter your organization name"
                  className="w-full px-4 py-3 bg-gray-100 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#cfc7b5] focus:border-transparent outline-none transition-colors text-gray-800 placeholder-gray-500"
                  disabled={isCreating || isConfirming}
                />
              </div>

              <div>
                <label htmlFor="orgDescription" className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  id="orgDescription"
                  value={orgDescription}
                  onChange={(e) => setOrgDescription(e.target.value)}
                  placeholder="Describe your organization and its purpose"
                  rows={4}
                  className="w-full px-4 py-3 bg-gray-100 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#cfc7b5] focus:border-transparent outline-none transition-colors resize-none text-gray-800 placeholder-gray-500"
                  disabled={isCreating || isConfirming}
                />
              </div>

              <div className="glass-card p-4">
                <h4 className="font-medium text-gray-800 mb-2">
                  Important Notes:
                </h4>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• Each wallet can only create one organization</li>
                  <li>• You will automatically become a member of your organization</li>
                  <li>• Organization ID will be your wallet address</li>
                  <li>• You can add and remove members after creation</li>
                </ul>
              </div>

              <button
                type="submit"
                disabled={isCreating || isConfirming || !orgName.trim() || !orgDescription.trim()}
                className="w-full px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                style={{ background: '#22262b', color: '#ffffff' }}
              >
                {isCreating || isConfirming ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin h-4 w-4 border-2 border-gray-600 border-t-transparent rounded-full"></div>
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
    </div>
  );
}