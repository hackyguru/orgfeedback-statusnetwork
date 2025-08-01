import { useAccount, useReadContract } from 'wagmi';
import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import OrgCard from '@/components/OrgCard';
import { CONTRACT_ADDRESS } from '@/lib/config';
import { ORG_FEEDBACK_ABI } from '@/lib/abi';
import Link from 'next/link';

export default function Home() {
  const { address, isConnected } = useAccount();
  const [userOrgs, setUserOrgs] = useState<string[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

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
          <div className="max-w-6xl mx-auto">
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
          <div className="max-w-6xl mx-auto">
            <div className="text-center">
              <h1 className="text-5xl font-bold text-gray-800 mb-6">
                Welcome to <span className="accent-text">OrgFeedback</span>
              </h1>
              <p className="text-xl text-gray-700 mb-8 max-w-2xl mx-auto leading-relaxed">
                A decentralized platform for anonymous organizational feedback. 
                Connect your wallet to create organizations, send encrypted feedback, 
                and build better teams.
              </p>
              <div className="glass-card p-8 max-w-md mx-auto">
                <div className="text-gray-700 mb-4 font-medium">
                  Use the sidebar to connect your wallet and get started
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
        <div className="max-w-6xl mx-auto">
        {/* Header Stats */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-gray-800">
              Howdy!
            </h1>
            <div className="flex items-center space-x-4">
              <div className="card-important px-4 py-2 rounded-full text-sm font-semibold shadow-sm" style={{ color: '#22262b' }}>
                DETAILS
              </div>
              <img 
                src="/poweredby.png" 
                alt="Powered by" 
                className="h-20 w-auto"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass-card-solid p-6">
              <div className="text-3xl font-bold text-gray-800 mb-2">
                {totalOrgs ? Number(totalOrgs).toLocaleString() : '0'}
              </div>
              <div className="text-gray-700 font-medium">
                Total Organizations
              </div>
              <div className="mt-4 text-xs text-[#cfc7b5] font-semibold">
                +{totalOrgs ? Math.floor(Number(totalOrgs) * 0.12) : 0}% from last month
              </div>
            </div>
            
            <div className="glass-card-solid p-6">
              <div className="text-3xl font-bold text-gray-800 mb-2">
                {userOrgs.length}
              </div>
              <div className="text-gray-700 font-medium">
                Your Organizations
              </div>
              <div className="mt-4 text-xs text-gray-600 font-semibold">
                Active participation
              </div>
            </div>
            
            <div className="glass-card-solid p-6">
              <div className="text-3xl font-bold text-gray-800 mb-2">
                {userOrgs.filter((orgId: string) => orgId.toLowerCase() === address?.toLowerCase()).length}
              </div>
              <div className="text-gray-700 font-medium">
                Organizations Owned
              </div>
              <div className="mt-4 text-xs text-yellow-600 font-semibold">
                Leadership role
              </div>
            </div>
          </div>
        </div>

        {/* Your Organizations */}
        <div className="mb-10">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold text-gray-800">
              Your Organizations
            </h2>
            <Link
              href="/org"
              className="px-6 py-3 rounded-xl font-semibold hover:opacity-90 transition-all transform hover:scale-105 shadow-md"
              style={{ background: '#22262b', color: '#ffffff' }}
            >
              Manage Organization
            </Link>
          </div>

          {isLoadingOrgs ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="glass-card-solid p-6 animate-pulse">
                  <div className="h-6 bg-zinc-700 rounded w-3/4 mb-4"></div>
                  <div className="h-4 bg-zinc-700 rounded w-full mb-2"></div>
                  <div className="h-4 bg-zinc-700 rounded w-2/3 mb-4"></div>
                  <div className="h-10 bg-zinc-700 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : userOrgs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {userOrgs.map((orgId: string) => (
                <OrgCard
                  key={orgId}
                  orgId={orgId}
                  isOwner={orgId.toLowerCase() === address?.toLowerCase()}
                />
              ))}
            </div>
          ) : (
            <div className="glass-card-solid p-8 text-center">
              <div className="text-gray-700 mb-6 text-lg">
                You're not part of any organizations yet
              </div>
              <Link
                href="/org"
                className="inline-block px-8 py-4 rounded-xl font-semibold hover:opacity-90 transition-all transform hover:scale-105 shadow-md"
                style={{ background: '#22262b', color: '#ffffff' }}
              >
                Create Your First Organization
              </Link>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="card-important p-8">
          <h3 className="text-2xl font-bold text-gray-800 mb-6">
            Quick Actions
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Link
              href="/org"
              className="glass-card p-6 hover:bg-gray-100/70 transition-all transform hover:scale-105 text-center group"
            >
              <div className="text-gray-800 font-semibold mb-2 group-hover:text-[#cfc7b5] transition-colors">
                Manage Organization
              </div>
              <div className="text-gray-700 text-sm">
                Create or manage your org
              </div>
            </Link>
            <Link
              href="/feedback/new"
              className="glass-card p-6 hover:bg-gray-100/70 transition-all transform hover:scale-105 text-center group"
            >
              <div className="text-gray-800 font-semibold mb-2 group-hover:text-gray-600 transition-colors">
                Send Feedback
              </div>
              <div className="text-gray-700 text-sm">
                Send encrypted feedback
              </div>
            </Link>
            <Link
              href="/feedback"
              className="glass-card p-6 hover:bg-gray-100/70 transition-all transform hover:scale-105 text-center group"
            >
              <div className="text-gray-800 font-semibold mb-2 group-hover:text-gray-600 transition-colors">
                View Feedback
              </div>
              <div className="text-gray-700 text-sm">
                See your feedback history
              </div>
            </Link>
            <div className="glass-card p-6 text-center opacity-60">
              <div className="text-gray-800 font-semibold mb-2">
                Analytics
              </div>
              <div className="text-gray-500 text-sm">
                Coming soon
              </div>
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}
