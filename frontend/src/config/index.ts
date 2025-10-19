import '@rainbow-me/rainbowkit/styles.css';
import {
  getDefaultConfig,
} from '@rainbow-me/rainbowkit';
import {
  avalancheFuji,
} from 'wagmi/chains';
import {
  QueryClient,
} from "@tanstack/react-query";


const queryClient = new QueryClient();


const config = getDefaultConfig({
  appName: 'Aura Protocol',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'aura-protocol-demo',
  chains: [avalancheFuji],
  ssr: true,
});

export { config, queryClient };