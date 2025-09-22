"use client";

import { useState, useEffect } from "react";
import { useAccount, useReadContract } from "wagmi";
import { formatEther } from "viem";
import { CONTRACT_ADDRESSES } from "@/config/contracts";
import GovernanceABI from "@/abis/Governance.json";
import toast from "react-hot-toast";
import LoadingSpinner from "./ui/loading-spinner";

interface ProposalData {
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

interface ProposalCardProps {
  proposalId: number;
  onVote: (proposalId: number, support: boolean) => Promise<void>;
  onExecute: (proposalId: number) => Promise<void>;
  isPending: boolean;
  compact?: boolean;
}

export default function ProposalCard({
  proposalId,
  onVote,
  onExecute,
  isPending,
  compact = false,
}: ProposalCardProps) {
  const { address } = useAccount();
  const [hasVoted, setHasVoted] = useState(false);

  // Fetch proposal data
  const {
    data: proposalData,
    isLoading: proposalLoading,
    error: proposalError,
  } = useReadContract({
    address: CONTRACT_ADDRESSES.Governance,
    abi: GovernanceABI,
    functionName: "proposals",
    args: [BigInt(proposalId)],
  });

  // Fetch proposal status
  const {
    data: statusData,
    isLoading: statusLoading,
    error: statusError,
  } = useReadContract({
    address: CONTRACT_ADDRESSES.Governance,
    abi: GovernanceABI,
    functionName: "getProposalStatus",
    args: [BigInt(proposalId)],
  });

  // Check if user has voted
  const { data: votedData, error: votedError } = useReadContract({
    address: CONTRACT_ADDRESSES.Governance,
    abi: GovernanceABI,
    functionName: "hasVoted",
    args: address ? [BigInt(proposalId), address] : undefined,
  });

  // Debug logging
  useEffect(() => {
    console.log(`Proposal ${proposalId} Debug:`, {
      proposalData,
      statusData,
      votedData,
      proposalError,
      statusError,
      votedError,
      proposalLoading,
      statusLoading,
    });
  }, [
    proposalId,
    proposalData,
    statusData,
    votedData,
    proposalError,
    statusError,
    votedError,
    proposalLoading,
    statusLoading,
  ]);

  useEffect(() => {
    if (votedData !== undefined) {
      setHasVoted(votedData as boolean);
    }
  }, [votedData]);

  // Get time remaining for voting
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
  const getProposalStatusText = (proposal: ProposalData): string => {
    const now = BigInt(Math.floor(Date.now() / 1000));

    if (proposal.executed) return "Executed";
    if (now < proposal.startTime) return "Upcoming";
    if (now > proposal.endTime) {
      return proposal.yesVotes > proposal.noVotes ? "Passed" : "Failed";
    }
    return "Active";
  };

  const handleVote = async (support: boolean) => {
    const voteType = support ? "For" : "Against";
    const loadingToast = toast.loading(
      `Voting ${voteType} proposal #${proposalId}...`
    );

    try {
      await onVote(proposalId, support);
      setHasVoted(true);

      toast.success(`Successfully voted ${voteType} proposal #${proposalId}!`, {
        id: loadingToast,
      });
    } catch (error) {
      console.error("Failed to vote:", error);
      toast.error(
        `Failed to vote ${voteType} proposal #${proposalId}. Please try again.`,
        {
          id: loadingToast,
        }
      );
    }
  };

  const handleExecuteProposal = async () => {
    const loadingToast = toast.loading(`Executing proposal #${proposalId}...`);

    try {
      await onExecute(proposalId);

      toast.success(`Successfully executed proposal #${proposalId}!`, {
        id: loadingToast,
      });
    } catch (error) {
      console.error("Failed to execute proposal:", error);
      toast.error(
        `Failed to execute proposal #${proposalId}. Please try again.`,
        {
          id: loadingToast,
        }
      );
    }
  };

  if (proposalLoading || statusLoading) {
    return (
      <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-white/20 rounded mb-4"></div>
          <div className="h-4 bg-white/20 rounded mb-2"></div>
          <div className="h-4 bg-white/20 rounded mb-4"></div>
          <div className="h-10 bg-white/20 rounded"></div>
        </div>
      </div>
    );
  }

  if (!proposalData || !statusData) {
    if (proposalError || statusError) {
      return (
        <div className="bg-red-500/10 backdrop-blur-md border border-red-500/20 rounded-2xl p-6">
          <h3 className="text-xl font-semibold text-red-400 mb-2">
            Proposal #{proposalId} - Error
          </h3>
          <p className="text-red-300 text-sm">
            {proposalError ? `Proposal Error: ${proposalError.message}` : ""}
            {statusError ? `Status Error: ${statusError.message}` : ""}
          </p>
        </div>
      );
    }
    return null;
  }

  // Parse proposal data
  const proposal = {
    id: Number(proposalData[0]),
    proposer: proposalData[1] as string,
    yesVotes: proposalData[2] as bigint,
    noVotes: proposalData[3] as bigint,
    description: proposalData[4] as string,
    executed: proposalData[5] as boolean,
    newFee: proposalData[6] as bigint,
    startTime: proposalData[7] as bigint,
    endTime: proposalData[8] as bigint,
  };

  // Parse status data
  const status = {
    exists: statusData[0] as boolean,
    executed: statusData[1] as boolean,
    votingActive: statusData[2] as boolean,
    canExecute: statusData[3] as boolean,
    yesVotes: statusData[4] as bigint,
    noVotes: statusData[5] as bigint,
  };

  if (!status.exists) {
    return null;
  }

  const statusText = getProposalStatusText(proposal);
  const timeRemaining = getTimeRemaining(proposal.endTime);
  const totalVotes = proposal.yesVotes + proposal.noVotes;
  const yesPercentage =
    totalVotes > 0
      ? Number((proposal.yesVotes * BigInt(10000)) / totalVotes) / 100
      : 0;
  const noPercentage =
    totalVotes > 0
      ? Number((proposal.noVotes * BigInt(10000)) / totalVotes) / 100
      : 0;

  // Compact layout for sidebar
  if (compact) {
    return (
      <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-4">
        <div className="flex justify-between items-start mb-2">
          <h4 className="text-sm font-medium text-white">#{proposal.id}</h4>
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${
              statusText === "Active"
                ? "bg-green-500/20 text-green-400"
                : statusText === "Passed"
                ? "bg-blue-500/20 text-blue-400"
                : statusText === "Upcoming"
                ? "bg-yellow-500/20 text-yellow-400"
                : statusText === "Executed"
                ? "bg-purple-500/20 text-purple-400"
                : "bg-red-500/20 text-red-400"
            }`}
          >
            {statusText}
          </span>
        </div>

        <p
          className="text-gray-300 text-xs mb-3 overflow-hidden"
          style={{
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            textOverflow: "ellipsis",
          }}
        >
          {proposal.description}
        </p>

        {/* Compact Voting Progress */}
        {statusText !== "Upcoming" && totalVotes > 0 && (
          <div className="mb-3">
            <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden mb-1">
              <div className="h-full flex">
                <div
                  className="bg-green-500"
                  style={{ width: `${yesPercentage}%` }}
                ></div>
                <div
                  className="bg-red-500"
                  style={{ width: `${noPercentage}%` }}
                ></div>
              </div>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-green-400">
                {yesPercentage.toFixed(0)}%
              </span>
              <span className="text-red-400">{noPercentage.toFixed(0)}%</span>
            </div>
          </div>
        )}

        {/* Compact Action Buttons */}
        <div className="space-y-2">
          {statusText === "Active" && !hasVoted && (
            <div className="flex gap-2">
              <button
                onClick={() => handleVote(true)}
                disabled={isPending}
                className="flex-1 bg-green-600/20 hover:bg-green-600/30 border border-green-500/30 text-green-400 font-medium py-2 px-3 rounded-lg transition-all duration-300 disabled:opacity-50 text-xs"
              >
                For
              </button>
              <button
                onClick={() => handleVote(false)}
                disabled={isPending}
                className="flex-1 bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 text-red-400 font-medium py-2 px-3 rounded-lg transition-all duration-300 disabled:opacity-50 text-xs"
              >
                Against
              </button>
            </div>
          )}

          {statusText === "Passed" && !proposal.executed && (
            <button
              onClick={handleExecuteProposal}
              disabled={isPending}
              className="w-full bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-purple-400 font-medium py-2 rounded-lg transition-all duration-300 disabled:opacity-50 text-xs"
            >
              Execute
            </button>
          )}

          {hasVoted && (
            <div className="text-center">
              <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-400">
                Voted
              </span>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Full layout (original)
  return (
    <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-xl font-semibold text-white">
              Proposal #{proposal.id}
            </h3>
            <span
              className={`px-3 py-1 rounded-full text-xs font-medium ${
                statusText === "Active"
                  ? "bg-green-500/20 text-green-400"
                  : statusText === "Passed"
                  ? "bg-blue-500/20 text-blue-400"
                  : statusText === "Upcoming"
                  ? "bg-yellow-500/20 text-yellow-400"
                  : statusText === "Executed"
                  ? "bg-purple-500/20 text-purple-400"
                  : "bg-red-500/20 text-red-400"
              }`}
            >
              {statusText}
            </span>
            {hasVoted && (
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-400">
                Voted
              </span>
            )}
          </div>
          <p className="text-gray-300 text-sm mb-3">{proposal.description}</p>
          <div className="flex items-center gap-4 text-xs text-gray-400">
            <span>ID: #{proposal.id}</span>
            <span>
              Proposer: {proposal.proposer.slice(0, 6)}...
              {proposal.proposer.slice(-4)}
            </span>
            <span>New Fee: {Number(proposal.newFee)} basis points</span>
            <span>Ends: {timeRemaining}</span>
          </div>
        </div>
      </div>

      {/* Voting Progress */}
      {statusText !== "Upcoming" && totalVotes > 0 && (
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-green-400">
              For: {formatEther(proposal.yesVotes)} ({yesPercentage.toFixed(1)}
              %)
            </span>
            <span className="text-red-400">
              Against: {formatEther(proposal.noVotes)} (
              {noPercentage.toFixed(1)}%)
            </span>
          </div>
          <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden">
            <div className="h-full flex">
              <div
                className="bg-green-500"
                style={{ width: `${yesPercentage}%` }}
              ></div>
              <div
                className="bg-red-500"
                style={{ width: `${noPercentage}%` }}
              ></div>
            </div>
          </div>
          <div className="text-center text-gray-300 text-xs mt-1">
            {formatEther(totalVotes)} total votes
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        {statusText === "Active" && !hasVoted && (
          <>
            <button
              onClick={() => handleVote(true)}
              disabled={isPending}
              className="flex-1 bg-green-600/20 hover:bg-green-600/30 border border-green-500/30 text-green-400 font-medium py-3 rounded-xl transition-all duration-300 disabled:opacity-50"
            >
              {isPending ? "Voting..." : "Vote For"}
            </button>
            <button
              onClick={() => handleVote(false)}
              disabled={isPending}
              className="flex-1 bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 text-red-400 font-medium py-3 rounded-xl transition-all duration-300 disabled:opacity-50"
            >
              {isPending ? "Voting..." : "Vote Against"}
            </button>
          </>
        )}

        {statusText === "Passed" && !proposal.executed && (
          <button
            onClick={handleExecuteProposal}
            disabled={isPending}
            className="flex-1 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-purple-400 font-medium py-3 rounded-xl transition-all duration-300 disabled:opacity-50"
          >
            {isPending ? "Executing..." : "Execute Proposal"}
          </button>
        )}

        <button className="px-6 bg-white/10 hover:bg-white/20 border border-white/20 text-white py-3 rounded-xl transition-all duration-300">
          Details
        </button>
      </div>
    </div>
  );
}
