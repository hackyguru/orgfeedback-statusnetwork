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
      <div className="glass-card-solid p-6 animate-pulse">
        <div className="h-6 bg-gray-400 rounded w-3/4 mb-4"></div>
        <div className="h-4 bg-gray-400 rounded w-full mb-2"></div>
        <div className="h-4 bg-gray-400 rounded w-2/3 mb-4"></div>
        <div className="h-10 bg-gray-400 rounded w-1/2"></div>
      </div>
    );
  }

  if (!orgData) {
    return (
      <div className="glass-card-solid p-6">
        <div className="text-gray-700 text-center">
          Unable to load organization data
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card-solid p-6 hover:shadow-lg transition-all transform hover:scale-105 group">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-2 group-hover:text-lime-600 transition-colors">
          {orgData.name}
        </h3>
        <p className="text-gray-700 text-sm leading-relaxed">
          {orgData.description}
        </p>
      </div>

      <div className="mb-4">
        <div className="text-xs text-gray-500 mb-1 font-medium">Owner</div>
        <div className="text-sm font-mono text-gray-700 px-2 py-1 rounded" style={{ background: '#f4f1eb', border: '1px solid rgba(34, 38, 43, 0.15)' }}>
          {formatAddress(orgData.owner)}
        </div>
        {isOwner && (
          <div className="inline-block mt-2 px-3 py-1 text-xs rounded-full font-semibold shadow-sm" style={{ background: '#cfc7b5', color: '#22262b' }}>
            You own this organization
          </div>
        )}
      </div>

      <div className="flex justify-between items-center">
        <div className="text-xs text-gray-500 font-mono">
          ID: {formatAddress(orgId)}
        </div>
        <Link
          href={`/org/${orgId}`}
          className="text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:shadow-md transition-all transform hover:scale-105"
          style={{ background: '#f4f1eb', border: '1px solid rgba(34, 38, 43, 0.15)' }}
        >
          View Details
        </Link>
      </div>
    </div>
  );
};

export default OrgCard;