import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Sidebar from '@/components/Sidebar';
import { CONTRACT_ADDRESS } from '@/lib/config';
import { ORG_FEEDBACK_ABI } from '@/lib/abi';
import toast from 'react-hot-toast';

// Utility function to parse smart contract error messages
const parseContractError = (error) => {
  if (!error) return 'Unknown error occurred';
  
  console.log('🔍 Raw error object:', error);
  console.log('🔍 Error type:', typeof error);
  console.log('🔍 Error keys:', Object.keys(error));
  
  let errorMessage = '';
  
  // Handle different error object structures
  if (error.message) {
    errorMessage = error.message;
  } else if (error.details) {
    errorMessage = error.details;
  } else if (error.reason) {
    errorMessage = error.reason;
  } else if (typeof error === 'string') {
    errorMessage = error;
  } else {
    errorMessage = error.toString();
  }
  
  console.log('🔍 Parsed error message:', errorMessage);
  
  // Common smart contract error patterns
  if (errorMessage.includes('Already a member')) {
    return 'This address is already a member of the organization';
  }
  if (errorMessage.includes('Not a member')) {
    return 'This address is not a member of the organization';
  }
  if (errorMessage.includes('Must be a member first')) {
    return 'Address must be a member before becoming a moderator';
  }
  if (errorMessage.includes('Already a moderator')) {
    return 'This address is already a moderator';
  }
  if (errorMessage.includes('Not a moderator')) {
    return 'This address is not a moderator';
  }
  if (errorMessage.includes('Not org owner')) {
    return 'Only the organization owner can perform this action';
  }
  if (errorMessage.includes('Not org owner or moderator')) {
    return 'Only owners and moderators can perform this action';
  }
  if (errorMessage.includes('Cannot remove owner')) {
    return 'Cannot remove the organization owner';
  }
  if (errorMessage.includes('Org does not exist')) {
    return 'Organization does not exist';
  }
  if (errorMessage.includes('You already own an org')) {
    return 'You already own an organization';
  }
  if (errorMessage.includes('execution reverted')) {
    // Try to extract the actual error message from the revert
    const match = errorMessage.match(/execution reverted: (.+)/);
    if (match && match[1]) {
      return match[1];
    }
    return 'Transaction failed - please check your input and try again';
  }
  if (errorMessage.includes('Internal JSON-RPC error')) {
    // This is a generic error, try to get more specific info
    if (error.data) {
      console.log('🔍 Error data:', error.data);
    }
    if (error.error) {
      console.log('🔍 Nested error:', error.error);
    }
    return 'Transaction failed - the address may already be a member or you may not have permission';
  }
  
  // Handle ContractFunctionExecutionError specifically
  if (errorMessage.includes('ContractFunctionExecutionError')) {
    if (errorMessage.includes('addMember')) {
      return 'This address is already a member of the organization';
    }
    if (errorMessage.includes('removeMember')) {
      return 'This address is not a member of the organization';
    }
    if (errorMessage.includes('addModerator')) {
      return 'Address must be a member before becoming a moderator';
    }
    if (errorMessage.includes('removeModerator')) {
      return 'This address is not a moderator';
    }
    if (errorMessage.includes('createOrganization')) {
      return 'You already own an organization';
    }
    if (errorMessage.includes('updateLogo')) {
      return 'Failed to update logo - you may not have permission';
    }
    return 'Transaction failed - please check your input and try again';
  }
  
  return `Transaction failed: ${errorMessage}`;
};

export default function OrgPage() {
  const { address, isConnected } = useAccount();
  const router = useRouter();
  const [orgName, setOrgName] = useState('');
  const [orgDescription, setOrgDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [ownedOrg, setOwnedOrg] = useState(null);
  const [isHydrated, setIsHydrated] = useState(false);

  const { writeContract, data: hash, error } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess: isConfirmed, error: receiptError } = useWaitForTransactionReceipt({
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
        logoIpfsCid: orgMetadata[2],
        owner: orgMetadata[3],
      });
      
      // Redirect to organization management page if user owns an organization
      if (address && isHydrated) {
        router.push(`/org/${address}`);
      }
    }
  }, [orgMetadata, address, isHydrated, router]);

  useEffect(() => {
    if (isConfirmed) {
      if (isCreating) {
        setIsCreating(false);
        toast.success('Organization created successfully!');
        setOrgName('');
        setOrgDescription('');
        // Refresh the page to show the new organization
        window.location.reload();
      }
    }
  }, [isConfirmed, isCreating]);

  useEffect(() => {
    console.log('🔍 Error useEffect triggered, error:', error);
    if (error) {
      setIsCreating(false);
      
      const errorMessage = parseContractError(error);
      toast.error(errorMessage);
      console.error('Transaction error:', error);
    }
  }, [error]);

  // Also handle errors from useWaitForTransactionReceipt
  useEffect(() => {
    if (receiptError && !isConfirming) {
      console.log('🔍 Error from useWaitForTransactionReceipt:', receiptError);
      setIsCreating(false);
      setIsUpdatingLogo(false);
      
      const errorMessage = parseContractError(receiptError);
      toast.error(errorMessage);
      console.error('Transaction receipt error:', receiptError);
    }
  }, [receiptError, isConfirming]);

  // Fix hydration mismatch by ensuring client-side only rendering
  useEffect(() => {
    setIsHydrated(true);
  }, []);

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
      const errorMessage = parseContractError(err);
      toast.error(errorMessage);
      console.error('Error creating organization:', err);
    }
  };



  if (!isConnected) {
    return (
      <div className="min-h-screen flex">
        <Sidebar />
        <div className="flex-1 p-8 lg:p-12">
          <div className="w-full">
            <h1 className="text-4xl font-bold text-gray-800 mb-2">
              Organization Management
            </h1>
            <p className="text-gray-600 text-lg mb-8">
              Create and manage your organizations
            </p>
            <div className="glass-card-solid p-8 mb-8">
              <div className="animate-pulse">
                {/* Title skeleton */}
                <div className="h-8 bg-gray-300 rounded w-1/3 mb-6"></div>
                
                <div className="mb-6">
                  {/* Organization Logo skeleton */}
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="w-16 h-16 bg-gray-300 rounded-lg"></div>
                    <div>
                      <div className="h-6 bg-gray-300 rounded w-32 mb-1"></div>
                      <div className="h-4 bg-gray-300 rounded w-48"></div>
                    </div>
                  </div>
                  
                  {/* Organization ID skeleton */}
                  <div className="h-4 bg-gray-300 rounded w-64 mb-4"></div>
                  
                  {/* Optional CID skeleton */}
                  <div className="h-4 bg-gray-300 rounded w-48"></div>
                </div>

                {/* Logo Update Section skeleton */}
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <div className="h-4 bg-gray-300 rounded w-40 mb-3"></div>
                  <div className="flex gap-3">
                    <div className="flex-1 h-10 bg-gray-300 rounded-lg"></div>
                    <div className="w-28 h-10 bg-gray-300 rounded-lg"></div>
                  </div>
                  <div className="h-3 bg-gray-300 rounded w-3/4 mt-2"></div>
                </div>

                {/* Buttons skeleton */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="h-12 bg-gray-300 rounded-lg flex-1"></div>
                  <div className="h-12 bg-gray-300 rounded-lg flex-1"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Always render the same basic structure to prevent hydration mismatch
  if (!isHydrated) {
    return (
      <div className="min-h-screen flex">
        <Sidebar />
        <div className="flex-1 p-8 lg:p-12">
          <div className="w-full">
            <h1 className="text-4xl font-bold text-gray-800 mb-2">
              Organization Management
            </h1>
            <p className="text-gray-600 text-lg mb-8">
              Create and manage your organizations
            </p>
            <div className="glass-card-solid p-8 mb-8">
              <div className="animate-pulse">
                {/* Title skeleton */}
                <div className="h-8 bg-gray-300 rounded w-1/3 mb-6"></div>
                
                <div className="mb-6">
                  {/* Organization Logo skeleton */}
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="w-16 h-16 bg-gray-300 rounded-lg"></div>
                    <div>
                      <div className="h-6 bg-gray-300 rounded w-32 mb-1"></div>
                      <div className="h-4 bg-gray-300 rounded w-48"></div>
                    </div>
                  </div>
                  
                  {/* Organization ID skeleton */}
                  <div className="h-4 bg-gray-300 rounded w-64 mb-4"></div>
                  
                  {/* Optional CID skeleton */}
                  <div className="h-4 bg-gray-300 rounded w-48"></div>
                </div>

                {/* Logo Update Section skeleton */}
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <div className="h-4 bg-gray-300 rounded w-40 mb-3"></div>
                  <div className="flex gap-3">
                    <div className="flex-1 h-10 bg-gray-300 rounded-lg"></div>
                    <div className="w-28 h-10 bg-gray-300 rounded-lg"></div>
                  </div>
                  <div className="h-3 bg-gray-300 rounded w-3/4 mt-2"></div>
                </div>

                {/* Buttons skeleton */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="h-12 bg-gray-300 rounded-lg flex-1"></div>
                  <div className="h-12 bg-gray-300 rounded-lg flex-1"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isLoadingOrg || (isConnected && address && !isHydrated)) {
    return (
      <div className="min-h-screen flex">
        <Sidebar />
        <div className="flex-1 p-8 lg:p-12">
          <div className="w-full">
            <h1 className="text-4xl font-bold text-gray-800 mb-2">
              Organization Management
            </h1>
            <p className="text-gray-600 text-lg mb-8">
              Create and manage your organizations
            </p>
            <div className="glass-card-solid p-8 mb-8">
              <div className="animate-pulse">
                {/* Title skeleton */}
                <div className="h-8 bg-gray-300 rounded w-1/3 mb-6"></div>
                
                <div className="mb-6">
                  {/* Organization Logo skeleton */}
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="w-16 h-16 bg-gray-300 rounded-lg"></div>
                    <div>
                      <div className="h-6 bg-gray-300 rounded w-32 mb-1"></div>
                      <div className="h-4 bg-gray-300 rounded w-48"></div>
                    </div>
                  </div>
                  
                  {/* Organization ID skeleton */}
                  <div className="h-4 bg-gray-300 rounded w-64 mb-4"></div>
                  
                  {/* Optional CID skeleton */}
                  <div className="h-4 bg-gray-300 rounded w-48"></div>
                </div>

                {/* Logo Update Section skeleton */}
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <div className="h-4 bg-gray-300 rounded w-40 mb-3"></div>
                  <div className="flex gap-3">
                    <div className="flex-1 h-10 bg-gray-300 rounded-lg"></div>
                    <div className="w-28 h-10 bg-gray-300 rounded-lg"></div>
                  </div>
                  <div className="h-3 bg-gray-300 rounded w-3/4 mt-2"></div>
                </div>

                {/* Buttons skeleton */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="h-12 bg-gray-300 rounded-lg flex-1"></div>
                  <div className="h-12 bg-gray-300 rounded-lg flex-1"></div>
                </div>
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
        <div className="w-full">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">
          Organization Management
        </h1>
        <p className="text-gray-600 text-lg mb-8">
          Create and manage your organizations
        </p>

        {ownedOrg && isConnected && (
          // User owns an organization - show loading while redirecting
          <div className="glass-card-solid p-8 mb-8">
            <div className="text-center">
              <div className="animate-spin w-16 h-16 border-4 border-[#83785f] border-t-transparent rounded-full mx-auto mb-6"></div>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                Redirecting to Your Organization
              </h2>
              <p className="text-gray-600">
                Taking you to your organization management page...
              </p>
            </div>
          </div>
        )}

        {!ownedOrg && !isLoadingOrg && (
          // User doesn't own an organization yet
          <div className="glass-card-solid p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              Create Your Organization
            </h2>
            
                          <p className="text-gray-700 mb-8">
                Each wallet address can create only one organization. Once created, 
                you&apos;ll be able to add members and manage feedback for your team.
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
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#cfc7b5] focus:border-transparent outline-none transition-colors text-gray-800 placeholder-gray-500"
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
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#cfc7b5] focus:border-transparent outline-none transition-colors resize-none text-gray-800 placeholder-gray-500"
                  disabled={isCreating || isConfirming}
                />
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="text-sm font-medium text-gray-800 mb-3">
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