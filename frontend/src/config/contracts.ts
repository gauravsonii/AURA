// Contract addresses and configuration for Avalanche Fuji Testnet
export const CHAIN_ID = 43113;
export const NETWORK_NAME = "Avalanche Fuji Testnet";
export const CURRENCY = "AVAX";

// Contract addresses from deployment
export const CONTRACT_ADDRESSES = {
  TestTokens: "0xd3521c22Afb98571875Fe02B90F14e912046420b",
  AuraGovernanceToken: "0x1E9E4db85169A4F111Cc170Eb27B18B1f69DBa97", 
  LPToken: "0xC63ef30Cec16f95e73Abc9bc6fd12AC279d18940",
  LiquidityPool: "0x2C13B5704d2638d18283c985bFc5c4b2B243Ff0C",
  Governance: "0x244231A91AB6092F186D5C212BAe122968411502",
  Launchpad: "0x15C86B01ee396EF7754B7508ea3e0093509350E7",
  MagicLinkEscrow: "0x9522E5D602B272f70c999a033D517F2598321dBF"
} as const;

// Contract metadata
export const CONTRACT_METADATA = {
  TestTokens: {
    name: "Test Token",
    symbol: "TEST",
    decimals: 18,
    description: "Base test token for the platform"
  },
  AuraGovernanceToken: {
    name: "Aura Governance Token", 
    symbol: "AGOV",
    decimals: 18,
    description: "Governance token with voting capabilities"
  },
  LPToken: {
    name: "Aura LP Token",
    symbol: "ALP", 
    decimals: 18,
    description: "Liquidity provider token representing pool shares"
  },
  LiquidityPool: {
    description: "Main AMM liquidity pool for token swaps",
    tokenA: CONTRACT_ADDRESSES.TestTokens,
    tokenB: CONTRACT_ADDRESSES.AuraGovernanceToken,
    lpToken: CONTRACT_ADDRESSES.LPToken,
    initialFee: 30 // basis points
  },
  Governance: {
    description: "DAO governance system for protocol management",
    votingPeriod: 604800, // 7 days in seconds
    linkedLiquidityPool: CONTRACT_ADDRESSES.LiquidityPool,
    linkedGovernanceToken: CONTRACT_ADDRESSES.AuraGovernanceToken
  },
  Launchpad: {
    description: "Platform for launching new tokens with liquidity provision",
    baseToken: CONTRACT_ADDRESSES.TestTokens,
    linkedLiquidityPool: CONTRACT_ADDRESSES.LiquidityPool,
    launchFee: 1000 // basis points (10%)
  },
  MagicLinkEscrow: {
    description: "Escrow system for secure token transfers via magic links",
    defaultExpiration: 2592000, // 30 days in seconds
    maxExpiration: 31536000 // 365 days in seconds
  }
} as const;

// Deployment information
export const DEPLOYMENT_INFO = {
  deployer: "0x0003613a5FBbdB74c7E5af87AB1D6338453391A3",
  deploymentDate: "2025-09-20",
  deploymentBlock: 46177832,
  transactionHashes: {
    TestTokens: "0xc824635aadc5f6bc46fe37f150959855e5e121113e3159f23879183800105974",
    AuraGovernanceToken: "0x2f681e8ef5cf0ed12c71dd5c61df61c4a8abc3393fb45cf3031686f88b6d8582",
    LPToken: "0xbe276550d2e40a684b119a99ec882ef7fd9c457ce41cd863f4a12fd3e47be406",
    LiquidityPool: "0xaf70ad461e3d7e98eb975ba832a50c6606a32f10e7f45c9c78fa5abc2e5fe748",
    Governance: "0x2321611266d8a478f7ccee3ed99991c8a4bd7bece9c9a0fc182603932ff35b51",
    Launchpad: "0x084c9c5f1b4dd560b42a5a5a41dcca802c7ee13c1c4e013c894d804d77a733c8",
    MagicLinkEscrow: "0x34810f38cb2f7276c075eb70825ab8498d8dd973dc22c76b12401e41634ea221"
  }
} as const;

// Helper function to get contract address by name
export function getContractAddress(contractName: keyof typeof CONTRACT_ADDRESSES): string {
  return CONTRACT_ADDRESSES[contractName];
}

// Helper function to get contract metadata
export function getContractMetadata(contractName: keyof typeof CONTRACT_METADATA) {
  return CONTRACT_METADATA[contractName];
}
