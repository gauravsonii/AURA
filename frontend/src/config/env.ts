/**
 * Environment configuration for Aura Protocol
 */

export const config = {
  ai: {
    apiUrl: process.env.NEXT_PUBLIC_AI_API_URL || "https://aura-production-6374.up.railway.app",
    enabled: process.env.NEXT_PUBLIC_AI_ENABLED !== "false",
  },
  contracts: {
    rpcUrl:
      process.env.NEXT_PUBLIC_RPC_URL ||
      "https://api.avax.network/ext/bc/C/rpc",
    chainId: parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || "43114", 10),
  },
  features: {
    enableAI: process.env.NEXT_PUBLIC_ENABLE_AI !== "false",
    enableGovernance: process.env.NEXT_PUBLIC_ENABLE_GOVERNANCE !== "false",
    enableMagicLinks: process.env.NEXT_PUBLIC_ENABLE_MAGIC_LINKS !== "false",
  },
} as const;

export default config;
