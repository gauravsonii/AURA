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
  projectId: 'aura-protocol',
  chains: [avalancheFuji],
  ssr: true,
});

export { config, queryClient };