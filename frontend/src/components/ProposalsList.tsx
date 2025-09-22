"use client";

import { useReadContract } from "wagmi";
import { CONTRACT_ADDRESSES } from "@/config/contracts";
import GovernanceABI from "@/abis/Governance.json";
import ProposalCard from "./ProposalCard";

interface ProposalsListProps {
  onVote: (proposalId: number, support: boolean) => Promise<void>;
  onExecute: (proposalId: number) => Promise<void>;
  isPending: boolean;
  compact?: boolean;
}

export default function ProposalsList({
  onVote,
  onExecute,
  isPending,
  compact = false,
}: ProposalsListProps) {
  // Get proposal count
  const {
    data: proposalCount,
    isLoading,
    error,
  } = useReadContract({
    address: CONTRACT_ADDRESSES.Governance,
    abi: GovernanceABI,
    functionName: "proposalCount",
  });

  // Debug logging
  console.log("ProposalsList Debug:", {
    proposalCount,
    isLoading,
    error,
    contractAddress: CONTRACT_ADDRESSES.Governance,
  });

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-400"></div>
        <p className="text-gray-300 mt-3 text-sm">Loading proposals...</p>
      </div>
    );
  }

  if (!proposalCount || Number(proposalCount) === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-400 text-base mb-3">No proposals found</div>
        <p className="text-gray-500 mb-4 text-sm">
          Be the first to create a proposal!
        </p>
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
          <p className="text-blue-400 text-xs">
            <strong>Debug Info:</strong>
            <br />
            Proposal Count: {proposalCount?.toString() || "undefined"}
            <br />
            Loading: {isLoading ? "Yes" : "No"}
            <br />
            Error: {error ? error.message : "None"}
          </p>
        </div>
      </div>
    );
  }

  // Create array of proposal IDs
  const proposalIds = Array.from(
    { length: Number(proposalCount) },
    (_, i) => i + 1
  );

  return (
    <div className="space-y-4">
      {proposalIds.map((proposalId) => (
        <ProposalCard
          key={proposalId}
          proposalId={proposalId}
          onVote={onVote}
          onExecute={onExecute}
          isPending={isPending}
          compact={compact}
        />
      ))}
    </div>
  );
}
