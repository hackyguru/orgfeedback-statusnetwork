import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Sidebar from '@/components/Sidebar';
import { CONTRACT_ADDRESS } from '@/lib/config';
import { ORG_FEEDBACK_ABI } from '@/lib/abi';
// No encryption imports needed
import toast from 'react-hot-toast';
import Link from 'next/link';
import { 
  ChevronLeft, 
  ChevronRight, 
  Building2, 
  Users, 
  MessageSquare, 
  Shield, 
  CheckCircle,
  ArrowLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function NewFeedbackPage() {
  const { address, isConnected } = useAccount();
  const router = useRouter();
  const [selectedOrgId, setSelectedOrgId] = useState('');
  const [receiverAddress, setReceiverAddress] = useState('');
  const [message, setMessage] = useState('');
  const [revealToReceiver, setRevealToReceiver] = useState(false);
  const [revealToAdmin, setRevealToAdmin] = useState(false);
  const [isSending, setIsSending] = useState(false);
  // No encryption state needed
  const [userOrgs, setUserOrgs] = useState([]);
  const [orgMembers, setOrgMembers] = useState({});
  const [allOrgMetadata, setAllOrgMetadata] = useState({});
  
  // Multi-step state
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;
  
  // Fix hydration mismatch
  const [isHydrated, setIsHydrated] = useState(false);
  
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const { writeContract, data: hash, error } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  // Get user's organizations
  const { data: organizations } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: ORG_FEEDBACK_ABI,
    functionName: 'getOrganizationsByUser',
    args: address ? [address] : undefined,
    enabled: !!address,
  });

  // Get organization metadata for selected org
  const { data: orgMetadata } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: ORG_FEEDBACK_ABI,
    functionName: 'getOrgMetadata',
    args: selectedOrgId ? [selectedOrgId] : undefined,
    enabled: !!selectedOrgId,
  });

  // Handle URL parameters for pre-filling form when accepting feedback request
  useEffect(() => {
    if (router.query.recipient) {
      setReceiverAddress(router.query.recipient);
    }
    if (router.query.message) {
      setMessage(router.query.message);
    }
  }, [router.query]);

  useEffect(() => {
    if (organizations) {
      setUserOrgs(organizations);
      if (organizations.length === 1) {
        setSelectedOrgId(organizations[0]);
      }
      
      // Fetch metadata for all organizations
      const fetchAllOrgMetadata = async () => {
        try {
          const { ethers } = await import('ethers');
          const provider = new ethers.BrowserProvider(window.ethereum);
          const contract = new ethers.Contract(CONTRACT_ADDRESS, ORG_FEEDBACK_ABI, provider);
          
          const metadata = {};
          for (const orgId of organizations) {
            try {
              const orgData = await contract.getOrgMetadata(orgId);
              metadata[orgId] = {
                name: orgData[0],
                description: orgData[1],
                logoIpfsCid: orgData[2],
                owner: orgData[3]
              };
            } catch (error) {
              console.log(`Error fetching metadata for ${orgId}:`, error);
            }
          }
          setAllOrgMetadata(metadata);
        } catch (error) {
          console.log('Error fetching organization metadata:', error);
        }
      };
      
      fetchAllOrgMetadata();
    }
  }, [organizations]);

  useEffect(() => {
    if (isConfirmed) {
      setIsSending(false);
      toast.success('Feedback sent successfully!');
      router.push('/feedback');
    }
  }, [isConfirmed, router]);

  useEffect(() => {
    if (error) {
      setIsSending(false);
      toast.error('Failed to send feedback');
      console.error('Transaction error:', error);
    }
  }, [error]);

  const handleSendFeedback = async (e) => {
    e.preventDefault();

    if (!selectedOrgId) {
      toast.error('Please select an organization');
      return;
    }

    if (!receiverAddress.trim()) {
      toast.error('Please enter receiver address');
      return;
    }

    if (!receiverAddress.startsWith('0x') || receiverAddress.length !== 42) {
      toast.error('Please enter a valid Ethereum address');
      return;
    }

    if (!message.trim()) {
      toast.error('Please enter a feedback message');
      return;
    }

    // No encryption check needed

    try {
      setIsSending(true);

      // Send the feedback transaction with plain text message
      writeContract({
        address: CONTRACT_ADDRESS,
        abi: ORG_FEEDBACK_ABI,
        functionName: 'sendFeedback',
        args: [
          selectedOrgId,
          receiverAddress.trim(),
          message.trim(), // Same message for sender
          message.trim(), // Same message for receiver  
          message.trim(), // Same message for admin
          revealToReceiver,
          revealToAdmin,
        ],
      });

    } catch (err) {
      setIsSending(false);
      toast.error('Failed to send feedback');
      console.error('Error sending feedback:', err);
    }
  };

  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const validateReceiver = async () => {
    if (!selectedOrgId || !receiverAddress.trim()) return;
    
    if (!receiverAddress.startsWith('0x') || receiverAddress.length !== 42) {
      toast.error('Invalid Ethereum address format');
      return;
    }

    try {
      // This would ideally check if the receiver is a member of the org
      // For now, we'll just validate the address format
      toast.success('Receiver address is valid');
    } catch (err) {
      toast.error('Failed to validate receiver');
    }
  };

  // Step configuration
  const steps = [
    {
      id: 1,
      title: 'Organization & Recipient',
      description: 'Select organization and recipient',
      icon: <Building2 className="w-6 h-6" />,
    },
    {
      id: 2,
      title: 'Feedback Content',
      description: 'Write your feedback message',
      icon: <MessageSquare className="w-6 h-6" />,
    },
    {
      id: 3,
      title: 'Privacy Settings',
      description: 'Configure anonymity preferences',
      icon: <Shield className="w-6 h-6" />,
    },
    {
      id: 4,
      title: 'Review & Send',
      description: 'Review and submit your feedback',
      icon: <CheckCircle className="w-6 h-6" />,
    }
  ];

  // Step validation functions
  const validateStep = (step) => {
    switch (step) {
      case 1:
        if (!selectedOrgId) {
          toast.error('Please select an organization');
          return false;
        }
        if (!receiverAddress.trim()) {
          toast.error('Please enter receiver address');
          return false;
        }
        if (!receiverAddress.startsWith('0x') || receiverAddress.length !== 42) {
          toast.error('Please enter a valid Ethereum address');
          return false;
        }
        return true;
      case 2:
        if (!message.trim()) {
          toast.error('Please enter a feedback message');
          return false;
        }
        return true;
      case 3:
        // Privacy settings are optional, always valid
        return true;
      case 4:
        // Final validation before sending
        return validateStep(1) && validateStep(2);
      default:
        return false;
    }
  };

  // Navigation functions
  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(Math.min(currentStep + 1, totalSteps));
    }
  };

  const prevStep = () => {
    setCurrentStep(Math.max(currentStep - 1, 1));
  };

  const goToStep = (step) => {
    if (step <= currentStep + 1) {
      setCurrentStep(step);
    }
  };

  // Show loading state until hydrated to prevent hydration mismatch
  if (!isHydrated) {
    return (
      <div className="min-h-screen flex">
        <Sidebar />
        <div className="flex-1 p-8 lg:p-12">
          <div className="w-full">
            <div className="glass-card-solid p-12 text-center">
              <div className="animate-spin w-16 h-16 border-4 border-[#83785f] border-t-transparent rounded-full mx-auto mb-6"></div>
              <h1 className="text-3xl font-bold text-gray-800 mb-4">
                Loading...
              </h1>
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
            <div className="glass-card-solid p-12 text-center">
              <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-6" />
              <h1 className="text-3xl font-bold text-gray-800 mb-4">
                Send Feedback
              </h1>
              <p className="text-gray-600 mb-8">
                Please connect your wallet to send feedback
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-8">
            {userOrgs.length === 0 ? (
              <div className="glass-card-solid p-12 text-center">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">
                  No Organizations
                </h2>
                <p className="text-gray-600 mb-8">
                  You need to be a member of an organization to send feedback.
                </p>
                <Link
                  href="/org"
                  className="inline-block px-8 py-4 rounded-xl font-semibold hover:shadow-lg transition-all transform hover:scale-105 shadow-md"
                  style={{ background: '#22262b', color: '#ffffff' }}
                >
                  Create or Join Organization
                </Link>
              </div>
            ) : (
              <div className="space-y-8">
                <div className="glass-card-solid p-8">
                  <h3 className="text-2xl font-bold text-gray-800 mb-6">
                    Organization & Recipient
                  </h3>
                  <label htmlFor="organization" className="block text-lg font-semibold text-gray-800 mb-4">
                    Select Organization *
                  </label>
                  <div className="relative">
                    <select
                      id="organization"
                      value={selectedOrgId}
                      onChange={(e) => setSelectedOrgId(e.target.value)}
                      className="w-full px-6 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-500 focus:border-transparent outline-none transition-all text-lg appearance-none"
                      disabled={isSending || isConfirming}
                      required
                    >
                      <option value="">Choose an organization...</option>
                      {userOrgs.map((orgId) => (
                        <option key={orgId} value={orgId}>
                          {allOrgMetadata[orgId] ? `${allOrgMetadata[orgId].name} (${formatAddress(orgId)})` : formatAddress(orgId)} {orgId.toLowerCase() === address?.toLowerCase() && '(Your Org)'}
                        </option>
                      ))}
                    </select>
                    
                    {/* Custom dropdown with icons */}
                    <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                  {/* Organization preview with icon - moved outside the dropdown */}
                  {selectedOrgId && allOrgMetadata[selectedOrgId] && (
                    <motion.div 
                      className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="flex items-center space-x-3">
                        {allOrgMetadata[selectedOrgId].logoIpfsCid ? (
                          <img
                            src={`https://www.thirdstorage.cloud/api/gateway/${allOrgMetadata[selectedOrgId].logoIpfsCid}`}
                            alt={`${allOrgMetadata[selectedOrgId].name} logo`}
                            className="w-10 h-10 rounded-lg object-cover border border-gray-200"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div className={`w-10 h-10 bg-[#83785f] rounded-lg flex items-center justify-center ${allOrgMetadata[selectedOrgId].logoIpfsCid ? 'hidden' : 'flex'}`}>
                          <span className="text-white text-sm font-bold">
                            {allOrgMetadata[selectedOrgId].name?.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <div className="font-semibold text-gray-800">
                            {allOrgMetadata[selectedOrgId].name}
                          </div>
                          <div className="text-sm text-gray-500 font-mono">
                            {formatAddress(selectedOrgId)}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>

                <div className="glass-card-solid p-8">
                  <label htmlFor="receiver" className="block text-lg font-semibold text-gray-800 mb-4">
                    Who is the feedback for? *
                  </label>
                  <input
                    type="text"
                    id="receiver"
                    value={receiverAddress}
                    onChange={(e) => setReceiverAddress(e.target.value)}
                    placeholder="0x..."
                    className="w-full px-6 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-500 focus:border-transparent outline-none transition-all font-mono text-lg"
                    disabled={isSending || isConfirming}
                    required
                  />
                  <div className="text-sm text-gray-500 mt-3">
                    Enter the wallet address of the person you want to send feedback to
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      case 2:
        return (
          <div className="space-y-8">
            <div className="glass-card-solid p-8">
              <h3 className="text-2xl font-bold text-gray-800 mb-6">
                Feedback Content
              </h3>
              <label htmlFor="message" className="block text-lg font-semibold text-gray-800 mb-4">
                Your Feedback Message *
              </label>
              <textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Write your constructive feedback here... Be specific about what went well and what could be improved."
                rows={10}
                className="w-full px-6 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-500 focus:border-transparent outline-none transition-all resize-none text-lg leading-relaxed"
                disabled={isSending || isConfirming}
                required
              />
              <div className="flex justify-between items-center mt-4">
                <div className="text-sm text-gray-500">
                  This message will be stored securely on the blockchain
                </div>
                <div className="text-sm text-gray-500">
                  {message.length} characters
                </div>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-8">
            <div className="glass-card-solid p-8">
              <h3 className="text-2xl font-bold text-gray-800 mb-6">
                Privacy Settings
              </h3>
              <h4 className="text-xl font-semibold text-gray-800 mb-6">
                Identity Revelation Settings
              </h4>
              <div className="space-y-6">
                <label className="flex items-start space-x-4 p-4 border border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={revealToReceiver}
                    onChange={(e) => setRevealToReceiver(e.target.checked)}
                    className="w-5 h-5 text-[#83785f] accent-[#83785f] border-[#cfc7b5] rounded focus:ring-[#83785f] focus:border-[#83785f] mt-1"
                    disabled={isSending || isConfirming}
                  />
                  <div>
                    <div className="text-lg font-medium text-gray-800">
                      Reveal my identity to the receiver
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      If unchecked, the receiver won&apos;t know who sent this feedback. This allows for completely anonymous feedback.
                    </div>
                  </div>
                </label>
                
                <label className="flex items-start space-x-4 p-4 border border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={revealToAdmin}
                    onChange={(e) => setRevealToAdmin(e.target.checked)}
                    className="w-5 h-5 text-[#83785f] accent-[#83785f] border-[#cfc7b5] rounded focus:ring-[#83785f] focus:border-[#83785f] mt-1"
                    disabled={isSending || isConfirming}
                  />
                  <div>
                    <div className="text-lg font-medium text-gray-800">
                      Reveal my identity to the organization admin & moderators
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      If unchecked, the admin and moderators won&apos;t know who sent this feedback. Enable this if you want admin/moderator oversight.
                    </div>
                  </div>
                </label>
              </div>
            </div>

            <div className="card-important p-8 rounded-xl">
              <h4 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                <Shield className="w-6 h-6 mr-2" />
                Privacy Information
              </h4>
              <ul className="text-gray-700 space-y-2">
                <li>• Your message will be stored on the blockchain</li>
                <li>• Your anonymity settings control identity revelation</li>
                <li>• Only organization members can access feedback</li>
                <li>• Admins and moderators can see all feedback in the organization</li>
                <li>• Anonymous feedback remains anonymous unless you allow identity revelation</li>
                <li>• All feedback is stored securely and immutably</li>
              </ul>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-8">
            <div className="space-y-6">
              <div className="glass-card-solid p-8">
                <h3 className="text-2xl font-bold text-gray-800 mb-6">
                  Review & Send
                </h3>
                <h4 className="text-lg font-semibold text-gray-800 mb-4">Organization & Recipient</h4>
                <div className="space-y-3">
                  <div>
                    <span className="text-sm text-gray-500">Organization:</span>
                    <div className="font-mono text-gray-800">{formatAddress(selectedOrgId)}</div>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Recipient:</span>
                    <div className="font-mono text-gray-800">{formatAddress(receiverAddress)}</div>
                  </div>
                </div>
              </div>

              <div className="glass-card-solid p-8">
                <h4 className="text-lg font-semibold text-gray-800 mb-4">Feedback Message</h4>
                <div className="bg-gray-50 p-4 rounded-lg border-l-4 border-[#83785f]">
                  <p className="text-gray-800 whitespace-pre-wrap">{message}</p>
                </div>
              </div>

              <div className="glass-card-solid p-8">
                <h4 className="text-lg font-semibold text-gray-800 mb-4">Privacy Settings</h4>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    {revealToReceiver ? (
                      <CheckCircle className="w-5 h-5 text-[#83785f]" />
                    ) : (
                      <div className="w-5 h-5 border-2 border-gray-300 rounded-full"></div>
                    )}
                    <span className="text-gray-700">Reveal identity to receiver</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {revealToAdmin ? (
                      <CheckCircle className="w-5 h-5 text-[#83785f]" />
                    ) : (
                      <div className="w-5 h-5 border-2 border-gray-300 rounded-full"></div>
                    )}
                    <span className="text-gray-700">Reveal identity to admin</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex">
      <Sidebar />
      
      <div className="flex-1 p-8 lg:p-12">
        <div className="w-full">
          {/* Header */}
          <div className="mb-10">
            <h1 className="text-4xl font-bold text-gray-800 mb-2">
              Send Feedback
            </h1>
            <p className="text-gray-600 text-lg">
              Send secure feedback to members of your organization
            </p>
          </div>

          {/* Progress Indicator */}
          <div className="mb-12">
            <div className="flex space-x-4">
              {steps.map((step) => (
                <motion.button
                  key={step.id}
                  onClick={() => goToStep(step.id)}
                  className={`
                    flex-1 p-4 rounded-xl border-2 transition-all hover:scale-[1.02] relative overflow-hidden
                    ${currentStep >= step.id ? 'shadow-lg' : ''}
                  `}
                  style={currentStep >= step.id ? { 
                    background: '#22262b',
                    borderColor: '#22262b',
                    color: '#cfc7b5'
                  } : {
                    background: '#cfc7b5',
                    borderColor: '#22262b',
                    color: '#22262b'
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: step.id * 0.1 }}
                >
                  {/* Step number gradient background */}
                  <div 
                    className="absolute inset-0 flex items-center justify-start opacity-10 pointer-events-none"
                    style={{
                      background: `linear-gradient(135deg, rgba(34, 38, 43, 0.1) 0%, rgba(207, 199, 181, 0.1) 100%)`
                    }}
                  >
                    <span className="text-6xl font-bold ml-4" style={{ 
                      color: currentStep >= step.id ? '#cfc7b5' : '#22262b'
                    }}>
                      {step.id}
                    </span>
                  </div>
                  
                  <div className="flex flex-col items-center space-y-2 relative z-10">
                    <div className="flex-shrink-0">
                      {step.icon}
                    </div>
                    
                    <div className="text-center">
                      <div className="text-sm font-semibold mb-1">
                        {step.title}
                      </div>
                      <div className="text-xs opacity-80">
                        {step.description}
                      </div>
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Step Content */}
          <div className="mb-12">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                {renderStepContent()}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Navigation Buttons */}
          {userOrgs.length > 0 && (
            <div className="flex justify-between items-center">
              <motion.button
                onClick={prevStep}
                disabled={currentStep === 1}
                className="flex items-center space-x-2 px-8 py-4 rounded-xl font-semibold border-2 border-gray-300 text-gray-600 hover:border-gray-400 hover:text-gray-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
              >
                <ChevronLeft className="w-5 h-5" />
                <span>Previous</span>
              </motion.button>

              {currentStep < totalSteps ? (
                <motion.button
                  onClick={nextStep}
                  className="flex items-center space-x-2 px-8 py-4 rounded-xl font-semibold hover:shadow-lg transition-all transform hover:scale-105 shadow-md"
                  style={{ background: '#22262b', color: '#ffffff' }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <span>Next</span>
                  <ChevronRight className="w-5 h-5" />
                </motion.button>
              ) : (
                <motion.button
                  onClick={handleSendFeedback}
                  disabled={
                    isSending || 
                    isConfirming || 
                    !validateStep(4)
                  }
                  className="flex items-center space-x-3 px-10 py-4 rounded-xl font-semibold hover:shadow-lg transition-all transform hover:scale-105 shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  style={{ background: '#22262b', color: '#ffffff' }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {isSending || isConfirming ? (
                    <>
                      <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                      <span>
                        {isSending ? 'Sending...' : 'Confirming...'}
                      </span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      <span>Send Feedback</span>
                    </>
                  )}
                </motion.button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}