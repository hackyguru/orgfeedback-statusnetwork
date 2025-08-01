import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useReadContract } from 'wagmi';
import { CONTRACT_ADDRESS } from '@/lib/config';
import { ORG_FEEDBACK_ABI } from '@/lib/abi';

const OrgCard = ({ orgId, isOwner = false }) => {
  const [orgData, setOrgData] = useState(null);
  
  // Get organization metadata
  const { data: metadata, isLoading } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: ORG_FEEDBACK_ABI,
    functionName: 'getOrgMetadata',
    args: [orgId],
  });

  useEffect(() => {
    if (metadata) {
      setOrgData({
        name: metadata[0],
        description: metadata[1],
        owner: metadata[2],
      });
    }
  }, [metadata]);

  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (isLoading) {
    return (
      <div className="bg-white border border-zinc-200 rounded-lg p-6 animate-pulse">
        <div className="h-6 bg-zinc-200 rounded w-3/4 mb-4"></div>
        <div className="h-4 bg-zinc-200 rounded w-full mb-2"></div>
        <div className="h-4 bg-zinc-200 rounded w-2/3 mb-4"></div>
        <div className="h-10 bg-zinc-200 rounded w-1/2"></div>
      </div>
    );
  }

  if (!orgData) {
    return (
      <div className="bg-white border border-zinc-200 rounded-lg p-6">
        <div className="text-zinc-500 text-center">
          Unable to load organization data
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-zinc-200 rounded-lg p-6 hover:border-zinc-300 transition-colors">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-zinc-900 mb-2">
          {orgData.name}
        </h3>
        <p className="text-zinc-600 text-sm leading-relaxed">
          {orgData.description}
        </p>
      </div>

      <div className="mb-4">
        <div className="text-xs text-zinc-500 mb-1">Owner</div>
        <div className="text-sm font-mono text-zinc-700">
          {formatAddress(orgData.owner)}
        </div>
        {isOwner && (
          <div className="inline-block mt-1 px-2 py-1 bg-zinc-100 text-zinc-700 text-xs rounded-full">
            You own this organization
          </div>
        )}
      </div>

      <div className="flex justify-between items-center">
        <div className="text-xs text-zinc-500">
          Org ID: {formatAddress(orgId)}
        </div>
        <Link
          href={`/org/${orgId}`}
          className="bg-zinc-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-zinc-800 transition-colors"
        >
          View Details
        </Link>
      </div>
    </div>
  );
};

export default OrgCard;