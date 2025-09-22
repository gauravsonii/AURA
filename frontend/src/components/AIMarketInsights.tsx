/**
 * AI Market Insights Component
 * Displays real-time market analysis and AI insights
 */

"use client";

import React from "react";
import { motion } from "motion/react";
import { useMarketData, useVolatility, useAIFormatters } from "@/hooks/useAI";

interface AIMarketInsightsProps {
  className?: string;
  refreshInterval?: number;
}

export function AIMarketInsights({
  className = "",
  refreshInterval = 30000,
}: AIMarketInsightsProps) {
  const {
    data: marketData,
    isLoading: isMarketLoading,
    error: marketError,
  } = useMarketData({ refreshInterval });
  const { data: volatilityData, isLoading: isVolatilityLoading } =
    useVolatility(refreshInterval);
  const { getMarketConditionColor } = useAIFormatters();

  const isLoading = isMarketLoading || isVolatilityLoading;

  if (isLoading) {
    return (
      <motion.div
        className={`bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 ${className}`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h3 className="text-xl font-semibold text-white mb-4 animate-pulse">
          AI Market Insights
        </h3>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-white/10 rounded mb-2"></div>
              <div className="h-6 bg-white/5 rounded"></div>
            </div>
          ))}
        </div>
      </motion.div>
    );
  }

  if (marketError) {
    return (
      <motion.div
        className={`bg-white/10 backdrop-blur-md border border-red-300/40 rounded-2xl p-6 ${className}`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h3 className="text-xl font-semibold text-white mb-4">
          AI Market Insights
        </h3>
        <div className="text-red-300 text-sm">
          Unable to fetch market data. Please check AI service connection.
        </div>
      </motion.div>
    );
  }

  const formatCurrency = (value: number | null) => {
    if (value === null) return "N/A";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 4,
    }).format(value);
  };

  const formatVolume = (value: number | null) => {
    if (value === null) return "N/A";
    if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
    if (value >= 1e3) return `$${(value / 1e3).toFixed(2)}K`;
    return `$${value.toFixed(2)}`;
  };

  const formatPercentage = (value: number | null) => {
    if (value === null) return "N/A";
    const sign = value >= 0 ? "+" : "";
    return `${sign}${value.toFixed(2)}%`;
  };

  const getVolatilityColor = (volatility: number | null) => {
    if (volatility === null) return "text-gray-400";
    if (volatility > 10) return "text-red-400";
    if (volatility > 5) return "text-orange-400";
    if (volatility > 2) return "text-yellow-400";
    return "text-green-400";
  };

  const getVolatilityLabel = (volatility: number | null) => {
    if (volatility === null) return "Unknown";
    if (volatility > 10) return "Extreme";
    if (volatility > 5) return "High";
    if (volatility > 2) return "Moderate";
    return "Low";
  };

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
        <motion.span
          className="text-2xl"
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
        >
          🧠
        </motion.span>
        AI Market Insights
      </motion.h3>

      <div className="space-y-6">
        {/* AVAX Price */}
        <motion.div
          className="bg-white/5 rounded-xl p-4"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.3 }}
        >
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-300 text-sm">AVAX Price</span>
            <motion.div
              className="w-2 h-2 bg-blue-400 rounded-full"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </div>
          <div className="text-2xl font-bold text-white">
            {formatCurrency(marketData?.price_usd || null)}
          </div>
          <div className="text-xs text-gray-400 mt-1">
            Live from AI analysis
          </div>
        </motion.div>

        {/* Market Volatility */}
        <motion.div
          className="bg-white/5 rounded-xl p-4"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3, duration: 0.3 }}
        >
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-300 text-sm">Market Volatility</span>
            <span
              className={`text-xs px-2 py-1 rounded-full ${getVolatilityColor(
                marketData?.volatility || null
              )}`}
            >
              {getVolatilityLabel(marketData?.volatility || null)}
            </span>
          </div>
          <div
            className={`text-2xl font-bold ${getVolatilityColor(
              marketData?.volatility || null
            )}`}
          >
            {formatPercentage(marketData?.volatility || null)}
          </div>
          <div className="text-xs text-gray-400 mt-1">
            24h volatility measurement
          </div>
        </motion.div>

        {/* Trading Volume */}
        <motion.div
          className="bg-white/5 rounded-xl p-4"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4, duration: 0.3 }}
        >
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-300 text-sm">24h Volume</span>
            <motion.div
              className="flex items-center gap-1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.3 }}
            >
              <div className="w-1 h-1 bg-green-400 rounded-full"></div>
              <div className="w-1 h-1 bg-green-400 rounded-full"></div>
              <div className="w-1 h-1 bg-green-400 rounded-full"></div>
            </motion.div>
          </div>
          <div className="text-2xl font-bold text-white">
            {formatVolume(marketData?.volume_24h || null)}
          </div>
          <div className="text-xs text-gray-400 mt-1">
            Trading activity level
          </div>
        </motion.div>

        {/* Market Condition */}
        <motion.div
          className="bg-white/5 rounded-xl p-4"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5, duration: 0.3 }}
        >
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-300 text-sm">Market Condition</span>
            <motion.div
              className="w-2 h-2 bg-emerald-400 rounded-full"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
          </div>
          <div
            className={`text-lg font-bold ${getMarketConditionColor(
              marketData?.market_condition || "unknown"
            )}`}
          >
            {(marketData?.market_condition || "UNKNOWN")
              .replace("_", " ")
              .toUpperCase()}
          </div>
          <div className="text-xs text-gray-400 mt-1">
            AI-determined market state
          </div>
        </motion.div>

        {/* Network Status */}
        {volatilityData && (
          <motion.div
            className="bg-white/5 rounded-xl p-4"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6, duration: 0.3 }}
          >
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-300 text-sm">Network Status</span>
              <span
                className={`text-xs px-2 py-1 rounded-full ${
                  volatilityData.status === "normal"
                    ? "bg-green-500/20 text-green-300"
                    : "bg-yellow-500/20 text-yellow-300"
                }`}
              >
                {volatilityData.status.toUpperCase()}
              </span>
            </div>
            <div className="text-lg font-bold text-white">
              {volatilityData.status === "normal"
                ? "Optimal"
                : "Elevated Activity"}
            </div>
            <div className="text-xs text-gray-400 mt-1">
              Threshold: {formatPercentage(volatilityData.threshold)}
            </div>
          </motion.div>
        )}
      </div>

      {/* Last Updated */}
      <motion.div
        className="mt-6 pt-4 border-t border-white/10 flex justify-between items-center text-xs text-gray-500"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.3 }}
      >
        <span>
          Last updated:{" "}
          {marketData
            ? new Date(marketData.timestamp).toLocaleTimeString()
            : "N/A"}
        </span>
        <div className="flex items-center gap-1">
          <motion.div
            className="w-1 h-1 bg-emerald-400 rounded-full"
            animate={{ scale: [1, 1.5, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
          />
          <span>Live AI Analysis</span>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default AIMarketInsights;
