import { useAccount, useReadContract } from 'wagmi';
import { useEffect, useState, useCallback } from 'react';
import Sidebar from '@/components/Sidebar';
import OrgCard from '@/components/OrgCard';
import { CONTRACT_ADDRESS } from '@/lib/config';
import { ORG_FEEDBACK_ABI } from '@/lib/abi';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import blockies from 'ethereum-blockies';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Building2, 
  Users, 
  Crown, 
  TrendingUp, 
  MessageSquare, 
  BarChart3, 
  Settings,
  Plus,
  Sparkles,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  MessageCircleReply,
  MessageCirclePlus,
  X
} from 'lucide-react';
import Image from 'next/image';


export default function Home() {
  const { address, isConnected } = useAccount();
  const [userOrgs, setUserOrgs] = useState<string[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);
  const [currentOrgIndex, setCurrentOrgIndex] = useState(0);
  const [isFeedbackRequestsOpen, setIsFeedbackRequestsOpen] = useState(false);
  const [isRequestFeedbackOpen, setIsRequestFeedbackOpen] = useState(false);
  const [requestAddresses, setRequestAddresses] = useState('');
  const [requestContent, setRequestContent] = useState('');

  const formatAddress = (address: string) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Mock feedback requests data
  const feedbackRequests = [
    {
      id: 1,
      address: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
      content: 'Hey can you give me some feedback on my recent project?',
      timestamp: '2 hours ago'
    },
    {
      id: 2,
      address: '0x8ba1f109551bD432803012645Hac136c772c3c7',
      content: 'I would really appreciate your thoughts on my presentation skills',
      timestamp: '1 day ago'
    },
    {
      id: 3,
      address: '0x1234567890123456789012345678901234567890',
      content: 'Can you review my code and provide some suggestions?',
      timestamp: '3 days ago'
    }
  ];

  const handleAcceptRequest = (requestId: number) => {
    // Handle accept logic here
    toast.success('Feedback request accepted!');
  };

  const handleRequestFeedback = () => {
    if (!requestAddresses.trim() || !requestContent.trim()) {
      toast.error('Please fill in all fields');
      return;
    }
    
    // Parse addresses
    const addresses = requestAddresses.split(',').map(addr => addr.trim()).filter(addr => addr);
    
    if (addresses.length === 0) {
      toast.error('Please enter at least one valid address');
      return;
    }
    
    // Handle request logic here
    toast.success('Feedback request sent successfully!');
    setIsRequestFeedbackOpen(false);
    setRequestAddresses('');
    setRequestContent('');
  };

  const parseAddresses = (input: string) => {
    return input.split(',').map(addr => addr.trim()).filter(addr => addr);
  };

  // Fix hydration mismatch by ensuring client-side only rendering for connection state
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Get total organizations count
  const { data: totalOrgs } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: ORG_FEEDBACK_ABI,
    functionName: 'totalOrganizations',
  });

  // Get user's organizations
  const { data: organizations, isLoading: isLoadingOrgs } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: ORG_FEEDBACK_ABI,
    functionName: 'getOrganizationsByUser',
    args: address ? [address] : undefined,
  });

  // Get current organization metadata
  const { data: currentOrgMetadata } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: ORG_FEEDBACK_ABI,
    functionName: 'getOrgMetadata',
    args: userOrgs[currentOrgIndex] ? [userOrgs[currentOrgIndex]] : undefined,
  });

  // Get current organization members count - using a different approach since getOrgMembers requires owner/moderator permissions
  const [memberCount, setMemberCount] = useState<number | null>(null);

  // Function to count members by checking each known address
  const countMembers = useCallback(async () => {
    if (!userOrgs[currentOrgIndex]) return;
    
    try {
      const { ethers } = await import('ethers');
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, ORG_FEEDBACK_ABI, signer);
      
      // Get organization metadata to find the owner
      const orgMetadata = await contract.getOrgMetadata(userOrgs[currentOrgIndex]);
      const owner = orgMetadata[3];
      
      // Check if the current user is the owner or moderator
      const isOwner = address?.toLowerCase() === owner.toLowerCase();
      const isModerator = await contract.isModerator(userOrgs[currentOrgIndex], address);
      
      if (isOwner || isModerator) {
        // If user is owner/moderator, they can call getOrgMembers
        const members = await contract.getOrgMembers(userOrgs[currentOrgIndex]);
        setMemberCount(members.length);
      } else {
        // If user is just a member, we can't get the full list, so show a placeholder
        setMemberCount(null);
      }
    } catch (error) {
      console.log('Error counting members:', error);
      setMemberCount(null);
    }
  }, [userOrgs, currentOrgIndex, address]);

  // Count members when organization changes
  useEffect(() => {
    if (userOrgs[currentOrgIndex]) {
      countMembers();
    }
  }, [countMembers]);

  // Get total feedback count
  const { data: totalFeedbackCount } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: ORG_FEEDBACK_ABI,
    functionName: 'getFeedbackCount',
  });

  useEffect(() => {
    if (organizations && Array.isArray(organizations)) {
      setUserOrgs(organizations as string[]);
    }
  }, [organizations]);

  // Always render the same basic structure to prevent hydration mismatch
  if (!isHydrated) {
    return (
      <div className="min-h-screen flex">
        <Sidebar />
        <div className="flex-1 p-8 lg:p-12">
          <div className="w-full">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-400 rounded w-48 mb-8"></div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="glass-card-solid p-6">
                    <div className="h-8 bg-gray-400 rounded w-16 mb-2"></div>
                    <div className="h-4 bg-gray-400 rounded w-32"></div>
                  </div>
                ))}
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
            <div className="text-center max-w-4xl mx-auto py-16">
              {/* Hero Section */}
              <div className="">
                <div className="w-24 h-24 mx-auto mb-8 p-6 rounded-full bg-[#83785f] shadow-xl">
                  <MessageSquare className="w-12 h-12 text-[#f8f6f0] mx-auto" />
                </div>
                <h1 className="text-5xl font-bold text-gray-800 mb-6 leading-tight">
                  <span className="text-[#83785f]">Optimize performance through continuous on-chain feedback</span>
                </h1>
                <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
                  Build better teams through secure & encrypted communication
                </p>
              </div>

              <div className="flex items-center justify-center mb-12">
              <Image src="/poweredby.png" alt="Powered by Status Network" width={250} height={250} className="" />
              </div>

              {/* CTA Section */}
              <div className="bg-[#cfc7b5] p-5 rounded-2xl">
                <div className="mb-6">
                  <Image src="/mockup.png" alt="Mockup" width={1200} height={1000} className="w-full h-auto mb-8 rounded-xl" />
                  <h3 className="text-2xl font-bold text-gray-800 mb-3">Ready to get started?</h3>
                  <p className="text-gray-700 text-lg">
                    Connect your wallet to start collecting / submitting feedback
                  </p>
                </div>
                <div className="flex items-center justify-center space-x-4 text-[#83785f]">
                  <span className="font-medium">Use the sidebar to connect your wallet</span>
                  <ArrowRight className="w-5 h-5" />
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
        {/* Hero Header */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold text-gray-800 mb-2">
                Hi, ready for some feedback?
              </h1>
              <p className="text-gray-600 text-lg">
                Manage your organizations and track feedback seamlessly
              </p>
            </div>
                          <div className="flex items-center space-x-4">
                <div 
                  className="card-important flex items-center px-6 py-3 rounded-xl text-sm font-semibold shadow-md hover:shadow-lg transition-shadow cursor-pointer" 
                  style={{ color: '#22262b' }}
                  onClick={() => setIsFeedbackRequestsOpen(true)}
                >
                  <MessageCircleReply className="w-4 h-4 inline mr-2" />
                  Feedback Requests
                  <div className="text-xs bg-[#83785f] text-[#f8f6f0] rounded-full px-2 py-1 ml-2">{feedbackRequests.length}</div>
                </div>
              <img 
                src="/poweredby.png" 
                alt="Powered by" 
                className="h-20 w-auto opacity-90 hover:opacity-100 transition-opacity"
              />
            </div>
          </div>
          
          {/* Enhanced Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-[#cfc7b5] p-8 hover:shadow-lg transition-all group rounded-2xl">
              <div className="flex items-stretch justify-between min-h-[200px]">
                                {/* Left side - Stats */}
                <div className="flex-1 relative flex flex-col min-h-[200px]">
                  {/* Background count number */}
                  <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 text-[18rem] font-bold text-[#f8f6f0] opacity-30 pointer-events-none">
                    {userOrgs.length}
                  </div>
                  
                  <div className="relative z-10 flex-1 flex flex-col h-full">
                    {/* Icon at top */}
                    <div className="flex items-center mb-4">
                      <div className="p-3 rounded-xl bg-[#f8f6f0]   transition-all">
                        <Users className="w-8 h-8  text-[#83785f]" />
                      </div>
                    </div>
                    
                    {/* Spacer to push content to bottom */}
                    <div className="flex-grow"></div>
                    
                    {/* Content at bottom */}
                    <div className="mt-auto">
                      {/* Text content */}
                      <div className="text-gray-700 font-semibold text-lg mb-3">
                        My Organizations
                      </div>
                      
                      {/* Button at absolute bottom */}
                      <div className="flex items-center text-sm">
                        <Link
                          href="/feedback/new"
                          className="px-4 py-2 bg-[#83785f] text-[#f8f6f0] rounded-lg font-medium hover:bg-[#877f6c] transition-colors"
                        >
                          Send Feedback
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right side - Organization Display */}
                {userOrgs.length > 0 && (
                  <div className="ml-8 p-6 bg-white rounded-lg border border-gray-200 shadow-sm w-96">
                    {/* Organization Logo and Name */}
                    <div className="flex items-center space-x-3 mb-4">
                      {currentOrgMetadata && Array.isArray(currentOrgMetadata) && currentOrgMetadata[2] ? (
                        <img
                          src={`https://www.thirdstorage.cloud/api/gateway/${currentOrgMetadata[2]}`}
                          alt={`${currentOrgMetadata[0]} logo`}
                          className="w-12 h-12 rounded-lg object-cover border border-gray-200"
                          onError={(e: any) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div className={`w-12 h-12 bg-[#83785f] rounded-lg flex items-center justify-center ${currentOrgMetadata && Array.isArray(currentOrgMetadata) && currentOrgMetadata[2] ? 'hidden' : 'flex'}`}>
                        <span className="text-white text-lg font-bold">
                          {currentOrgMetadata && Array.isArray(currentOrgMetadata) ? currentOrgMetadata[0]?.charAt(0).toUpperCase() : 'O'}
                        </span>
                      </div>
                      <div>
                        <div className="text-xl font-semibold text-[#83785f] mb-1">
                          {currentOrgMetadata && Array.isArray(currentOrgMetadata) ? currentOrgMetadata[0] : 'Organization'}
                        </div>
                        <div className="text-[#83785f] bg-[#f8f6f0] p-2 rounded-lg text-xs">
                          {userOrgs[currentOrgIndex]?.toLowerCase() === address?.toLowerCase() ? 'You own this' : 'Member'}
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-sm text-gray-600 mb-2">
                      Owner
                    </div>
                    <div className="bg-gray-50 border border-gray-200 rounded px-3 py-2 mb-3">
                      <div className="font-mono text-gray-700 text-sm">
                        {formatAddress(userOrgs[currentOrgIndex])}
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-600">
                        ID: {formatAddress(userOrgs[currentOrgIndex])}
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setCurrentOrgIndex(Math.max(0, currentOrgIndex - 1))}
                          disabled={currentOrgIndex === 0}
                          className="p-1 rounded hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <ChevronLeft className="w-4 h-4 text-gray-600" />
                        </button>
                        <span className="text-xs text-gray-500">
                          {currentOrgIndex + 1} of {userOrgs.length}
                        </span>
                        <button
                          onClick={() => setCurrentOrgIndex(Math.min(userOrgs.length - 1, currentOrgIndex + 1))}
                          disabled={currentOrgIndex === userOrgs.length - 1}
                          className="p-1 rounded hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <ChevronRight className="w-4 h-4 text-gray-600" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="bg-[#83785f] p-8 hover:shadow-lg transition-all group rounded-2xl min-h-[200px]">
              <div className="flex items-stretch justify-between h-full">
                {/* Left side - Stats */}
                <div className="flex-1 relative flex flex-col h-full">
                  
                  <div className="relative z-10 flex-1 flex flex-col h-full">
                    {/* Icon at top */}
                    <div className="flex items-center mb-4">
                      <div className="p-3 rounded-xl bg-[#cfc7b5] transition-all">
                        <Crown className="w-8 h-8 text-[#83785f]" />
                      </div>
                    </div>
                    
                    {/* Spacer to push content to bottom */}
                    <div className="flex-grow"></div>
                    
                    {/* Content at bottom */}
                    <div className="mt-auto">
                      {/* Text content */}
                      <div className="text-[#f8f6f0] font-semibold text-lg mb-3">
                        Admin
                      </div>
                      
                      {/* Button at absolute bottom */}
                      <div className="flex items-center text-sm">
                        <Link
                          href="/org"
                          className="px-4 py-2 bg-[#cfc7b5] text-[#83785f] rounded-lg font-medium hover:bg-[#f8f6f0] transition-colors"
                        >
                          Manage team
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right side - Organization Stats */}
                <div className="ml-8 w-96 space-y-3">
                  {/* Members Card */}
                  <div className="bg-white rounded-lg p-1 border border-gray-200 shadow-sm">
                    <div className="text-[#83785f] font-semibold text-xs mb-1">
                      Members in the organization
                    </div>
                    <div className="text-[#83785f] text-sm font-bold">
                      {userOrgs.length > 0 && memberCount !== null 
                        ? memberCount 
                        : '-'
                      }
                    </div>
                  </div>
                  
                  {/* Feedback Card */}
                  <div className="bg-white rounded-lg p-1 border border-gray-200 shadow-sm">
                    <div className="text-[#83785f] font-semibold text-xs mb-1">
                      Feedback exchanged in the organization
                    </div>
                    <div className="text-[#83785f] text-sm font-bold">
                      {userOrgs.length > 0 && totalFeedbackCount 
                        ? totalFeedbackCount.toString()
                        : '-'
                      }
                    </div>
                  </div>
                  
                  {/* ENS Card */}
                  <div className="bg-white rounded-lg p-1 border border-gray-200 shadow-sm opacity-50">
                    <div className="text-[#83785f] font-semibold text-xs mb-1">
                      ENS
                    </div>
                    <div className="text-[#83785f] text-sm font-bold">
                      Coming soon
                    </div>
                  </div>
                  
                </div>
              </div>
            </div>
          </div>
        </div>



        {/* Quick Actions */}
        <div className="card-important p-10 rounded-2xl">
          <div className="text-center mb-10">
            <h3 className="text-3xl font-bold text-gray-800 mb-3">
              Quick Actions
            </h3>
            <p className="text-gray-600 text-lg">
              Jump into the most common tasks
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <button
              onClick={() => setIsRequestFeedbackOpen(true)}
              className="group glass-card p-8 hover:shadow-xl transition-all transform hover:scale-110 text-center hover:bg-gradient-to-br hover:from-blue-50 hover:to-blue-100 w-full"
            >
              <div className="w-16 h-16 mx-auto mb-6 p-4 rounded-2xl bg-[#83785f]  transition-all shadow-lg">
              <MessageCircleReply className="w-8 h-8 text-white" />
              </div>
              <div className="text-[#83785f] font-bold text-lg mb-3 transition-colors">
                Request Feedback
              </div>
              <div className="text-gray-600 text-sm leading-relaxed">
                Ask someone for feedback
              </div>
            </button>
            
            <Link
              href="/feedback/new"
              className="group glass-card p-8 hover:shadow-xl transition-all transform hover:scale-110 text-center hover:bg-gradient-to-br hover:from-green-50 hover:to-green-100"
            >
              <div className="w-16 h-16 mx-auto mb-6 p-4 rounded-2xl bg-[#83785f]  transition-all shadow-lg">
              <MessageCirclePlus className="w-8 h-8 text-white" />
              </div>
              <div className="text-[#83785f] font-bold text-lg mb-3 transition-colors">
                Send Feedback
              </div>
              <div className="text-gray-600 text-sm leading-relaxed">
                Send someone a feedback
              </div>
            </Link>
            
            <Link
              href="/feedback"
              className="group glass-card p-8 hover:shadow-xl transition-all transform hover:scale-110 text-center hover:bg-gradient-to-br hover:from-purple-50 hover:to-purple-100"
            >
              <div className="w-16 h-16 mx-auto mb-6 p-4 rounded-2xl bg-[#83785f]  transition-all shadow-lg">
                <BarChart3 className="w-8 h-8 text-white" />
              </div>
              <div className="text-[#83785f] font-bold text-lg mb-3 transition-colors">
                View Feedback
              </div>
              <div className="text-gray-600 text-sm leading-relaxed">
                Review your feedback history
              </div>
            </Link>
            
            <div className="glass-card p-8 text-center opacity-60 hover:opacity-80 transition-opacity">
            <div className="w-16 h-16 mx-auto mb-6 p-4 rounded-2xl bg-[#83785f]  transition-all shadow-lg">
            <Sparkles className="w-8 h-8 text-white" />
              </div>
              <div className="text-[#83785f] font-bold text-lg mb-3 transition-colors">
                Analytics
              </div>
              <div className="text-gray-500 text-sm leading-relaxed">
                Advanced insights coming soon
              </div>
            </div>
          </div>
        </div>
        </div>
      </div>

      {/* Feedback Requests Sheet */}
      <Sheet open={isFeedbackRequestsOpen} onOpenChange={setIsFeedbackRequestsOpen}>
        <SheetContent side="right" className="w-96 p-0">
          <SheetHeader className="px-6 py-6 border-b border-gray-200">
            <SheetTitle className="text-xl font-bold text-gray-800">Feedback Requests</SheetTitle>
          </SheetHeader>
          
          <div className="px-6 py-6 overflow-y-auto h-full">
            {feedbackRequests.length === 0 ? (
              <div className="text-center py-12">
                <MessageCircleReply className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No feedback requests yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {feedbackRequests.map((request) => (
                  <div key={request.id} className="bg-white rounded-lg p-5 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                    {/* Address */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="text-sm font-mono text-gray-600 bg-gray-50 px-3 py-1 rounded-md">
                        {formatAddress(request.address)}
                      </div>
                      <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                        {request.timestamp}
                      </div>
                    </div>
                    
                    {/* Content */}
                    <div className="text-gray-800 mb-5 leading-relaxed">
                      {request.content}
                    </div>
                    
                    {/* Accept Button */}
                    <button
                      onClick={() => handleAcceptRequest(request.id)}
                      className="w-full bg-[#83785f] text-white py-3 px-4 rounded-lg font-medium hover:bg-[#877f6c] transition-colors shadow-sm hover:shadow-md"
                    >
                      Accept Request
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Request Feedback Modal */}
      <Dialog open={isRequestFeedbackOpen} onOpenChange={setIsRequestFeedbackOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-800">Request Feedback</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {/* Ethereum Addresses Input */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-700">
                Ethereum Addresses (comma-separated)
              </label>
              <textarea
                value={requestAddresses}
                onChange={(e) => setRequestAddresses(e.target.value)}
                placeholder="0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6, 0x8ba1f109551bD432803012645Hac136c772c3c7"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#83785f] focus:border-transparent resize-none"
                rows={3}
              />
              
              {/* Address Preview */}
              {requestAddresses.trim() && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Requesting for feedback from</label>
                  <div className="flex flex-wrap gap-2">
                    {parseAddresses(requestAddresses).map((address, index) => (
                      <div key={index} className="flex items-center space-x-2 bg-gray-50 rounded-lg px-3 py-2">
                        <img
                          src={blockies.create({ seed: address, size: 8 }).toDataURL()}
                          alt={`Blockie for ${address}`}
                          className="w-6 h-6 rounded"
                        />
                        <span className="text-sm font-mono text-gray-600">
                          {formatAddress(address)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Request Content */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-700">
                Request Content
              </label>
              <textarea
                value={requestContent}
                onChange={(e) => setRequestContent(e.target.value)}
                placeholder="Hey, can you give me some feedback on my recent work?"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#83785f] focus:border-transparent resize-none"
                rows={4}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              onClick={() => setIsRequestFeedbackOpen(false)}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleRequestFeedback}
              className="px-6 py-2 bg-[#83785f] text-white rounded-lg font-medium hover:bg-[#877f6c] transition-colors"
            >
              Send Request
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
