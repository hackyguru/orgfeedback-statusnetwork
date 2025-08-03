import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { metaMask } from 'wagmi/connectors';
import Link from 'next/link';
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
import { Sparkle, Home, MessageSquare, BarChart3, Settings, Wallet, LogOut, Plus, Users } from 'lucide-react';
import blockies from 'ethereum-blockies';

const Sidebar = () => {
  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();
  const [isConnecting, setIsConnecting] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [hasManuallyDisconnected, setHasManuallyDisconnected] = useState(false);
  const router = useRouter();

  // Initialize manual disconnect state from localStorage
  useEffect(() => {
    const storedDisconnectState = localStorage.getItem('hasManuallyDisconnected');
    if (storedDisconnectState === 'true') {
      setHasManuallyDisconnected(true);
    }
  }, []);

  // Fix hydration mismatch by ensuring client-side only rendering for connection state
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Handle auto-reconnection prevention
  useEffect(() => {
    if (hasManuallyDisconnected && isConnected) {
      // If user manually disconnected but wallet reconnected automatically,
      // disconnect again to respect user's choice
      disconnect();
      setHasManuallyDisconnected(false);
      localStorage.removeItem('hasManuallyDisconnected');
    }
  }, [isConnected, hasManuallyDisconnected, disconnect]);

  const handleConnect = async () => {
    try {
      setIsConnecting(true);
      setHasManuallyDisconnected(false);
      localStorage.removeItem('hasManuallyDisconnected');
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
    setHasManuallyDisconnected(true);
    localStorage.setItem('hasManuallyDisconnected', 'true');
    toast.success('Wallet disconnected');
  };

  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const generateIdenticon = (address) => {
    if (!address) return null;
    return blockies.create({
      seed: address.toLowerCase(),
      size: 8,
      scale: 6,
    }).toDataURL();
  };

  const isActivePath = useMemo(() => {
    return (path) => {
      if (path === '/') {
        return router.pathname === '/';
      }
      // Use exact matching to prevent partial path matches
      return router.pathname === path;
    };
  }, [router.pathname]);

  const mainNavigationItems = [
    { path: '/', label: 'Home', icon: <Home className="w-6 h-6" />},
    { path: '/feedback', label: 'Feedback', icon: <MessageSquare className="w-6 h-6" />},
    { path: '/feedback/new', label: 'Send Feedback', icon: <Plus className="w-6 h-6" />},
  ];

  const organizationNavigationItems = [
    { path: '/org', label: 'My Team', icon: <Users className="w-6 h-6" />},
  ];

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 w-12 h-12 rounded-xl flex items-center justify-center shadow-md"
        style={{ background: '#ffffff', border: '1px solid rgba(34, 38, 43, 0.2)' }}
      >
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" style={{ color: '#22262b' }}>
          <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/>
        </svg>
      </button>

      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed left-0 top-0 h-full w-20 z-50 transform transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
      `}>
        <div className="flex flex-col h-full py-6">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <Link href="/" className="w-12 h-12 bg-black rounded-full flex items-center justify-center hover:opacity-80 transition-opacity shadow-md">
            <Sparkle className="w-6 h-6 text-[#f4f1eb]" />
            </Link>
          </div>

          {/* Main Navigation - Centered in middle */}
          {isHydrated && isConnected && (
            <div className="flex-1 flex items-center justify-center">
              <nav className="flex flex-col items-center space-y-6 px-2 py-3 rounded-full" style={{ background: 'rgba(255, 255, 255, 0.8)' }}>
                {mainNavigationItems.map((item) => {
                  const isActive = isActivePath(item.path);
                  return (
                    <Link
                      key={item.path}
                      href={item.path}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`
                        w-12 h-12 flex items-center justify-center transition-all duration-150 ease-in-out
                        ${isActive 
                          ? 'text-gray-800' 
                          : 'text-gray-500 hover:text-gray-700'
                        }
                      `}
                      style={isActive ? { background: '#cfc7b5', borderRadius: '50%' } : {}}
                      title={item.label}
                    >
                      {item.icon}
                    </Link>
                  );
                })}
              </nav>
            </div>
          )}

          {/* Organization Navigation - Separate section */}
          {isHydrated && isConnected && (
            <div className="flex justify-center mb-8">
              <nav className="flex flex-col items-center space-y-6 px-2 py-3 rounded-full" style={{ background: 'rgba(255, 255, 255, 0.8)' }}>
                {organizationNavigationItems.map((item) => {
                  const isActive = isActivePath(item.path);
                  return (
                    <Link
                      key={item.path}
                      href={item.path}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`
                        w-12 h-12 flex items-center justify-center transition-all duration-150 ease-in-out
                        ${isActive 
                          ? 'text-gray-800' 
                          : 'text-gray-500 hover:text-gray-700'
                        }
                      `}
                      style={isActive ? { background: '#cfc7b5', borderRadius: '50%' } : {}}
                      title={item.label}
                    >
                      {item.icon}
                    </Link>
                  );
                })}
              </nav>
            </div>
          )}

          {/* Spacer when not connected to push wallet to bottom */}
          {(!isHydrated || !isConnected) && (
            <div className="flex-1"></div>
          )}

          {/* User Profile / Wallet */}
          <div className="flex justify-center">
            <div className="px-2 py-3 rounded-full" style={{ background: 'rgba(255, 255, 255, 0.8)' }}>
              {isHydrated && isConnected ? (
                <>
                  <button
                    onClick={handleDisconnect}
                    className="w-12 h-12 rounded-full flex items-center justify-center hover:opacity-80 transition-opacity mb-2"
                    title="Logout"
                  >
                    <LogOut className="w-5 h-5 text-gray-600" />
                  </button>
                  <button
                    className="w-12 h-12 rounded-full flex items-center justify-center hover:opacity-80 transition-opacity"
                    title={`Connected: ${formatAddress(address)}`}
                  >
                    <img 
                      src={generateIdenticon(address)} 
                      alt="Address identicon" 
                      className="w-10 h-10 rounded-full"
                    />
                  </button>
                </>
              ) : isHydrated ? (
                <button
                  onClick={handleConnect}
                  disabled={isConnecting}
                  className="w-12 h-12 rounded-full flex items-center justify-center text-gray-600 hover:text-gray-800 transition-all disabled:opacity-50"
                  title="Connect Wallet"
                >
                  {isConnecting ? (
                    <div className="animate-spin w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full"></div>
                  ) : (
                    <Wallet className="w-5 h-5" />
                  )}
                </button>
              ) : (
                <div className="w-12 h-12 rounded-full flex items-center justify-center">
                  <div className="w-4 h-4 bg-gray-300 rounded-full"></div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Spacer for desktop */}
      <div className="hidden lg:block w-20 flex-shrink-0" />
    </>
  );
};

export default Sidebar;