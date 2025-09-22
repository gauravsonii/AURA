"use client";

import { useState, useEffect } from "react";
import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { avalancheFuji } from "wagmi/chains";
import { CONTRACT_ADDRESSES } from "@/config/contracts";
import AuraGovernanceTokenABI from "@/abis/AuraGovernanceToken.json";
import toast from "react-hot-toast";

interface DelegationHelperProps {
  onDelegationComplete: () => void;
}

export default function DelegationHelper({
  onDelegationComplete,
}: DelegationHelperProps) {
  const { address, isConnected } = useAccount();
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
    });

  const [showForm, setShowForm] = useState(false);

  const handleSelfDelegation = async () => {
    if (!isConnected || !address) {
      toast.error("Please connect your wallet first!");
      return;
    }

    const loadingToast = toast.loading("Delegating tokens to yourself...");

    try {
      await writeContract({
        address: CONTRACT_ADDRESSES.AuraGovernanceToken as `0x${string}`,
        abi: AuraGovernanceTokenABI,
        functionName: "delegate",
        args: [address],
        chain: avalancheFuji,
        account: address as `0x${string}`,
      });
    } catch (error) {
      console.error("Error delegating:", error);
      toast.error("Failed to delegate tokens. Please try again.", {
        id: loadingToast,
      });
    }
  };

  // Handle transaction confirmation
  useEffect(() => {
    if (isConfirmed && hash) {
      toast.success("Successfully delegated tokens! You can now vote.", {
        id: hash,
      });
      onDelegationComplete();
      setShowForm(false);
    }
  }, [isConfirmed, hash, onDelegationComplete]);

  useEffect(() => {
    if (error) {
      console.error("Delegation error:", error);
      toast.error(`Failed to delegate: ${error.message || "Unknown error"}`);
    }
  }, [error]);

  if (!showForm) {
    return (
      <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 mb-6">
        <div className="flex items-center justify-between">
          <div>
            {/* <h3 className="text-yellow-400 font-medium mb-1">⚠️ No Voting Power</h3> */}
            <p className="text-gray-300 text-sm">
              You need to delegate your tokens to yourself to vote on proposals.
            </p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-yellow-600/20 hover:bg-yellow-600/30 border border-yellow-500/30 text-yellow-400 font-medium rounded-lg transition-all duration-300"
          >
            Delegate
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 mb-6">
      <h3 className="text-blue-400 font-medium mb-2">Delegate Your Tokens</h3>
      <p className="text-gray-300 text-sm mb-4">
        To vote on proposals, you need to delegate your AURA tokens. Delegating
        to yourself gives you voting power.
      </p>

      <div className="flex gap-3">
        <button
          onClick={handleSelfDelegation}
          disabled={isPending || isConfirming}
          className="flex-1 px-4 py-2 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-400 font-medium rounded-lg transition-all duration-300 disabled:opacity-50"
        >
          {isPending || isConfirming ? "Delegating..." : "Delegate to Myself"}
        </button>
        <button
          onClick={() => setShowForm(false)}
          className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-medium rounded-lg transition-all duration-300"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
