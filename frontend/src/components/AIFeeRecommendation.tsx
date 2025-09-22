/**
 * AI Fee Recommendation Widget
 * Displays real-time AI-powered fee recommendations with explanations
 */

"use client";

import React from "react";
import { motion } from "motion/react";
import {
  useFeeRecommendation,
  useAIFormatters,
  useAIStatus,
} from "@/hooks/useAI";

interface AIFeeRecommendationProps {
  className?: string;
  showDetails?: boolean;
  refreshInterval?: number;
}

export function AIFeeRecommendation({
  className = "",
  showDetails = true,
  refreshInterval = 15000,
}: AIFeeRecommendationProps) {
  const {
    data: feeRec,
    isLoading,
    error,
    refetch,
  } = useFeeRecommendation({
    refreshInterval,
    useProduction: true,
  });
  const { formatFee, formatConfidence, getMarketConditionColor } =
    useAIFormatters();
  const { isOnline } = useAIStatus();

  // Loading state
  if (isLoading) {
    return (
      <motion.div
        className={`bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4 ${className}`}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center gap-2 mb-2">
          <motion.div
            className="w-2 h-2 bg-blue-400 rounded-full"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
          <span className="text-blue-300 text-sm font-medium">
            AI Computing Fee...
          </span>
        </div>
        <div className="text-white text-lg font-semibold animate-pulse">
          Calculating...
        </div>
        <div className="text-gray-300 text-xs animate-pulse">
          Analyzing market conditions...
        </div>
      </motion.div>
    );
  }

  // Error state
  if (error || !isOnline) {
    return (
      <motion.div
        className={`bg-white/10 backdrop-blur-md border border-red-300/40 rounded-xl p-4 ${className}`}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center gap-2 mb-2">
          <div className="w-2 h-2 bg-red-400 rounded-full" />
          <span className="text-red-300 text-sm font-medium">
            AI Service Unavailable
          </span>
        </div>
        <div className="text-white text-lg font-semibold">0.30% (Fallback)</div>
        <div className="text-gray-300 text-xs">Using default fee rate</div>
        <motion.button
          onClick={() => refetch()}
          className="mt-2 text-xs text-blue-400 hover:text-blue-300 transition-colors"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Retry Connection
        </motion.button>
      </motion.div>
    );
  }

  // Success state with AI recommendation
  if (!feeRec) {
    return null;
  }

  const modelBadgeColor =
    feeRec.primary_model === "neural_network"
      ? "bg-purple-500/20 text-purple-300"
      : feeRec.primary_model === "random_forest"
      ? "bg-green-500/20 text-green-300"
      : "bg-blue-500/20 text-blue-300";

  return (
    <motion.div
      className={`bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4 hover:bg-white/15 transition-all duration-300 ${className}`}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      whileHover={{ scale: 1.02 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <motion.div
            className="w-2 h-2 bg-emerald-400 rounded-full"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <span className="text-emerald-300 text-sm font-medium">
            AI-Optimized Fee
          </span>
        </div>
        <div className="flex items-center gap-2">
          {showDetails && (
            <span
              className={`text-xs px-2 py-1 rounded-full ${modelBadgeColor}`}
            >
              {feeRec.primary_model?.replace("_", " ").toUpperCase() || "AI"}
            </span>
          )}
          {/* <span className={`text-xs ${confidenceColor}`}>
            {formatConfidence(feeRec.confidence)}
          </span> */}
        </div>
      </div>

      {/* Main Fee Display */}
      <motion.div
        className="text-white text-2xl font-bold mb-1"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.3 }}
        key={feeRec.recommended_fee} // Re-animate when fee changes
      >
        {formatFee(feeRec.recommended_fee)}
      </motion.div>

      {/* Market Condition */}
      <div className="flex items-center gap-2 mb-2">
        <span className="text-gray-400 text-xs">Market:</span>
        <span
          className={`text-xs font-medium ${getMarketConditionColor(
            feeRec.market_condition
          )}`}
        >
          {feeRec.market_condition.replace("_", " ").toUpperCase()}
        </span>
      </div>

      {/* Reasoning */}
      <motion.div
        className="text-gray-300 text-xs leading-relaxed"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.3 }}
      >
        {feeRec.reasoning}
      </motion.div>

      {/* Additional Details */}
      {showDetails && feeRec.all_predictions && (
        <motion.div
          className="mt-3 pt-3 border-t border-white/10"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          transition={{ delay: 0.6, duration: 0.3 }}
        >
          <div className="text-xs text-gray-400 mb-2">Model Consensus:</div>
          <div className="space-y-1">
            {Object.entries(feeRec.all_predictions).map(
              ([model, prediction]) => {
                const confidence = feeRec.model_confidences?.[model] || 0;
                return (
                  <div
                    key={model}
                    className="flex justify-between items-center text-xs"
                  >
                    <span className="text-gray-300 capitalize">
                      {model.replace("_", " ")}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-white">
                        {formatFee(prediction as number)}
                      </span>
                      <span
                        className={
                          confidence > 0.8
                            ? "text-green-400"
                            : confidence > 0.6
                            ? "text-yellow-400"
                            : "text-orange-400"
                        }
                      >
                        {formatConfidence(confidence)}
                      </span>
                    </div>
                  </div>
                );
              }
            )}
          </div>
        </motion.div>
      )}

      {/* Last Updated */}
      <motion.div
        className="mt-2 pt-2 border-t border-white/10 flex justify-between items-center text-xs text-gray-500"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.3 }}
      >
        {/* <span>
          Updated: {new Date(feeRec.prediction_timestamp).toLocaleTimeString()}
        </span> */}
        {/* <motion.button
          onClick={() => refetch()}
          className="text-blue-400 hover:text-blue-300 transition-colors"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          title="Refresh recommendation"
        >
          🔄
        </motion.button> */}
      </motion.div>
    </motion.div>
  );
}

export default AIFeeRecommendation;
