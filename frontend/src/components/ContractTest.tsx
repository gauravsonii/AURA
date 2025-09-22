"use client";

import { useReadContract, useAccount } from "wagmi";
import { CONTRACT_ADDRESSES } from "@/config/contracts";
import GovernanceABI from "@/abis/Governance.json";

export default function ContractTest() {
  const { address, isConnected } = useAccount();

  // Test basic contract read
  const { data: proposalCount, isLoading, error } = useReadContract({
    address: CONTRACT_ADDRESSES.Governance,
    abi: GovernanceABI,
    functionName: "proposalCount",
  });

  // Test governance token balance
  const { data: tokenBalance } = useReadContract({
    address: CONTRACT_ADDRESSES.AuraGovernanceToken,
    abi: [
      {
        "type": "function",
        "name": "balanceOf",
        "inputs": [{"name": "account", "type": "address"}],
        "outputs": [{"name": "", "type": "uint256"}],
        "stateMutability": "view"
      }
    ],
    functionName: "balanceOf",
    args: address ? [address] : undefined,
  });

  // Test voting power
  const { data: votingPower } = useReadContract({
    address: CONTRACT_ADDRESSES.AuraGovernanceToken,
    abi: [
      {
        "type": "function",
        "name": "getVotes",
        "inputs": [{"name": "account", "type": "address"}],
        "outputs": [{"name": "", "type": "uint256"}],
        "stateMutability": "view"
      }
    ],
    functionName: "getVotes",
    args: address ? [address] : undefined,
  });

  // Test delegation
  const { data: delegates } = useReadContract({
    address: CONTRACT_ADDRESSES.AuraGovernanceToken,
    abi: [
      {
        "type": "function",
        "name": "delegates",
        "inputs": [{"name": "account", "type": "address"}],
        "outputs": [{"name": "", "type": "address"}],
        "stateMutability": "view"
      }
    ],
    functionName: "delegates",
    args: address ? [address] : undefined,
  });

  return (
    <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 mb-6">
      <h3 className="text-xl font-semibold text-white mb-4">Contract Test</h3>
      
      <div className="space-y-4">
        <div>
          <h4 className="text-white font-medium mb-2">Network Info:</h4>
          <p className="text-gray-300 text-sm">Chain ID: 43113 (Avalanche Fuji)</p>
          <p className="text-gray-300 text-sm">Connected: {isConnected ? "Yes" : "No"}</p>
          <p className="text-gray-300 text-sm">Address: {address || "Not connected"}</p>
        </div>

        <div>
          <h4 className="text-white font-medium mb-2">Contract Addresses:</h4>
          <p className="text-gray-300 text-sm">Governance: {CONTRACT_ADDRESSES.Governance}</p>
          <p className="text-gray-300 text-sm">Token: {CONTRACT_ADDRESSES.AuraGovernanceToken}</p>
        </div>

        <div>
          <h4 className="text-white font-medium mb-2">Contract Calls:</h4>
          <p className="text-gray-300 text-sm">
            Proposal Count: {isLoading ? "Loading..." : error ? `Error: ${error.message}` : proposalCount?.toString() || "No data"}
          </p>
          <p className="text-gray-300 text-sm">
            Your Token Balance: {tokenBalance ? tokenBalance.toString() : "Not available"}
          </p>
          <p className="text-gray-300 text-sm">
            Your Voting Power: {votingPower ? votingPower.toString() : "Not available"}
          </p>
          <p className="text-gray-300 text-sm">
            Your Delegate: {delegates ? delegates.toString() : "Not available"}
          </p>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3">
            <p className="text-red-400 text-sm">Error: {error.message}</p>
          </div>
        )}
      </div>
    </div>
  );
}