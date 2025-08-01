// OrgFeedback Contract ABI
export const ORG_FEEDBACK_ABI = [
  // Events
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "address", "name": "orgId", "type": "address"},
      {"indexed": true, "internalType": "address", "name": "sender", "type": "address"},
      {"indexed": true, "internalType": "address", "name": "receiver", "type": "address"},
      {"indexed": false, "internalType": "uint256", "name": "feedbackIndex", "type": "uint256"}
    ],
    "name": "FeedbackSent",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "address", "name": "orgId", "type": "address"},
      {"indexed": true, "internalType": "address", "name": "member", "type": "address"}
    ],
    "name": "MemberAdded",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "address", "name": "orgId", "type": "address"},
      {"indexed": true, "internalType": "address", "name": "member", "type": "address"}
    ],
    "name": "MemberRemoved",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "address", "name": "orgId", "type": "address"},
      {"indexed": false, "internalType": "address", "name": "owner", "type": "address"},
      {"indexed": false, "internalType": "string", "name": "name", "type": "string"}
    ],
    "name": "OrganizationCreated",
    "type": "event"
  },
  // Functions
  {
    "inputs": [
      {"internalType": "address", "name": "orgId", "type": "address"},
      {"internalType": "address", "name": "member", "type": "address"}
    ],
    "name": "addMember",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "string", "name": "name", "type": "string"},
      {"internalType": "string", "name": "description", "type": "string"}
    ],
    "name": "createOrganization",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getAccessibleFeedbacks",
    "outputs": [
      {"internalType": "address[]", "name": "orgIds", "type": "address[]"},
      {"internalType": "address[]", "name": "senders", "type": "address[]"},
      {"internalType": "address[]", "name": "receivers", "type": "address[]"},
      {"internalType": "string[]", "name": "messages", "type": "string[]"},
      {"internalType": "uint256[]", "name": "timestamps", "type": "uint256[]"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getFeedbackCount",
    "outputs": [
      {"internalType": "uint256", "name": "", "type": "uint256"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "address", "name": "orgId", "type": "address"}
    ],
    "name": "getOrgMetadata",
    "outputs": [
      {"internalType": "string", "name": "name", "type": "string"},
      {"internalType": "string", "name": "description", "type": "string"},
      {"internalType": "address", "name": "owner", "type": "address"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "address", "name": "user", "type": "address"}
    ],
    "name": "getOrganizationsByUser",
    "outputs": [
      {"internalType": "address[]", "name": "", "type": "address[]"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "address", "name": "orgId", "type": "address"},
      {"internalType": "address", "name": "user", "type": "address"}
    ],
    "name": "isMember",
    "outputs": [
      {"internalType": "bool", "name": "", "type": "bool"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "address", "name": "orgId", "type": "address"},
      {"internalType": "address", "name": "member", "type": "address"}
    ],
    "name": "removeMember",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "address", "name": "orgId", "type": "address"},
      {"internalType": "address", "name": "receiver", "type": "address"},
      {"internalType": "string", "name": "forSender", "type": "string"},
      {"internalType": "string", "name": "forReceiver", "type": "string"},
      {"internalType": "string", "name": "forAdmin", "type": "string"},
      {"internalType": "bool", "name": "revealToReceiver", "type": "bool"},
      {"internalType": "bool", "name": "revealToAdmin", "type": "bool"}
    ],
    "name": "sendFeedback",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "totalOrganizations",
    "outputs": [
      {"internalType": "uint256", "name": "", "type": "uint256"}
    ],
    "stateMutability": "view",
    "type": "function"
  }
];