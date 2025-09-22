/**
 * Enhanced AI-Contract Integration Component
 * Real integration with existing Governance and LiquidityPool contracts
 */

"use client";

import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseEther, formatEther } from "viem";
import { useFeeRecommendation, useAIFormatters } from "@/hooks/useAI";
import { CONTRACT_ADDRESSES } from "@/config/contracts";
import { ABIS } from "@/config/abis";
import GlowButton from "@/components/ui/glow-button";

interface SmartContractAIIntegrationProps {
  className?: string;
}

export function SmartContractAIIntegration({
  className = "",
}: SmartContractAIIntegrationProps) {
  const { address, isConnected } = useAccount();
  const { data: feeRec, isLoading: aiLoading } = useFeeRecommendation();
  const { formatFee, formatConfidence } = useAIFormatters();
  
  const [isCreatingProposal, setIsCreatingProposal] = useState(false);
  const [userVotingPower, setUserVotingPower] = useState(0);

  // Read current pool fee
  const { data: currentPoolFee } = useReadContract({
    address: CONTRACT_ADDRESSES.LiquidityPool,
    abi: ABIS.LiquidityPool,
    functionName: "fee",
  });

  // Read user's governance token balance
  const { data: userBalance } = useReadContract({
    address: CONTRACT_ADDRESSES.AuraGovernanceToken,
    abi: ABIS.AuraGovernanceToken,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  // Read user's voting power
  const { data: votingPower } = useReadContract({
    address: CONTRACT_ADDRESSES.AuraGovernanceToken,
    abi: ABIS.AuraGovernanceToken,
    functionName: "getVotes",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  // Read proposal count
  const { data: proposalCount } = useReadContract({
    address: CONTRACT_ADDRESSES.Governance,
    abi: ABIS.Governance,
    functionName: "proposalCount",
  });

  // Contract write for creating proposal
  const {
    data: createProposalData,
    writeContract: createProposal,
    isPending: isWriteLoading,
  } = useWriteContract();

  // Wait for transaction confirmation
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash: createProposalData,
  });

  useEffect(() => {
    if (votingPower && typeof votingPower === 'bigint') {
      setUserVotingPower(Number(formatEther(votingPower)));
    }
  }, [votingPower]);

  useEffect(() => {
    if (isSuccess) {
      setIsCreatingProposal(false);
      // Could trigger a success notification here
    }
  }, [isSuccess]);

  const handleCreateAIProposal = async () => {
    if (!feeRec || !address || !createProposal) return;

    setIsCreatingProposal(true);

    try {
      // Convert AI recommendation to basis points (contract expects uint)
      const feeInBasisPoints = Math.round(feeRec.recommended_fee * 10000);
      
      // Create description with AI reasoning
      const description = `AI-Recommended Fee Adjustment: ${feeRec.recommended_fee.toFixed(4)}% (${feeInBasisPoints} basis points). 

AI Analysis: ${feeRec.reasoning}

Model: ${feeRec.primary_model}
Confidence: ${(feeRec.confidence * 100).toFixed(1)}%
Market Condition: ${feeRec.market_condition}
Timestamp: ${new Date(feeRec.prediction_timestamp).toISOString()}

Data Sources: Enhanced CoinGecko integration with real-time market analysis, volatility assessment, and cross-asset correlation analysis.`;

      // Call the contract
      // @ts-expect-error - Wagmi/Viem version compatibility issue
      createProposal({
        address: CONTRACT_ADDRESSES.Governance,
        abi: ABIS.Governance,
        functionName: "createProposal",
        args: [description, BigInt(feeInBasisPoints)],
      });

    } catch (error) {
      console.error("Error creating AI proposal:", error);
      setIsCreatingProposal(false);
    }
  };

  if (!isConnected) {
    return (
      <motion.div
        className={`bg-white/10 backdrop-blur-md border border-orange-300/40 rounded-2xl p-6 ${className}`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <span className="text-2xl">🤖</span>
          Smart Contract AI Integration
        </h3>
        <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4">
          <div className="text-orange-300 text-sm">
            Connect your wallet to interact with smart contracts and create AI-powered governance proposals.
          </div>
        </div>
      </motion.div>
    );
  }

  if (aiLoading) {
    return (
      <motion.div
        className={`bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 ${className}`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h3 className="text-xl font-semibold text-white mb-4 animate-pulse flex items-center gap-2">
          <span className="text-2xl">🤖</span>
          Smart Contract AI Integration
        </h3>
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-white/10 rounded"></div>
          <div className="h-8 bg-white/5 rounded"></div>
          <div className="h-10 bg-white/10 rounded"></div>
        </div>
      </motion.div>
    );
  }

  if (!feeRec) {
    return (
      <motion.div
        className={`bg-white/10 backdrop-blur-md border border-red-300/40 rounded-2xl p-6 ${className}`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <span className="text-2xl">🤖</span>
          Smart Contract AI Integration
        </h3>
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
          <div className="text-red-300 text-sm">
            AI recommendation service unavailable. Cannot create governance proposals.
          </div>
        </div>
      </motion.div>
    );
  }

  // Calculate values
  const feeInBasisPoints = Math.round(feeRec.recommended_fee * 10000);
  const currentFeeNum = currentPoolFee ? Number(currentPoolFee) : 30;
  const feeDifference = Math.abs(feeInBasisPoints - currentFeeNum);
  const shouldPropose = feeDifference >= 5; // Propose if difference is 5+ basis points

  // Check if user can create proposals (need 1000+ AGOV)
  const minBalanceForProposal = parseEther("1000");
  const canCreateProposal = userBalance && typeof userBalance === 'bigint' && userBalance >= minBalanceForProposal;

  const isProcessing = isCreatingProposal || isWriteLoading || isConfirming;

  return (
    <motion.div
      className={`bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 hover:bg-white/15 transition-all duration-300 ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ scale: 1.01 }}
    >
      <motion.h3
        className="text-xl font-semibold text-white mb-6 flex items-center gap-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.3 }}
      >
        <span className="text-2xl">🤖</span>
        Smart Contract AI Integration
      </motion.h3>

      <div className="space-y-6">
        {/* AI Recommendation Card */}
        <motion.div
          className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-xl p-4"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.3 }}
        >
          <div className="flex justify-between items-center mb-3">
            <span className="text-blue-200 text-sm font-medium">🧠 AI Analysis Result</span>
            <span
              className={`text-xs px-3 py-1 rounded-full font-medium ${
                feeRec.confidence > 0.8
                  ? "bg-green-500/20 text-green-300 border border-green-500/30"
                  : feeRec.confidence > 0.6
                  ? "bg-yellow-500/20 text-yellow-300 border border-yellow-500/30"
                  : "bg-orange-500/20 text-orange-300 border border-orange-500/30"
              }`}
            >
              {formatConfidence(feeRec.confidence)} Confidence
            </span>
          </div>
          <div className="text-3xl font-bold text-white mb-2">
            {formatFee(feeRec.recommended_fee)}
          </div>
          <div className="text-sm text-blue-200 mb-3">
            {feeInBasisPoints} basis points • Model: {feeRec.primary_model?.replace("_", " ").toUpperCase()}
          </div>
          <div className="text-xs text-blue-100 bg-white/5 rounded-lg p-3">
            <strong>Market Analysis:</strong> {feeRec.reasoning}
          </div>
        </motion.div>

        {/* Contract Status */}
        <motion.div
          className="bg-white/5 rounded-xl p-4"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3, duration: 0.3 }}
        >
          <div className="flex justify-between items-center mb-3">
            <span className="text-gray-300 text-sm font-medium">📊 Contract Status</span>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-xs text-green-400">Live</span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-gray-400 text-xs mb-1">Current Pool Fee</div>
              <div className="text-white font-medium">{currentFeeNum / 100}% ({currentFeeNum} bps)</div>
            </div>
            <div>
              <div className="text-gray-400 text-xs mb-1">AI Recommended</div>
              <div className="text-white font-medium">{formatFee(feeRec.recommended_fee)} ({feeInBasisPoints} bps)</div>
            </div>
            <div>
              <div className="text-gray-400 text-xs mb-1">Your Voting Power</div>
              <div className="text-white font-medium">{userVotingPower.toFixed(2)} AGOV</div>
            </div>
            <div>
              <div className="text-gray-400 text-xs mb-1">Total Proposals</div>
              <div className="text-white font-medium">#{proposalCount ? Number(proposalCount) : 0}</div>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-white/10">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Fee Difference:</span>
              <span className={`font-medium ${feeDifference >= 5 ? "text-yellow-400" : "text-green-400"}`}>
                {feeDifference >= 5 ? `±${feeDifference} basis points` : "Within tolerance"}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Governance Action */}
        <motion.div
          className="border-t border-white/10 pt-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.3 }}
        >
          {!canCreateProposal ? (
            <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-orange-400 text-sm">⚠️ Insufficient governance tokens</span>
              </div>
              <div className="text-orange-200 text-xs mb-3">
                You need at least 1,000 AGOV tokens to create governance proposals.
                Current balance: {userBalance && typeof userBalance === 'bigint' ? formatEther(userBalance) : "0"} AGOV
              </div>
            </div>
          ) : shouldPropose ? (
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-yellow-500/10 to-red-500/10 border border-yellow-500/30 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-yellow-400 text-sm font-medium">
                    ⚡ Significant deviation detected
                  </span>
                </div>
                <div className="text-yellow-200 text-sm mb-3">
                  AI recommends a fee change of <strong>{feeDifference} basis points</strong> from current settings.
                  Market conditions suggest this adjustment would optimize trading efficiency.
                </div>
                <div className="text-xs text-yellow-300 bg-yellow-500/5 rounded p-2">
                  Creating this proposal will submit it to the DAO for community voting (7-day voting period).
                </div>
              </div>

              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <GlowButton
                  variant="red"
                  className="w-full py-4 px-6 flex items-center justify-center gap-3 font-medium"
                  onClick={handleCreateAIProposal}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <motion.div
                        className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      />
                      {isWriteLoading ? "Confirming..." : isConfirming ? "Processing..." : "Creating..."}
                    </>
                  ) : (
                    <>
                      <span className="text-lg">🚀</span>
                      Create AI Governance Proposal
                    </>
                  )}
                </GlowButton>
              </motion.div>

              {isSuccess && (
                <motion.div
                  className="bg-green-500/10 border border-green-500/20 rounded-lg p-3"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="text-green-400 text-sm font-medium">✅ Proposal created successfully!</div>
                  <div className="text-green-200 text-xs mt-1">
                    Your AI-powered governance proposal has been submitted to the DAO.
                  </div>
                </motion.div>
              )}
            </div>
          ) : (
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-green-400 text-sm font-medium">✅ Optimal fee detected</span>
              </div>
              <div className="text-green-200 text-xs">
                Current pool fee aligns well with AI recommendation. No governance action needed at this time.
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Footer */}
      <motion.div
        className="mt-6 pt-4 border-t border-white/5 flex justify-between items-center text-xs text-gray-500"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.3 }}
      >
        <span>
          Last AI Analysis: {new Date(feeRec.prediction_timestamp).toLocaleTimeString()}
        </span>
        <div className="flex items-center gap-2">
          <motion.div
            className="w-1 h-1 bg-blue-400 rounded-full"
            animate={{ scale: [1, 1.5, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <span>Smart Contract Integration Active</span>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default SmartContractAIIntegration;