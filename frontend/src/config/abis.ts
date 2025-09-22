// Import all contract ABIs
import TestTokensABI from '../abis/TestTokens.json';
import AuraGovernanceTokenABI from '../abis/AuraGovernanceToken.json';
import LPTokenABI from '../abis/LPToken.json';
import LiquidityPoolABI from '../abis/LiquidityPool.json';
import GovernanceABI from '../abis/Governance.json';
import LaunchpadABI from '../abis/Launchpad.json';
import MagicLinkEscrowABI from '../abis/MagicLinkEscrow.json';

// Export ABIs with proper typing
export const ABIS = {
  TestTokens: TestTokensABI,
  AuraGovernanceToken: AuraGovernanceTokenABI,
  LPToken: LPTokenABI,
  LiquidityPool: LiquidityPoolABI,
  Governance: GovernanceABI,
  Launchpad: LaunchpadABI,
  MagicLinkEscrow: MagicLinkEscrowABI
} as const;

// Helper function to get ABI by contract name
export function getContractABI(contractName: keyof typeof ABIS) {
  return ABIS[contractName];
}

// Type definitions for contract names
export type ContractName = keyof typeof ABIS;

// Export individual ABIs for direct use
export {
  TestTokensABI,
  AuraGovernanceTokenABI,
  LPTokenABI,
  LiquidityPoolABI,
  GovernanceABI,
  LaunchpadABI,
  MagicLinkEscrowABI
};
