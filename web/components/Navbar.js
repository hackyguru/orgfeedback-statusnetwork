import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { metaMask } from 'wagmi/connectors';
import Link from 'next/link';
import { useState } from 'react';
import toast from 'react-hot-toast';

const Navbar = () => {
  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = async () => {
    try {
      setIsConnecting(true);
      await connect({ connector: metaMask() });
      toast.success('Wallet connected successfully!');
    } catch (error) {
      toast.error('Failed to connect wallet');
      console.error('Connection error:', error);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    disconnect();
    toast.success('Wallet disconnected');
  };

  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <nav className="bg-white border-b border-zinc-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and main navigation */}
          <div className="flex items-center space-x-8">
            <Link 
              href="/" 
              className="text-xl font-bold text-zinc-900 hover:text-zinc-700 transition-colors"
            >
              OrgFeedback
            </Link>
            
            {isConnected && (
              <div className="hidden md:flex space-x-6">
                <Link 
                  href="/" 
                  className="text-zinc-600 hover:text-zinc-900 transition-colors font-medium"
                >
                  Home
                </Link>
                <Link 
                  href="/org" 
                  className="text-zinc-600 hover:text-zinc-900 transition-colors font-medium"
                >
                  Organization
                </Link>
                <Link 
                  href="/feedback" 
                  className="text-zinc-600 hover:text-zinc-900 transition-colors font-medium"
                >
                  Feedback
                </Link>
                <Link 
                  href="/feedback/new" 
                  className="text-zinc-600 hover:text-zinc-900 transition-colors font-medium"
                >
                  Send Feedback
                </Link>
              </div>
            )}
          </div>

          {/* Wallet connection */}
          <div className="flex items-center">
            {!isConnected ? (
              <button
                onClick={handleConnect}
                disabled={isConnecting}
                className="bg-zinc-900 text-white px-4 py-2 rounded-lg font-medium hover:bg-zinc-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isConnecting ? 'Connecting...' : 'Connect Wallet'}
              </button>
            ) : (
              <div className="flex items-center space-x-4">
                <div className="text-sm text-zinc-600">
                  {formatAddress(address)}
                </div>
                <button
                  onClick={handleDisconnect}
                  className="bg-zinc-100 text-zinc-800 px-4 py-2 rounded-lg font-medium hover:bg-zinc-200 transition-colors"
                >
                  Disconnect
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile navigation */}
        {isConnected && (
          <div className="md:hidden py-4 border-t border-zinc-200">
            <div className="flex flex-col space-y-2">
              <Link 
                href="/" 
                className="text-zinc-600 hover:text-zinc-900 transition-colors font-medium py-2"
              >
                Home
              </Link>
              <Link 
                href="/org" 
                className="text-zinc-600 hover:text-zinc-900 transition-colors font-medium py-2"
              >
                Organization
              </Link>
              <Link 
                href="/feedback" 
                className="text-zinc-600 hover:text-zinc-900 transition-colors font-medium py-2"
              >
                Feedback
              </Link>
              <Link 
                href="/feedback/new" 
                className="text-zinc-600 hover:text-zinc-900 transition-colors font-medium py-2"
              >
                Send Feedback
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;