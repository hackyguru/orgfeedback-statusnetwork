// Contract configuration for OrgFeedback on Status Network
export const CONTRACT_ADDRESS = "0xAab9Feae724F7251c6FCB9632423af9133C64480";

// Status Network Testnet configuration
export const STATUS_TESTNET = {
  id: 1660990954,
  name: 'Status Network Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    public: {
      http: ['https://public.sepolia.rpc.status.network'],
    },
    default: {
      http: ['https://public.sepolia.rpc.status.network'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Status Sepolia Explorer',
      url: 'https://sepoliascan.status.network',
    },
  },
  testnet: true,
};

// Chain configuration for wagmi
export const SUPPORTED_CHAINS = [STATUS_TESTNET];

// Default chain
export const DEFAULT_CHAIN = STATUS_TESTNET;