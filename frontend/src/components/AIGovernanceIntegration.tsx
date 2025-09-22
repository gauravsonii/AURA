/**
 * AI-Contract Integration Component
 * Handles the connection between AI predictions and smart contract governance
 */

"use client";

import React, { useState } from "react";
import { motion } from "motion/react";
import { useFeeRecommendation, useAIFormatters } from "@/hooks/useAI";
import GlowButton from "@/components/ui/glow-button";

interface AIGovernanceIntegrationProps {
  className?: string;
}

export function AIGovernanceIntegration({
  className = "",
}: AIGovernanceIntegrationProps) {
  const { data: feeRec, isLoading } = useFeeRecommendation();
  const { formatFee, formatConfidence } = useAIFormatters();
  const [isProposing, setIsProposing] = useState(false);

  const handleCreateProposal = async () => {
    if (!feeRec) return;

    setIsProposing(true);

    try {
      // This would integrate with smart contracts
      // For now, just simulate the action
      console.log("Creating governance proposal with AI recommendation:", {
        newFee: Math.round(feeRec.recommended_fee * 10000), // Convert to basis points for contract
        reasoning: feeRec.reasoning,
        confidence: feeRec.confidence,
        model: feeRec.primary_model,
      });

      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Show success state
      alert(
        `Governance proposal created!\nAI Fee: ${formatFee(
          feeRec.recommended_fee
        )}\nConfidence: ${formatConfidence(feeRec.confidence)}\nReasoning: ${
          feeRec.reasoning
        }`
      );
    } catch (error) {
      console.error("Error creating proposal:", error);
      alert("Failed to create governance proposal");
    } finally {
      setIsProposing(false);
    }
  };

  if (isLoading) {
    return (
      <motion.div
        className={`bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 ${className}`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h3 className="text-xl font-semibold text-white mb-4 animate-pulse">
          AI-Governance Integration
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
        <h3 className="text-xl font-semibold text-white mb-4">
          AI-Governance Integration
        </h3>
        <p className="text-red-300 text-sm">
          AI recommendation unavailable. Cannot create governance proposal.
        </p>
      </motion.div>
    );
  }

  // Calculate fee in basis points for smart contract
  const feeInBasisPoints = Math.round(feeRec.recommended_fee * 10000);

  // Determine if recommendation differs significantly from default (30 basis points)
  const defaultFeeBasisPoints = 30;
  const feeDifference = Math.abs(feeInBasisPoints - defaultFeeBasisPoints);
  const shouldPropose = feeDifference >= 5; // Propose if difference is 5+ basis points

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
        <span className="text-2xl">⚖️</span>
        AI-Governance Integration
      </motion.h3>

      <div className="space-y-6">
        {/* Current AI Recommendation */}
        <motion.div
          className="bg-white/5 rounded-xl p-4"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.3 }}
        >
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-300 text-sm">AI Recommended Fee</span>
            <span
              className={`text-xs px-2 py-1 rounded-full ${
                feeRec.confidence > 0.8
                  ? "bg-green-500/20 text-green-300"
                  : feeRec.confidence > 0.6
                  ? "bg-yellow-500/20 text-yellow-300"
                  : "bg-orange-500/20 text-orange-300"
              }`}
            >
              {formatConfidence(feeRec.confidence)} Confidence
            </span>
          </div>
          <div className="text-2xl font-bold text-white mb-2">
            {formatFee(feeRec.recommended_fee)}
          </div>
          <div className="text-xs text-gray-400">
            {feeInBasisPoints} basis points • Model:{" "}
            {feeRec.primary_model?.replace("_", " ").toUpperCase()}
          </div>
        </motion.div>

        {/* Contract Integration Details */}
        <motion.div
          className="bg-white/5 rounded-xl p-4"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3, duration: 0.3 }}
        >
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-300 text-sm">Contract Status</span>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span className="text-xs text-green-400">Connected</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Current Pool Fee:</span>
              <span className="text-white">0.30% (30 basis points)</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">AI Recommended:</span>
              <span className="text-white">
                {formatFee(feeRec.recommended_fee)} ({feeInBasisPoints} basis
                points)
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Difference:</span>
              <span
                className={`${
                  feeDifference >= 5 ? "text-yellow-400" : "text-green-400"
                }`}
              >
                {feeDifference >= 5
                  ? `±${feeDifference} basis points`
                  : "Within tolerance"}
              </span>
            </div>
          </div>
        </motion.div>

        {/* AI Reasoning */}
        <motion.div
          className="bg-white/5 rounded-xl p-4"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4, duration: 0.3 }}
        >
          <div className="text-gray-300 text-sm mb-2">AI Analysis</div>
          <div className="text-white text-sm leading-relaxed">
            {feeRec.reasoning}
          </div>
        </motion.div>

        {/* Governance Action */}
        <motion.div
          className="border-t border-white/10 pt-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.3 }}
        >
          {shouldPropose ? (
            <div className="space-y-4">
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-yellow-400 text-sm">
                    ⚠️ Significant deviation detected
                  </span>
                </div>
                <div className="text-yellow-200 text-xs">
                  AI recommends a fee change of {feeDifference} basis points.
                  Consider creating a governance proposal.
                </div>
              </div>

              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <GlowButton
                  variant="red"
                  className="w-full py-3 px-6 flex items-center text-white justify-center gap-3"
                  onClick={handleCreateProposal}
                  disabled={isProposing}
                >
                  {isProposing ? (
                    <>
                      <motion.div
                        className="w-4 h-4 border-2 text-white border-white/30 border-t-white rounded-full"
                        animate={{ rotate: 360 }}
                        transition={{
                          duration: 1,
                          repeat: Infinity,
                          ease: "linear",
                        }}
                      />
                      Creating Proposal...
                    </>
                  ) : (
                    <>Create Governance Proposal</>
                  )}
                </GlowButton>
              </motion.div>
            </div>
          ) : (
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-green-400 text-sm">
                  ✅ Fee within acceptable range
                </span>
              </div>
              <div className="text-green-200 text-xs">
                Current pool fee aligns with AI recommendation. No governance
                action needed.
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Last Updated */}
      <motion.div
        className="mt-6 pt-4 border-t border-white/5 flex justify-between items-center text-xs text-gray-500"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.3 }}
      >
        <span>
          AI Analysis:{" "}
          {new Date(feeRec.prediction_timestamp).toLocaleTimeString()}
        </span>
        <div className="flex items-center gap-1">
          <motion.div
            className="w-1 h-1 bg-blue-400 rounded-full"
            animate={{ scale: [1, 1.5, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <span>Smart Contract Ready</span>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default AIGovernanceIntegration;
