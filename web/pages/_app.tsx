import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createConfig, http } from 'wagmi';
import { metaMask } from 'wagmi/connectors';
import { Toaster } from 'react-hot-toast';
import { STATUS_TESTNET } from '@/lib/config';

// Create wagmi config
const config = createConfig({
  chains: [STATUS_TESTNET],
  connectors: [
    metaMask(),
  ],
  transports: {
    [STATUS_TESTNET.id]: http(),
  },
});

// Create a client for react-query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

export default function App({ Component, pageProps }: AppProps) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <Component {...pageProps} />
        <Toaster
          position="bottom-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#ffffff',
              color: '#22262b',
              border: '1px solid rgba(34, 38, 43, 0.1)',
              boxShadow: '0 4px 6px -1px rgba(34, 38, 43, 0.1), 0 2px 4px -1px rgba(34, 38, 43, 0.06)',
            },
            success: {
              iconTheme: {
                primary: '#10b981',
                secondary: '#ffffff',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: '#ffffff',
              },
            },
          }}
        />
      </QueryClientProvider>
    </WagmiProvider>
  );
}
