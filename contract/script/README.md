# Avalanche Fuji Testnet Deployment

Simple deployment script for all Avalanche ecosystem contracts on Fuji Testnet.

## Network Information

- **Network**: Avalanche Fuji Testnet
- **Chain ID**: 43113 (0xa869)
- **Currency**: AVAX
- **RPC URL**: https://api.avax-test.network/ext/bc/C/rpc
- **Explorer**: https://testnet.snowtrace.io/

## Prerequisites

1. **Install Foundry**
   ```bash
   curl -L https://foundry.paradigm.xyz | bash
   foundryup
   ```

2. **Get Testnet AVAX**
   - Visit the [Avalanche Fuji Faucet](https://faucet.avax.network/)
   - Request testnet AVAX for your wallet

3. **Set Environment Variables**
   ```bash
   export PRIVATE_KEY="your_private_key_here"
   export FUJI_RPC_URL="https://api.avax-test.network/ext/bc/C/rpc"
   ```

## Deployment

### Single Command Deployment

```bash
cd contract
forge script script/Deploy.s.sol:DeployAvalanche \
    --rpc-url $FUJI_RPC_URL \
    --private-key $PRIVATE_KEY \
    --broadcast \
    --skip-size-check \
    # --verify \
    # --etherscan-api-key $SNOWTRACE_API_KEY \
    # --verifier-url https://api.snowtrace.io/api \
    # --verifier etherscan
```

## What Gets Deployed

The script deploys all 7 contracts in the correct order:

1. **TestTokens** (Base Token) - ERC20 token for testing
2. **AuraGovernanceToken** (AGOV) - Governance token with voting capabilities  
3. **LPToken** (ALP) - Liquidity provider token
4. **LiquidityPool** - AMM pool for token swaps
5. **Governance** - DAO governance system
6. **Launchpad** - Token launch platform
7. **MagicLinkEscrow** - Escrow system with magic links

## Contract Relationships

```
Governance
├── LiquidityPool (fee management)
└── AuraGovernanceToken (voting power)

LiquidityPool
├── TestTokens (Token A)
├── AuraGovernanceToken (Token B)
├── LPToken (liquidity provider tokens)
└── Governance (fee updates)

Launchpad
├── TestTokens (base token for contributions)
└── LiquidityPool (creates new pools for launched tokens)

MagicLinkEscrow
└── (Standalone - no dependencies)
```

## After Deployment

The script will output all contract addresses. Save these for frontend integration:

```
Base Token (TestTokens): 0x...
Governance Token (AGOV): 0x...
LP Token (ALP): 0x...
Liquidity Pool: 0x...
Governance: 0x...
Launchpad: 0x...
Magic Link Escrow: 0x...
```

## Testing

Run tests to verify everything works:

```bash
cd contract
forge test
```

## Troubleshooting

- **Insufficient Funds**: Get testnet AVAX from [faucet](https://faucet.avax.network/)
- **RPC Issues**: Verify FUJI_RPC_URL is correct
