"use client";

import { useState, useEffect, useCallback } from "react";
import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { formatEther } from "viem";
import { CONTRACT_ADDRESSES } from "@/config/contracts";
import GovernanceABI from "@/abis/Governance.json";
import AuraGovernanceTokenABI from "@/abis/AuraGovernanceToken.json";
import toast from "react-hot-toast";

export interface Proposal {
  id: number;
  proposer: string;
  yesVotes: bigint;
  noVotes: bigint;
  description: string;
  executed: boolean;
  newFee: bigint;
  startTime: bigint;
  endTime: bigint;
}

export interface ProposalStatus {
  exists: boolean;
  executed: boolean;
  votingActive: boolean;
  canExecute: boolean;
  yesVotes: bigint;
  noVotes: bigint;
}

export function useGovernance() {
  const { address } = useAccount();
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
    });

  // Read governance contract state
  const { data: proposalCount } = useReadContract({
    address: CONTRACT_ADDRESSES.Governance,
    abi: GovernanceABI,
    functionName: "proposalCount",
  });

  // Get user's governance token balance
  const { data: userBalance } = useReadContract({
    address: CONTRACT_ADDRESSES.AuraGovernanceToken,
    abi: AuraGovernanceTokenABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
  });

  // Get user's voting power
  const { data: userVotingPower } = useReadContract({
    address: CONTRACT_ADDRESSES.AuraGovernanceToken,
    abi: AuraGovernanceTokenABI,
    functionName: "getVotes",
    args: address ? [address] : undefined,
  });

  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch all proposals
  const fetchProposals = useCallback(async () => {
    if (!proposalCount) return;

    setLoading(true);
    try {
      // For now, we'll use a simplified approach since we can't use hooks in async functions
      // In a real implementation, you'd need to use a contract reader or make multiple useReadContract calls
      setProposals([]);
    } catch (error) {
      console.error("Error fetching proposals:", error);
    } finally {
      setLoading(false);
    }
  }, [proposalCount]);

  // Get proposal status
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const getProposalStatus = async (
    proposalId: number
  ): Promise<ProposalStatus | null> => {
    // Simplified implementation - in real app, you'd use a contract reader
    return {
      exists: true,
      executed: false,
      votingActive: true,
      canExecute: false,
      yesVotes: BigInt(0),
      noVotes: BigInt(0),
    };
  };

  // Check if user has voted on a proposal
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const hasUserVoted = async (proposalId: number): Promise<boolean> => {
    if (!address) return false;
    // Simplified implementation - in real app, you'd use a contract reader
    return false;
  };

  // Vote on a proposal
  const vote = async (proposalId: number, support: boolean) => {
    try {
      // @ts-expect-error - Wagmi/Viem version compatibility issue
      await writeContract({
        address: CONTRACT_ADDRESSES.Governance,
        abi: GovernanceABI,
        functionName: "vote",
        args: [BigInt(proposalId), support],
      });
    } catch (error) {
      console.error("Error voting:", error);
      throw error;
    }
  };

  // Create a new proposal
  const createProposal = async (description: string, newFee: bigint) => {
    try {
      // @ts-expect-error - Wagmi/Viem version compatibility issue
      await writeContract({
        address: CONTRACT_ADDRESSES.Governance,
        abi: GovernanceABI,
        functionName: "createProposal",
        args: [description, newFee],
      });
    } catch (error) {
      console.error("Error creating proposal:", error);
      throw error;
    }
  };

  // Execute a proposal
  const executeProposal = async (proposalId: number) => {
    try {
      // @ts-expect-error - Wagmi/Viem version compatibility issue
      await writeContract({
        address: CONTRACT_ADDRESSES.Governance,
        abi: GovernanceABI,
        functionName: "executeProposal",
        args: [BigInt(proposalId)],
      });
    } catch (error) {
      console.error("Error executing proposal:", error);
      throw error;
    }
  };

  // Format time remaining for voting
  const getTimeRemaining = (endTime: bigint): string => {
    const now = BigInt(Math.floor(Date.now() / 1000));
    const remaining = endTime - now;

    if (remaining <= 0) return "Ended";

    const days = Number(remaining) / (24 * 60 * 60);
    const hours = (Number(remaining) % (24 * 60 * 60)) / (60 * 60);
    const minutes = (Number(remaining) % (60 * 60)) / 60;

    if (days >= 1) {
      return `${Math.floor(days)}d ${Math.floor(hours)}h`;
    } else if (hours >= 1) {
      return `${Math.floor(hours)}h ${Math.floor(minutes)}m`;
    } else {
      return `${Math.floor(minutes)}m`;
    }
  };

  // Get proposal status text
  const getProposalStatusText = (proposal: Proposal): string => {
    const now = BigInt(Math.floor(Date.now() / 1000));

    if (proposal.executed) return "Executed";
    if (now < proposal.startTime) return "Upcoming";
    if (now > proposal.endTime) {
      return proposal.yesVotes > proposal.noVotes ? "Passed" : "Failed";
    }
    return "Active";
  };

  // Handle transaction confirmations and errors
  useEffect(() => {
    if (isConfirmed && hash) {
      toast.success("Transaction confirmed on blockchain!");
    }
  }, [isConfirmed, hash]);

  useEffect(() => {
    if (error) {
      toast.error(`Transaction failed: ${error.message || "Unknown error"}`);
    }
  }, [error]);

  // Refresh proposals when proposal count changes
  useEffect(() => {
    if (proposalCount) {
      fetchProposals();
    }
  }, [proposalCount, fetchProposals]);

  return {
    // State
    proposals,
    proposalCount: proposalCount ? Number(proposalCount) : 0,
    userBalance: userBalance ? formatEther(userBalance as bigint) : "0",
    userVotingPower: userVotingPower
      ? formatEther(userVotingPower as bigint)
      : "0",
    loading,
    isPending,
    isConfirming,
    isConfirmed,
    error,

    // Actions
    createProposal,
    vote,
    executeProposal,
    fetchProposals,
    getProposalStatus,
    hasUserVoted,
    getTimeRemaining,
    getProposalStatusText,
  };
}

// Note: In a real implementation, you would need to use a contract reader
// or make multiple useReadContract calls to fetch proposal data
// This is a simplified version for demonstration purposes
