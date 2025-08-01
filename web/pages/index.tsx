import { useAccount, useReadContract } from 'wagmi';
import { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import OrgCard from '@/components/OrgCard';
import { CONTRACT_ADDRESS } from '@/lib/config';
import { ORG_FEEDBACK_ABI } from '@/lib/abi';
import Link from 'next/link';

export default function Home() {
  const { address, isConnected } = useAccount();
  const [userOrgs, setUserOrgs] = useState([]);

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
    enabled: !!address,
  });

  useEffect(() => {
    if (organizations) {
      setUserOrgs(organizations);
    }
  }, [organizations]);

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-zinc-50">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-16">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-zinc-900 mb-6">
              Welcome to OrgFeedback
            </h1>
            <p className="text-xl text-zinc-600 mb-8 max-w-2xl mx-auto">
              A decentralized platform for anonymous organizational feedback. 
              Connect your wallet to create organizations, send encrypted feedback, 
              and build better teams.
            </p>
            <div className="bg-white rounded-lg p-8 border border-zinc-200 max-w-md mx-auto">
              <div className="text-zinc-500 mb-4">
                Please connect your wallet to get started
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <Navbar />
      
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header Stats */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-zinc-900 mb-4">
            Dashboard
          </h1>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg p-6 border border-zinc-200">
              <div className="text-2xl font-bold text-zinc-900">
                {totalOrgs ? Number(totalOrgs).toLocaleString() : '0'}
              </div>
              <div className="text-zinc-600">
                Total Organizations
              </div>
            </div>
            <div className="bg-white rounded-lg p-6 border border-zinc-200">
              <div className="text-2xl font-bold text-zinc-900">
                {userOrgs.length}
              </div>
              <div className="text-zinc-600">
                Your Organizations
              </div>
            </div>
            <div className="bg-white rounded-lg p-6 border border-zinc-200">
              <div className="text-2xl font-bold text-zinc-900">
                {address === userOrgs[0] ? '1' : '0'}
              </div>
              <div className="text-zinc-600">
                Organizations Owned
              </div>
            </div>
          </div>
        </div>

        {/* Your Organizations */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-zinc-900">
              Your Organizations
            </h2>
            <Link
              href="/org"
              className="bg-zinc-900 text-white px-4 py-2 rounded-lg font-medium hover:bg-zinc-800 transition-colors"
            >
              Manage Organization
            </Link>
          </div>

          {isLoadingOrgs ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-white border border-zinc-200 rounded-lg p-6 animate-pulse">
                  <div className="h-6 bg-zinc-200 rounded w-3/4 mb-4"></div>
                  <div className="h-4 bg-zinc-200 rounded w-full mb-2"></div>
                  <div className="h-4 bg-zinc-200 rounded w-2/3 mb-4"></div>
                  <div className="h-10 bg-zinc-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : userOrgs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {userOrgs.map((orgId) => (
                <OrgCard
                  key={orgId}
                  orgId={orgId}
                  isOwner={orgId.toLowerCase() === address?.toLowerCase()}
                />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-lg p-8 border border-zinc-200 text-center">
              <div className="text-zinc-500 mb-4">
                You're not part of any organizations yet
              </div>
              <Link
                href="/org"
                className="inline-block bg-zinc-900 text-white px-6 py-3 rounded-lg font-medium hover:bg-zinc-800 transition-colors"
              >
                Create Your First Organization
              </Link>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg p-6 border border-zinc-200">
          <h3 className="text-lg font-semibold text-zinc-900 mb-4">
            Quick Actions
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              href="/org"
              className="p-4 border border-zinc-200 rounded-lg hover:border-zinc-300 transition-colors text-center"
            >
              <div className="text-zinc-900 font-medium mb-1">
                Manage Organization
              </div>
              <div className="text-zinc-500 text-sm">
                Create or manage your org
              </div>
            </Link>
            <Link
              href="/feedback/new"
              className="p-4 border border-zinc-200 rounded-lg hover:border-zinc-300 transition-colors text-center"
            >
              <div className="text-zinc-900 font-medium mb-1">
                Send Feedback
              </div>
              <div className="text-zinc-500 text-sm">
                Send encrypted feedback
              </div>
            </Link>
            <Link
              href="/feedback"
              className="p-4 border border-zinc-200 rounded-lg hover:border-zinc-300 transition-colors text-center"
            >
              <div className="text-zinc-900 font-medium mb-1">
                View Feedback
              </div>
              <div className="text-zinc-500 text-sm">
                See your feedback history
              </div>
            </Link>
            <div className="p-4 border border-zinc-200 rounded-lg text-center opacity-50">
              <div className="text-zinc-900 font-medium mb-1">
                Analytics
              </div>
              <div className="text-zinc-500 text-sm">
                Coming soon
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
