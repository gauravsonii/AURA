#!/bin/bash

# Simple deployment script for Avalanche Fuji Testnet
# Make sure to set your environment variables first:
# export PRIVATE_KEY="your_private_key_here"
# export FUJI_RPC_URL="https://api.avax-test.network/ext/bc/C/rpc"

echo "Deploying to Avalanche Fuji Testnet..."
echo "Chain ID: 43113"
echo "Currency: AVAX"
echo ""

forge script script/Deploy.s.sol:DeployAvalanche \
    --rpc-url $FUJI_RPC_URL \
    --private-key $PRIVATE_KEY \
    --broadcast \
    --skip-size-check

echo ""
echo "Deployment completed! Check the output above for contract addresses."
