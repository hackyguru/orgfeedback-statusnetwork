import { useRouter } from 'next/router';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { useState, useEffect, useCallback } from 'react';
import Sidebar from '@/components/Sidebar';
import { CONTRACT_ADDRESS } from '@/lib/config';
import { ORG_FEEDBACK_ABI } from '@/lib/abi';
import toast from 'react-hot-toast';
import Link from 'next/link';
import Image from 'next/image';
import { MoreHorizontal, UserMinus, Shield, ShieldOff } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
 
} from '@/components/ui/dropdown-menu';

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
    console.log('🔍 Handling ContractFunctionExecutionError');
    console.log('🔍 Full error message:', errorMessage);
    
    // Check if it's an addMember error
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
    
    // If it's a ContractFunctionExecutionError with "Internal JSON-RPC error"
    if (errorMessage.includes('Internal JSON-RPC error')) {
      return 'Transaction failed - the address may already be a member or you may not have permission';
    }
    
    return 'Transaction failed - please check your input and try again';
  }
  
  return `Transaction failed: ${errorMessage}`;
};

export default function OrgDetailPage() {
  const router = useRouter();
  const { orgId } = router.query;
  const { address, isConnected } = useAccount();
  const [newMemberAddress, setNewMemberAddress] = useState('');
  const [orgData, setOrgData] = useState(null);
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  
  // Logo update state
  const [orgLogo, setOrgLogo] = useState('');
  const [isUpdatingLogo, setIsUpdatingLogo] = useState(false);
  
  // Dropdown action state
  const [selectedMemberForAction, setSelectedMemberForAction] = useState('');
  const [isPerformingAction, setIsPerformingAction] = useState(false);

  const { writeContract, data: hash, error, isError, isPending } = useWriteContract();
  
  // Debug: Log whenever error changes
  useEffect(() => {
    console.log('🔍 useWriteContract error state changed:', error);
    console.log('🔍 isError state:', isError);
    console.log('🔍 isPending state:', isPending);
    if (error) {
      console.log('🔍 Error detected in useWriteContract!');
      console.log('🔍 Error object:', error);
      console.log('🔍 Error message:', error.message);
      console.log('🔍 Error details:', error.details);
    }
  }, [error, isError, isPending]);
  
  const { isLoading: isConfirming, isSuccess: isConfirmed, error: receiptError } = useWaitForTransactionReceipt({
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

  // Check if current user is a moderator
  const { data: isModerator } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: ORG_FEEDBACK_ABI,
    functionName: 'isModerator',
    args: orgId && address ? [orgId, address] : undefined,
    enabled: !!(orgId && address),
  });

  // Check if current user is the owner (using orgMetadata directly)
  const isCurrentUserOwner = address && orgMetadata && address.toLowerCase() === orgMetadata[3]?.toLowerCase();
  
  // Debug: Log owner check details
  useEffect(() => {
    if (address && orgMetadata) {
      console.log('🔍 Owner Check Details:');
      console.log('  Current address:', address);
      console.log('  Owner from metadata:', orgMetadata[3]);
      console.log('  Address match:', address.toLowerCase() === orgMetadata[3]?.toLowerCase());
      console.log('  isCurrentUserOwner:', isCurrentUserOwner);
    }
  }, [address, orgMetadata, isCurrentUserOwner]);

  // Additional debug: Direct contract state verification
  useEffect(() => {
    const verifyContractState = async () => {
      if (address && orgId) {
        try {
          console.log('🔍 Direct Contract State Verification:');
          console.log('  Address:', address);
          console.log('  OrgId:', orgId);
          console.log('  Contract Address:', CONTRACT_ADDRESS);
          
          // We'll add direct contract calls here if needed
          console.log('  UI thinks user is owner:', isCurrentUserOwner);
          console.log('  UI thinks user is member:', isMember);
          console.log('  UI thinks user is moderator:', isModerator);
          
          // Check if we're on the right network
          console.log('  Network check - this should match Hardhat testnet');
        } catch (error) {
          console.log('🔍 Contract verification error:', error);
        }
      }
    };
    
    verifyContractState();
  }, [address, orgId, isCurrentUserOwner, isMember, isModerator]);

  // Get organization members using ethers.js directly instead of wagmi
  const [orgMembers, setOrgMembers] = useState();
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [membersError, setMembersError] = useState(null);

  const fetchMembers = useCallback(async () => {
    if (!orgId || !(isMember || isCurrentUserOwner || isModerator)) return;
    
    setIsLoadingMembers(true);
    setMembersError(null);
    
    try {
      const { ethers } = await import('ethers');
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, ORG_FEEDBACK_ABI, signer);
      
      const members = await contract.getOrgMembers(orgId);
      setOrgMembers(members);
      console.log('✅ Members fetched successfully:', members);
    } catch (error) {
      console.log('❌ Error fetching members:', error);
      setMembersError(error);
    } finally {
      setIsLoadingMembers(false);
    }
  }, [orgId, isMember, isCurrentUserOwner, isModerator]);

  // Fetch members when conditions are met
  useEffect(() => {
    if (orgId && (isMember || isCurrentUserOwner || isModerator) && !orgMembers && !isLoadingMembers) {
      fetchMembers();
    }
  }, [orgId, isMember, isCurrentUserOwner, isModerator, orgMembers, isLoadingMembers, fetchMembers]);

  const refetchMembers = useCallback(() => {
    setOrgMembers(undefined);
    fetchMembers();
  }, [fetchMembers]);

  // Add a manual fallback mechanism
  const handleManualFallback = async () => {
    console.log('🔍 Manual fallback triggered');
    try {
      // Try different RPC endpoints
      const rpcUrls = [
        'https://public.sepolia.rpc.status.network',
        'https://sepolia.status.network',
        'https://rpc.sepolia.status.network'
      ];
      
      for (const rpcUrl of rpcUrls) {
        try {
          console.log(`🔍 Trying RPC: ${rpcUrl}`);
          const response = await fetch(rpcUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              jsonrpc: '2.0',
              method: 'eth_call',
              params: [{
                to: CONTRACT_ADDRESS,
                data: '0x' + 'getOrgMembers(address)'.slice(0, 10) + '000000000000000000000000' + orgId.slice(2),
              }, 'latest'],
              id: 1
            })
          });
          
          const result = await response.json();
          if (result.result) {
            console.log('✅ Fallback succeeded with RPC:', rpcUrl);
            console.log('Result:', result);
            return;
          }
        } catch (error) {
          console.log(`❌ RPC ${rpcUrl} failed:`, error.message);
        }
      }
      
      console.log('❌ All RPC endpoints failed');
    } catch (error) {
      console.log('❌ Fallback mechanism failed:', error);
    }
  };

  // Remove the retry mechanism since we're using ethers.js directly

  // Debug: Log when getOrgMembers is enabled/disabled
  useEffect(() => {
    console.log('🔍 getOrgMembers Hook Debug:');
    console.log('  orgId:', orgId);
    console.log('  isMember:', isMember);
    console.log('  isCurrentUserOwner:', isCurrentUserOwner);
    console.log('  isModerator:', isModerator);
    console.log('  enabled condition:', !!(orgId && (isMember || isCurrentUserOwner || isModerator)));
    console.log('  isLoadingMembers:', isLoadingMembers);
    console.log('  membersError:', membersError);
  }, [orgId, isMember, isCurrentUserOwner, isModerator, isLoadingMembers, membersError]);

  // Debug: Log the conditions for getOrgMembers
  useEffect(() => {
    console.log('🔍 getOrgMembers Debug:');
    console.log('  orgId:', orgId);
    console.log('  address:', address);
    console.log('  orgMetadata:', orgMetadata);
    console.log('  orgMetadata[3] (owner from metadata):', orgMetadata?.[3]);
    console.log('  isMember:', isMember);
    console.log('  isCurrentUserOwner:', isCurrentUserOwner);
    console.log('  isModerator:', isModerator);
    console.log('  enabled condition:', !!(orgId && (isMember || isCurrentUserOwner || isModerator)));
    console.log('  orgMembers:', orgMembers);
    console.log('  isLoadingMembers:', isLoadingMembers);
    console.log('  membersError:', membersError);
    
    // Check if there's a mismatch
    if (address && orgMetadata) {
      const addressLower = address.toLowerCase();
      const ownerLower = orgMetadata[3]?.toLowerCase();
      console.log('🔍 Address comparison:');
      console.log('  Current address:', addressLower);
      console.log('  Owner from metadata:', ownerLower);
      console.log('  Match:', addressLower === ownerLower);
    }
  }, [orgId, address, orgMetadata, isMember, isCurrentUserOwner, isModerator, orgMembers, isLoadingMembers, membersError]);

  useEffect(() => {
    if (orgMetadata) {
      setOrgData({
        name: orgMetadata[0],
        description: orgMetadata[1],
        logoIpfsCid: orgMetadata[2],
        owner: orgMetadata[3],
      });
    }
  }, [orgMetadata]);

  useEffect(() => {
    if (isConfirmed) {
      setIsAddingMember(false);
      setNewMemberAddress('');
      toast.success('Operation completed successfully!');
      // Refetch member list
      refetchMembers();
    }
  }, [isConfirmed, refetchMembers]);

  useEffect(() => {
    console.log('🔍 Error useEffect triggered, error:', error);
    console.log('🔍 isError state in error handler:', isError);
    if (error || isError) {
      console.log('🔍 Processing error in main error handler');
      console.log('🔍 Error type:', typeof error);
      console.log('🔍 Error constructor:', error?.constructor?.name);
      console.log('🔍 Error keys:', Object.keys(error || {}));
      
      setIsAddingMember(false);
      
      const errorMessage = parseContractError(error || { message: 'Transaction failed' });
      console.log('🔍 Parsed error message:', errorMessage);
      toast.error(errorMessage);
      console.error('Transaction error:', error);
    }
  }, [error, isError]);

  // Also handle errors from useWaitForTransactionReceipt
  useEffect(() => {
    console.log('🔍 useWaitForTransactionReceipt error check:', receiptError);
    if (receiptError && !isConfirming) {
      console.log('🔍 Error from useWaitForTransactionReceipt:', receiptError);
      console.log('🔍 Receipt error type:', typeof receiptError);
      console.log('🔍 Receipt error constructor:', receiptError?.constructor?.name);
      
      setIsAddingMember(false);
      
      const errorMessage = parseContractError(receiptError);
      toast.error(errorMessage);
      console.error('Transaction receipt error:', receiptError);
    }
  }, [receiptError, isConfirming]);

  // Fix hydration mismatch by ensuring client-side only rendering
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Add global error handler for unhandled errors
  useEffect(() => {
    const handleUnhandledError = (event) => {
      console.log('🔍 Global error handler caught:', event.error);
      console.log('🔍 Error message:', event.error?.message);
      console.log('🔍 Error type:', typeof event.error);
      
      if (event.error && event.error.message && (
        event.error.message.includes('ContractFunctionExecutionError') ||
        event.error.message.includes('Internal JSON-RPC error')
      )) {
        event.preventDefault(); // Prevent default error handling
        setIsAddingMember(false);
        
        const errorMessage = parseContractError(event.error);
        toast.error(errorMessage);
        console.error('Global error handler caught:', event.error);
      }
    };

    const handleUnhandledRejection = (event) => {
      console.log('🔍 Global unhandled rejection caught:', event.reason);
      console.log('🔍 Rejection reason:', event.reason?.message);
      console.log('🔍 Rejection type:', typeof event.reason);
      
      if (event.reason && event.reason.message && (
        event.reason.message.includes('ContractFunctionExecutionError') ||
        event.reason.message.includes('Internal JSON-RPC error')
      )) {
        event.preventDefault(); // Prevent default error handling
        setIsAddingMember(false);
        
        const errorMessage = parseContractError(event.reason);
        toast.error(errorMessage);
        console.error('Global unhandled rejection caught:', event.reason);
      }
    };

    // Also catch React errors
    const originalConsoleError = console.error;
    console.error = (...args) => {
      const errorMessage = args.join(' ');
      if (errorMessage.includes('ContractFunctionExecutionError') || errorMessage.includes('Internal JSON-RPC error')) {
        console.log('🔍 Caught error via console.error override:', errorMessage);
        setIsAddingMember(false);
        
        toast.error('Transaction failed - the address may already be a member or you may not have permission');
        return; // Don't log the original error
      }
      originalConsoleError.apply(console, args);
    };

    window.addEventListener('error', handleUnhandledError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleUnhandledError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      console.error = originalConsoleError; // Restore original console.error
    };
  }, []);

  // Handle transaction success
  useEffect(() => {
    if (isConfirmed) {
      if (isAddingMember) {
        setIsAddingMember(false);
        toast.success('Member added successfully!');
        setNewMemberAddress('');
        // Refresh the page to show the new member
        window.location.reload();
      } else if (isUpdatingLogo) {
        setIsUpdatingLogo(false);
        toast.success('Logo updated successfully!');
        setOrgLogo('');
        // Refresh the page to show the updated logo
        window.location.reload();
      } else if (isPerformingAction) {
        setIsPerformingAction(false);
        setSelectedMemberForAction('');
        toast.success('Action completed successfully!');
        // Refresh the page to show the updated member list
        window.location.reload();
      }
    }
  }, [isConfirmed, isAddingMember, isUpdatingLogo, isPerformingAction]);

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
      console.log('🔍 Attempting to add member:', newMemberAddress.trim());
      setIsAddingMember(true);
      
      // Check if the address is already a member before attempting to add
      console.log('🔍 Checking if address is already a member...');
      
      // Call writeContract - errors will be handled by the error state
      try {
        writeContract({
          address: CONTRACT_ADDRESS,
          abi: ORG_FEEDBACK_ABI,
          functionName: 'addMember',
          args: [orgId, newMemberAddress.trim()],
        });
        console.log('🔍 writeContract called successfully');
      } catch (syncError) {
        console.log('🔍 Caught synchronous error in writeContract:', syncError);
        setIsAddingMember(false);
        const errorMessage = parseContractError(syncError);
        toast.error(errorMessage);
        console.error('Synchronous error in writeContract:', syncError);
        return;
      }
      
      // Add a timeout to check for errors that might not be caught immediately
      setTimeout(() => {
        console.log('🔍 Timeout check - isError:', isError);
        console.log('🔍 Timeout check - error:', error);
        console.log('🔍 Timeout check - receiptError:', receiptError);
        if (isError || error || receiptError) {
          console.log('🔍 Detected error via timeout check');
          setIsAddingMember(false);
          toast.error('Transaction failed - the address may already be a member or you may not have permission');
        }
      }, 2000);
      
    } catch (err) {
      console.log('🔍 Caught error in handleAddMember:', err);
      setIsAddingMember(false);
      const errorMessage = parseContractError(err);
      toast.error(errorMessage);
      console.error('Error adding member:', err);
    }
  };



  const handleUpdateLogo = async (e) => {
    e.preventDefault();
    
    if (!orgLogo.trim()) {
      toast.error('Please enter a Codex CID for the logo');
      return;
    }

    if (!isConnected) {
      toast.error('Please connect your wallet');
      return;
    }

    if (!isCurrentUserOwner) {
      toast.error('Only the organization owner can update the logo');
      return;
    }

    try {
      setIsUpdatingLogo(true);
      writeContract({
        address: CONTRACT_ADDRESS,
        abi: ORG_FEEDBACK_ABI,
        functionName: 'updateLogo',
        args: [orgId, orgLogo.trim()],
      });
    } catch (err) {
      setIsUpdatingLogo(false);
      const errorMessage = parseContractError(err);
      toast.error(errorMessage);
      console.error('Error updating logo:', err);
    }
  };

  // Dropdown action handlers
  const handleDropdownRemoveMember = async (memberAddress) => {
    if (!memberAddress.trim()) {
      toast.error('Invalid member address');
      return;
    }

    if (memberAddress.toLowerCase() === orgData.owner.toLowerCase()) {
      toast.error('Cannot remove the organization owner');
      return;
    }

    if (memberAddress.toLowerCase() === address?.toLowerCase()) {
      toast.error('Cannot remove yourself');
      return;
    }

    try {
      setIsPerformingAction(true);
      setSelectedMemberForAction(memberAddress);
      writeContract({
        address: CONTRACT_ADDRESS,
        abi: ORG_FEEDBACK_ABI,
        functionName: 'removeMember',
        args: [orgId, memberAddress.trim()],
      });
    } catch (err) {
      setIsPerformingAction(false);
      setSelectedMemberForAction('');
      const errorMessage = parseContractError(err);
      toast.error(errorMessage);
      console.error('Error removing member:', err);
    }
  };

  const handleDropdownAddModerator = async (memberAddress) => {
    if (!memberAddress.trim()) {
      toast.error('Invalid member address');
      return;
    }

    try {
      setIsPerformingAction(true);
      setSelectedMemberForAction(memberAddress);
      writeContract({
        address: CONTRACT_ADDRESS,
        abi: ORG_FEEDBACK_ABI,
        functionName: 'addModerator',
        args: [orgId, memberAddress.trim()],
      });
    } catch (err) {
      setIsPerformingAction(false);
      setSelectedMemberForAction('');
      const errorMessage = parseContractError(err);
      toast.error(errorMessage);
      console.error('Error adding moderator:', err);
    }
  };

  const handleDropdownRemoveModerator = async (memberAddress) => {
    if (!memberAddress.trim()) {
      toast.error('Invalid member address');
      return;
    }

    if (memberAddress.toLowerCase() === orgData.owner.toLowerCase()) {
      toast.error('Cannot remove moderator status from the organization owner');
      return;
    }

    try {
      setIsPerformingAction(true);
      setSelectedMemberForAction(memberAddress);
      writeContract({
        address: CONTRACT_ADDRESS,
        abi: ORG_FEEDBACK_ABI,
        functionName: 'removeModerator',
        args: [orgId, memberAddress.trim()],
      });
    } catch (err) {
      setIsPerformingAction(false);
      setSelectedMemberForAction('');
      const errorMessage = parseContractError(err);
      toast.error(errorMessage);
      console.error('Error removing moderator:', err);
    }
  };

  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Function to check if a member is a moderator
  const checkModeratorStatus = useCallback(async (memberAddress) => {
    try {
      const { ethers } = await import('ethers');
      const provider = new ethers.BrowserProvider(window.ethereum);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, ORG_FEEDBACK_ABI, provider);
      
      const isModerator = await contract.isModerator(orgId, memberAddress);
      return isModerator;
    } catch (error) {
      console.log('Error checking moderator status:', error);
      return false;
    }
  }, [orgId]);

  // State to store moderator status for each member
  const [moderatorStatus, setModeratorStatus] = useState({});

  // Check moderator status for all members when orgMembers changes
  useEffect(() => {
    if (orgMembers && orgMembers.length > 0) {
      const checkAllModerators = async () => {
        const status = {};
        for (const member of orgMembers) {
          status[member] = await checkModeratorStatus(member);
        }
        setModeratorStatus(status);
      };
      checkAllModerators();
    }
  }, [orgMembers, checkModeratorStatus]);

  // Always render the same basic structure to prevent hydration mismatch
  if (!isHydrated) {
    return (
      <div className="min-h-screen flex">
        <Sidebar />
        <div className="flex-1 p-8 lg:p-12">
          <div className="w-full">
            <div className="glass-card-solid p-8 text-center">
              <div className="animate-pulse">
                <div className="h-8 bg-zinc-200 rounded w-1/2 mb-4 mx-auto"></div>
                <div className="h-4 bg-zinc-200 rounded w-full mb-2"></div>
                <div className="h-4 bg-zinc-200 rounded w-3/4 mx-auto"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen flex">
        <Sidebar />
        <div className="flex-1 p-8 lg:p-12">
          <div className="w-full">
            <div className="glass-card-solid p-8 text-center">
              <h1 className="text-3xl font-bold text-gray-800 mb-4">
                Organization Details
              </h1>
              <p className="text-gray-700 mb-6">
                Please connect your wallet to view organization details
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
          <div className="w-full">
            <div className="glass-card-solid p-8 text-center">
              <div className="animate-pulse">
                <div className="h-8 bg-zinc-200 rounded w-1/2 mb-4 mx-auto"></div>
                <div className="h-4 bg-zinc-200 rounded w-full mb-2"></div>
                <div className="h-4 bg-zinc-200 rounded w-3/4 mx-auto"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!orgData) {
    return (
      <div className="min-h-screen flex">
        <Sidebar />
        <div className="flex-1 p-8 lg:p-12">
          <div className="glass-card-solid p-8 text-center">
            <h1 className="text-2xl font-bold text-gray-800 mb-4">
              Organization Not Found
            </h1>
                          <p className="text-gray-700 mb-6">
                The organization you&apos;re looking for doesn&apos;t exist.
              </p>
            <Link
              href="/"
              className="inline-block bg-zinc-900 text-gray-800 px-6 py-3 rounded-lg font-medium hover:bg-zinc-800 transition-colors"
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
      <div className="min-h-screen flex">
        <Sidebar />
        <div className="flex-1 p-8 lg:p-12">
          <div className="glass-card-solid p-8 text-center">
            <h1 className="text-2xl font-bold text-gray-800 mb-4">
              Access Denied
            </h1>
            <p className="text-gray-700 mb-6">
              You are not a member of this organization.
            </p>
            <Link
              href="/"
              className="inline-block bg-zinc-900 text-gray-800 px-6 py-3 rounded-lg font-medium hover:bg-zinc-800 transition-colors"
            >
              Go Back Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      <Sidebar />
      
      <div className="flex-1 p-8 lg:p-12">
        {/* Organization Header */}
        <div className="mb-8">
          
          <div className="glass-card-solid p-8">
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-start space-x-6">
                {orgData.logoIpfsCid ? (
                  <Image
                    src={`https://thirdstorage.cloud/gateway/${orgData.logoIpfsCid}`}
                    alt={`${orgData.name} logo`}
                    width={80}
                    height={80}
                    className="w-20 h-20 rounded-xl object-cover border border-gray-200 shadow-sm"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                ) : null}
                <div className={`w-20 h-20 bg-[#83785f] rounded-xl flex items-center justify-center shadow-sm ${orgData.logoIpfsCid ? 'hidden' : 'flex'}`}>
                  <span className="text-white text-2xl font-bold">
                    {orgData.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-800 mb-2">
                    {orgData.name}
                  </h1>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    {orgData.description}
                  </p>
                  <div className="text-sm text-zinc-500">
                    Owner: {formatAddress(orgData.owner)}
                    {isOwner && <span className="ml-2" style={{ color: '#22262b' }}>(You)</span>}
                  </div>
                </div>
              </div>
              {isOwner && (
                <div className="px-3 py-1 rounded-full text-sm font-medium" style={{ background: '#cfc7b5', color: '#22262b' }}>
                  Organization Owner
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex flex-col rounded-lg p-4">
                <div className="text-sm text-zinc-500 mb-1">Organization ID</div>
                <div className="font-mono text-sm text-gray-800">{orgId}</div>
              </div>
              <div className="flex flex-col rounded-lg p-4">
                <div className="text-sm text-zinc-500 mb-1">Your Role</div>
                <div className="font-medium text-gray-800">
                  {isOwner ? 'Owner' : isModerator ? 'Moderator' : 'Member'}
                </div>
              </div>
              <div className="flex flex-col rounded-lg p-4">
                <div className="text-sm text-zinc-500 mb-1">Quick Action</div>
                <Link
                  href="/feedback/new"
                  className="text-gray-800 font-medium hover:text-zinc-700 transition-colors"
                >
                  Send Feedback →
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Logo Update and Add Member Section (Owner & Moderators) */}
        {(isOwner || isModerator) && (
          <div className="mb-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Update Organization Logo (Owner Only) */}
              {isOwner && (
                <div className="bg-white rounded-lg p-6 border border-zinc-200">
                  <h2 className="text-xl font-bold text-gray-800 mb-4">
                    Update Organization Logo
                  </h2>
                  <p className="text-gray-700 mb-6 text-sm">
                    Update your organization&apos;s logo by entering a Codex CID. Logo is optional and can be updated anytime.
                  </p>
                  
                  <form onSubmit={handleUpdateLogo} className="space-y-4">
                    <div>
                      <label htmlFor="orgLogo" className="block text-sm font-medium text-zinc-700 mb-2">
                        Logo Codex CID
                      </label>
                      <input
                        type="text"
                        id="orgLogo"
                        value={orgLogo}
                        onChange={(e) => setOrgLogo(e.target.value)}
                        placeholder="Enter Codex CID for logo (e.g., QmXxX...)"
                        className="w-full px-4 py-3 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-zinc-500 focus:border-transparent outline-none transition-colors font-mono text-sm"
                        disabled={isUpdatingLogo || isConfirming}
                      />
                    </div>
                    
                    <button
                      type="submit"
                      disabled={isUpdatingLogo || isConfirming || !orgLogo.trim()}
                      className="w-full px-4 py-3 bg-[#83785f] text-white rounded-lg font-semibold hover:bg-[#877f6c] transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                    >
                      {isUpdatingLogo || isConfirming ? (
                        <div className="flex items-center justify-center space-x-2">
                          <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                          <span>Updating...</span>
                        </div>
                      ) : (
                        'Update Logo'
                      )}
                    </button>
                  </form>
                </div>
              )}

              {/* Add Member */}
              <div className="bg-white rounded-lg p-6 border border-zinc-200">
                <h2 className="text-xl font-bold text-gray-800 mb-4">
                  Add Member
                </h2>
                <p className="text-gray-700 mb-6 text-sm">
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
                    className="w-full px-4 py-3 bg-[#83785f] text-white rounded-lg font-semibold hover:bg-[#877f6c] transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
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
            </div>
          </div>
        )}

        {/* Organization Members List */}
        {(isMember || isCurrentUserOwner || isModerator) && (
          <div className="mt-8">
            <div className="glass-card-solid p-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">
                Organization Members
              </h2>
              
              {orgMembers && orgMembers.length > 0 ? (
                <div className="space-y-3">
                  {orgMembers.map((memberAddress, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-[#83785f] rounded-full flex items-center justify-center">
                          <span className="text-white text-sm font-medium">
                            {memberAddress.slice(2, 4).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <div className="font-mono text-sm text-gray-800">
                            {formatAddress(memberAddress)}
                          </div>
                          <div className="text-xs text-gray-500">
                            {memberAddress.toLowerCase() === orgData.owner.toLowerCase() 
                              ? 'Owner' 
                              : moderatorStatus[memberAddress] 
                                ? 'Moderator' 
                                : 'Member'
                            }
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {memberAddress.toLowerCase() === address?.toLowerCase() && (
                          <span className="text-xs bg-[#cfc7b5] text-[#83785f] px-2 py-1 rounded-full font-medium">
                            You
                          </span>
                        )}
                        
                        {/* Dropdown Menu - Only show for owners and moderators, not for themselves */}
                        {(isOwner || isModerator) && memberAddress.toLowerCase() !== address?.toLowerCase() && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button className="p-1 hover:bg-gray-200 rounded-md transition-colors">
                                <MoreHorizontal className="h-4 w-4 text-gray-500" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              {/* Remove Member - Only for owners and moderators */}
                              {(isOwner || isModerator) && memberAddress.toLowerCase() !== orgData.owner.toLowerCase() && (
                                <DropdownMenuItem
                                  onClick={() => handleDropdownRemoveMember(memberAddress)}
                                  disabled={isPerformingAction && selectedMemberForAction === memberAddress}
                                  className="text-[#83785f] hover:text-[#877f6c] focus:text-[#877f6c] cursor-pointer"
                                >
                                  <UserMinus className="h-4 w-4 mr-2" />
                                  Remove Member
                                </DropdownMenuItem>
                              )}
                              
                              {/* Moderator Actions - Only for owners */}
                              {isOwner && memberAddress.toLowerCase() !== orgData.owner.toLowerCase() && (
                                <>
                                  {moderatorStatus[memberAddress] ? (
                                    <DropdownMenuItem
                                      onClick={() => handleDropdownRemoveModerator(memberAddress)}
                                      disabled={isPerformingAction && selectedMemberForAction === memberAddress}
                                      className="text-[#83785f] hover:text-[#877f6c] focus:text-[#877f6c] cursor-pointer"
                                    >
                                      <ShieldOff className="h-4 w-4 mr-2" />
                                      Remove Moderator
                                    </DropdownMenuItem>
                                  ) : (
                                    <DropdownMenuItem
                                      onClick={() => handleDropdownAddModerator(memberAddress)}
                                      disabled={isPerformingAction && selectedMemberForAction === memberAddress}
                                      className="text-[#83785f] hover:text-[#877f6c] focus:text-[#877f6c] cursor-pointer"
                                    >
                                      <Shield className="h-4 w-4 mr-2" />
                                      Promote to Moderator
                                    </DropdownMenuItem>
                                  )}
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">
                    No members found or loading...
                  </p>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                    <h4 className="text-lg font-semibold text-yellow-800 mb-2">🔍 Debug Information</h4>
                    <div className="text-sm text-yellow-700 space-y-2">
                      <p><strong>Connected Address:</strong> {address || 'Not connected'}</p>
                      <p><strong>Organization Owner:</strong> {orgData?.owner || 'Loading...'}</p>
                      <p><strong>Address Match:</strong> {address && orgData?.owner ? (address.toLowerCase() === orgData.owner.toLowerCase() ? '✅ Yes' : '❌ No') : 'Unknown'}</p>
                      <p><strong>Error:</strong> {membersError ? membersError.message : 'none'}</p>
                      <p><strong>Is Member:</strong> {isMember ? 'true' : 'false'}</p>
                      <p><strong>Is Owner:</strong> {isCurrentUserOwner ? 'true' : 'false'}</p>
                      <p><strong>Is Moderator:</strong> {isModerator ? 'true' : 'false'}</p>
                    </div>
                    <button
                      onClick={() => {
                        console.log('🔍 Manual retry triggered');
                        refetchMembers();
                      }}
                      className="mt-3 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
                    >
                      🔄 Retry getOrgMembers
                    </button>
                    <button
                      onClick={async () => {
                        console.log('🔍 Direct contract test triggered');
                        try {
                          const { readContract } = await import('@wagmi/core');
                          const result = await readContract({
                            address: CONTRACT_ADDRESS,
                            abi: ORG_FEEDBACK_ABI,
                            functionName: 'getOrgMembers',
                            args: [orgId],
                          });
                          console.log('✅ Direct call success:', result);
                        } catch (error) {
                          console.log('❌ Direct call failed:', error);
                        }
                      }}
                      className="mt-3 ml-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      🔧 Direct Contract Test
                    </button>
                    <button
                      onClick={async () => {
                        console.log('🔍 Raw ethereum call triggered');
                        try {
                          if (typeof window !== 'undefined' && window.ethereum) {
                            const result = await window.ethereum.request({
                              method: 'eth_call',
                              params: [{
                                to: CONTRACT_ADDRESS,
                                data: '0x' + 'getOrgMembers(address)'.slice(0, 10) + '000000000000000000000000' + orgId.slice(2),
                              }, 'latest']
                            });
                            console.log('✅ Raw ethereum call result:', result);
                          }
                        } catch (error) {
                          console.log('❌ Raw ethereum call failed:', error);
                        }
                      }}
                      className="mt-3 ml-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      🔧 Raw Ethereum Call
                    </button>
                    <button
                      onClick={handleManualFallback}
                      className="mt-3 ml-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      🔄 Manual Fallback
                    </button>
                    <button
                      onClick={async () => {
                        console.log('🔍 Ethers.js direct call triggered');
                        try {
                          const { ethers } = await import('ethers');
                          
                          // Create provider from window.ethereum
                          const provider = new ethers.BrowserProvider(window.ethereum);
                          
                          // Get signer
                          const signer = await provider.getSigner();
                          console.log('Signer address:', await signer.getAddress());
                          
                          // Create contract instance
                          const contract = new ethers.Contract(CONTRACT_ADDRESS, ORG_FEEDBACK_ABI, signer);
                          
                          // Call getOrgMembers
                          const members = await contract.getOrgMembers(orgId);
                          console.log('✅ Ethers.js call success:', members);
                          
                        } catch (error) {
                          console.log('❌ Ethers.js call failed:', error);
                        }
                      }}
                      className="mt-3 ml-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                    >
                      🔧 Ethers.js Direct Call
                    </button>
                    <button
                      onClick={async () => {
                        console.log('🔍 Network check triggered');
                        try {
                          // Check if we can access the window.ethereum object
                          if (typeof window !== 'undefined' && window.ethereum) {
                            console.log('🌐 Window.ethereum found');
                            
                            // Get the current network
                            const chainId = await window.ethereum.request({ method: 'eth_chainId' });
                            console.log('🔗 Chain ID:', chainId);
                            
                            // Get the current account
                            const accounts = await window.ethereum.request({ method: 'eth_accounts' });
                            console.log('👤 Current account:', accounts[0]);
                            
                            // Get network details
                            const networkVersion = await window.ethereum.request({ method: 'net_version' });
                            console.log('🌐 Network version:', networkVersion);
                            
                          } else {
                            console.log('❌ No window.ethereum found');
                          }
                        } catch (error) {
                          console.log('❌ Network check failed:', error);
                        }
                      }}
                      className="mt-3 ml-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      🌐 Check Network
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Debug Info - Show when member list is not visible */}
        {!(isMember || isCurrentUserOwner || isModerator) && (
          <div className="mt-8">
            <div className="glass-card-solid p-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">
                🔍 Debug Information
              </h2>
              <div className="space-y-2 text-sm">
                <p><strong>Connected Wallet:</strong> {address || 'Not connected'}</p>
                <p><strong>Organization Owner:</strong> {orgData?.owner || 'Loading...'}</p>
                <p><strong>Is Member:</strong> {isMember ? '✅ Yes' : '❌ No'}</p>
                <p><strong>Is Owner:</strong> {isCurrentUserOwner ? '✅ Yes' : '❌ No'}</p>
                <p><strong>Is Moderator:</strong> {isModerator ? '✅ Yes' : '❌ No'}</p>
                <p><strong>Member List Visible:</strong> ❌ No (need to be member/owner/moderator)</p>
                <p className="text-gray-600 mt-4">
                  💡 <strong>To see the member list:</strong> Connect with a wallet that is a member, owner, or moderator of this organization.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Member View */}
        {!isOwner && (
          <div className="glass-card-solid p-8 text-center">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              Organization Member
            </h2>
            <p className="text-gray-700 mb-6">
              You are a member of this organization. You can send and receive feedback within this team.
            </p>
            <Link
              href="/feedback/new"
              className="inline-block bg-zinc-900 text-gray-800 px-6 py-3 rounded-lg font-medium hover:bg-zinc-800 transition-colors"
            >
              Send Feedback
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}