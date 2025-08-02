import { useAccount, useReadContract } from 'wagmi';
import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import OrgCard from '@/components/OrgCard';
import { CONTRACT_ADDRESS } from '@/lib/config';
import { ORG_FEEDBACK_ABI } from '@/lib/abi';
import Link from 'next/link';
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
  ChevronRight
} from 'lucide-react';

export default function Home() {
  const { address, isConnected } = useAccount();
  const [userOrgs, setUserOrgs] = useState<string[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);
  const [currentOrgIndex, setCurrentOrgIndex] = useState(0);

  const formatAddress = (address: string) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
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
              <div className="mb-12">
                <div className="w-24 h-24 mx-auto mb-8 p-6 rounded-full bg-gradient-to-br from-lime-400 to-green-500 shadow-xl">
                  <MessageSquare className="w-12 h-12 text-white mx-auto" />
                </div>
                <h1 className="text-6xl font-bold text-gray-800 mb-6 leading-tight">
                  Welcome to <span className="accent-text">OrgFeedback</span>
                </h1>
                <p className="text-2xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed">
                  A decentralized platform for anonymous organizational feedback. 
                  Build better teams through secure, encrypted communication.
                </p>
              </div>

              {/* Features Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                <div className="glass-card p-8 text-center hover:shadow-lg transition-all">
                  <div className="w-16 h-16 mx-auto mb-6 p-4 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg">
                    <Building2 className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 mb-3">Create Organizations</h3>
                  <p className="text-gray-600">Set up and manage your teams with ease</p>
                </div>
                
                <div className="glass-card p-8 text-center hover:shadow-lg transition-all">
                  <div className="w-16 h-16 mx-auto mb-6 p-4 rounded-2xl bg-gradient-to-br from-green-500 to-green-600 shadow-lg">
                    <MessageSquare className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 mb-3">Anonymous Feedback</h3>
                  <p className="text-gray-600">Send and receive encrypted feedback safely</p>
                </div>
                
                <div className="glass-card p-8 text-center hover:shadow-lg transition-all">
                  <div className="w-16 h-16 mx-auto mb-6 p-4 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 shadow-lg">
                    <BarChart3 className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 mb-3">Track Progress</h3>
                  <p className="text-gray-600">Monitor feedback trends and team health</p>
                </div>
              </div>

              {/* CTA Section */}
              <div className="card-important p-10 rounded-2xl">
                <div className="mb-6">
                  <Sparkles className="w-8 h-8 text-gray-700 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-gray-800 mb-3">Ready to get started?</h3>
                  <p className="text-gray-700 text-lg">
                    Connect your wallet using the sidebar to create organizations and start collecting feedback
                  </p>
                </div>
                <div className="flex items-center justify-center space-x-4 text-gray-600">
                  <ArrowRight className="w-5 h-5" />
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
                Dashboard
              </h1>
              <p className="text-gray-600 text-lg">
                Manage your organizations and track feedback seamlessly
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="card-important px-6 py-3 rounded-xl text-sm font-semibold shadow-md hover:shadow-lg transition-shadow" style={{ color: '#22262b' }}>
                <Sparkles className="w-4 h-4 inline mr-2" />
                DASHBOARD
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
              <div className="flex items-stretch justify-between">
                                {/* Left side - Stats */}
                <div className="flex-1 relative flex flex-col">
                  {/* Background count number */}
                  <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 text-[18rem] font-bold text-[#f8f6f0] opacity-30 pointer-events-none">
                    {userOrgs.length}
                  </div>
                  
                  <div className="relative z-10 flex-1 flex flex-col">
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
                        {userOrgs.length} Organizations
                      </div>
                      
                      {/* Button at absolute bottom */}
                      <div className="flex items-center text-sm">
                        <Link
                          href="/org"
                          className="px-4 py-2 bg-[#83785f] text-[#f8f6f0] rounded-lg font-medium hover:bg-purple-200 transition-colors"
                        >
                          Manage Organizations
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right side - Organization Display */}
                {userOrgs.length > 0 && (
                  <div className="ml-8 p-6 bg-white rounded-lg border border-gray-200 shadow-sm w-96">
                    <div className="text-xl font-semibold text-[#83785f] mb-1">
                      Status
                    </div>
                    <div className="text-[#83785f] bg-[#f8f6f0] p-2 rounded-lg text-xs mb-3">
                      {userOrgs[currentOrgIndex]?.toLowerCase() === address?.toLowerCase() ? 'You own this' : 'Member'}
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
            
            <div className="glass-card-solid p-8 hover:shadow-lg transition-all group">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-amber-50 to-amber-100 group-hover:from-amber-100 group-hover:to-amber-200 transition-all">
                  <Crown className="w-8 h-8 text-amber-600" />
                </div>
                <div className="p-1 rounded-full bg-amber-100">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                </div>
              </div>
              <div className="text-4xl font-bold text-gray-800 mb-2">
                {userOrgs.filter((orgId: string) => orgId.toLowerCase() === address?.toLowerCase()).length}
              </div>
              <div className="text-gray-700 font-semibold text-lg mb-3">
                Organizations Owned
              </div>
              <div className="flex items-center text-sm">
                <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-full font-medium">
                  Admin
                </span>
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
            <Link
              href="/org"
              className="group glass-card p-8 hover:shadow-xl transition-all transform hover:scale-110 text-center hover:bg-gradient-to-br hover:from-blue-50 hover:to-blue-100"
            >
              <div className="w-16 h-16 mx-auto mb-6 p-4 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 group-hover:from-blue-600 group-hover:to-blue-700 transition-all shadow-lg">
                <Settings className="w-8 h-8 text-white" />
              </div>
              <div className="text-gray-800 font-bold text-lg mb-3 group-hover:text-blue-700 transition-colors">
                Manage Organization
              </div>
              <div className="text-gray-600 text-sm leading-relaxed">
                Create or manage your organization settings
              </div>
            </Link>
            
            <Link
              href="/feedback/new"
              className="group glass-card p-8 hover:shadow-xl transition-all transform hover:scale-110 text-center hover:bg-gradient-to-br hover:from-green-50 hover:to-green-100"
            >
              <div className="w-16 h-16 mx-auto mb-6 p-4 rounded-2xl bg-gradient-to-br from-green-500 to-green-600 group-hover:from-green-600 group-hover:to-green-700 transition-all shadow-lg">
                <MessageSquare className="w-8 h-8 text-white" />
              </div>
              <div className="text-gray-800 font-bold text-lg mb-3 group-hover:text-green-700 transition-colors">
                Send Feedback
              </div>
              <div className="text-gray-600 text-sm leading-relaxed">
                Send encrypted anonymous feedback
              </div>
            </Link>
            
            <Link
              href="/feedback"
              className="group glass-card p-8 hover:shadow-xl transition-all transform hover:scale-110 text-center hover:bg-gradient-to-br hover:from-purple-50 hover:to-purple-100"
            >
              <div className="w-16 h-16 mx-auto mb-6 p-4 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 group-hover:from-purple-600 group-hover:to-purple-700 transition-all shadow-lg">
                <BarChart3 className="w-8 h-8 text-white" />
              </div>
              <div className="text-gray-800 font-bold text-lg mb-3 group-hover:text-purple-700 transition-colors">
                View Feedback
              </div>
              <div className="text-gray-600 text-sm leading-relaxed">
                Review your feedback history
              </div>
            </Link>
            
            <div className="glass-card p-8 text-center opacity-60 hover:opacity-80 transition-opacity">
              <div className="w-16 h-16 mx-auto mb-6 p-4 rounded-2xl bg-gradient-to-br from-gray-400 to-gray-500 shadow-lg">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <div className="text-gray-800 font-bold text-lg mb-3">
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
    </div>
  );
}
