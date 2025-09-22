/**
 * React hooks for AI features
 * Provides easy-to-use hooks for AI data fetching and state management
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useCallback } from "react";
import {
  aiClient,
} from "@/lib/ai-api";

// Query keys for React Query
export const AI_QUERY_KEYS = {
  health: ["ai", "health"] as const,
  modelInfo: ["ai", "model-info"] as const,
  marketData: ["ai", "market-data"] as const,
  volatility: ["ai", "volatility"] as const,
  feeRecommendation: ["ai", "fee-recommendation"] as const,
  productionFeeRecommendation: ["ai", "production-fee-recommendation"] as const,
  marketAnalysis: ["ai", "market-analysis"] as const,
  contractScan: (address: string) => ["ai", "contract-scan", address] as const,
  quickRisk: (address: string) => ["ai", "quick-risk", address] as const,
} as const;

// Hook for AI backend health status
export function useAIHealth() {
  return useQuery({
    queryKey: AI_QUERY_KEYS.health,
    queryFn: () => aiClient.getHealth(),
    staleTime: 30 * 1000, // 30 seconds
    retry: 3,
  });
}

// Hook for AI model information
export function useAIModelInfo() {
  return useQuery({
    queryKey: AI_QUERY_KEYS.modelInfo,
    queryFn: () => aiClient.getModelInfo(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Hook for market data
export function useMarketData(
  options: {
    refreshInterval?: number;
    forceRefresh?: boolean;
  } = {}
) {
  const { refreshInterval = 30000, forceRefresh = false } = options;

  return useQuery({
    queryKey: AI_QUERY_KEYS.marketData,
    queryFn: () => aiClient.getMarketData(forceRefresh),
    refetchInterval: refreshInterval,
    staleTime: 25 * 1000, // 25 seconds
  });
}

// Hook for volatility data
export function useVolatility(refreshInterval = 60000) {
  return useQuery({
    queryKey: AI_QUERY_KEYS.volatility,
    queryFn: () => aiClient.getVolatility(),
    refetchInterval: refreshInterval,
    staleTime: 55 * 1000, // 55 seconds
  });
}

// Hook for fee recommendation
export function useFeeRecommendation(
  options: {
    refreshInterval?: number;
    useProduction?: boolean;
    enabled?: boolean;
  } = {}
) {
  const {
    refreshInterval = 30000,
    useProduction = true,
    enabled = true,
  } = options;

  return useQuery({
    queryKey: [...AI_QUERY_KEYS.feeRecommendation, { useProduction }],
    queryFn: () => aiClient.getFeeRecommendation({ useProduction }),
    refetchInterval: refreshInterval,
    staleTime: 25 * 1000, // 25 seconds
    enabled,
  });
}

// Hook for production fee recommendation (higher priority)
export function useProductionFeeRecommendation(refreshInterval = 15000) {
  return useQuery({
    queryKey: AI_QUERY_KEYS.productionFeeRecommendation,
    queryFn: () => aiClient.getProductionFeeRecommendation(),
    refetchInterval: refreshInterval,
    staleTime: 10 * 1000, // 10 seconds
  });
}

// Hook for market analysis
export function useMarketAnalysis(refreshInterval = 60000) {
  return useQuery({
    queryKey: AI_QUERY_KEYS.marketAnalysis,
    queryFn: () => aiClient.getMarketAnalysis(),
    refetchInterval: refreshInterval,
    staleTime: 55 * 1000, // 55 seconds
  });
}

// Hook for contract scanning
export function useContractScan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      address,
      quick = false,
    }: {
      address: string;
      quick?: boolean;
    }) => aiClient.scanContract(address, quick),
    onSuccess: (data, variables) => {
      // Cache the result
      queryClient.setQueryData(
        AI_QUERY_KEYS.contractScan(variables.address),
        data
      );
    },
  });
}

// Hook for quick risk assessment
export function useQuickRiskAssessment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (address: string) => aiClient.quickRiskAssessment(address),
    onSuccess: (data, address) => {
      // Cache the result
      queryClient.setQueryData(AI_QUERY_KEYS.quickRisk(address), data);
    },
  });
}

// Hook for manual data refresh
export function useAIRefresh() {
  const queryClient = useQueryClient();

  const refreshAll = useCallback(() => {
    return Promise.all([
      queryClient.invalidateQueries({ queryKey: AI_QUERY_KEYS.marketData }),
      queryClient.invalidateQueries({
        queryKey: AI_QUERY_KEYS.feeRecommendation,
      }),
      queryClient.invalidateQueries({ queryKey: AI_QUERY_KEYS.volatility }),
    ]);
  }, [queryClient]);

  const refreshFeeRecommendation = useCallback(() => {
    return queryClient.invalidateQueries({
      queryKey: AI_QUERY_KEYS.feeRecommendation,
    });
  }, [queryClient]);

  const refreshMarketData = useCallback(() => {
    return queryClient.invalidateQueries({
      queryKey: AI_QUERY_KEYS.marketData,
    });
  }, [queryClient]);

  return {
    refreshAll,
    refreshFeeRecommendation,
    refreshMarketData,
  };
}

// Combined hook for AI-powered DEX data
export function useAIDex(
  options: {
    refreshInterval?: number;
    enabled?: boolean;
  } = {}
) {
  const { refreshInterval = 30000, enabled = true } = options;

  const health = useAIHealth();
  const marketData = useMarketData({ refreshInterval });
  const feeRecommendation = useFeeRecommendation({
    refreshInterval,
    useProduction: true,
    enabled,
  });
  const volatility = useVolatility(refreshInterval * 2);

  const isAIHealthy = health.data?.status === "healthy";
  const isLoading = marketData.isLoading || feeRecommendation.isLoading;
  const hasError = marketData.error || feeRecommendation.error || health.error;

  return {
    // Status
    isAIHealthy,
    isLoading,
    hasError,

    // Data
    health: health.data,
    marketData: marketData.data,
    feeRecommendation: feeRecommendation.data,
    volatility: volatility.data,

    // Loading states
    isMarketDataLoading: marketData.isLoading,
    isFeeRecommendationLoading: feeRecommendation.isLoading,
    isVolatilityLoading: volatility.isLoading,

    // Errors
    marketDataError: marketData.error,
    feeRecommendationError: feeRecommendation.error,
    healthError: health.error,

    // Refresh functions
    refetch: {
      marketData: marketData.refetch,
      feeRecommendation: feeRecommendation.refetch,
      volatility: volatility.refetch,
      health: health.refetch,
    },
  };
}

// Hook for AI status monitoring
export function useAIStatus() {
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const health = useAIHealth();
  const modelInfo = useAIModelInfo();

  const refresh = useCallback(() => {
    setLastUpdate(new Date());
    health.refetch();
    modelInfo.refetch();
  }, [health, modelInfo]);

  return {
    isOnline: health.data?.status === "healthy",
    lastUpdate,
    health: health.data,
    modelInfo: modelInfo.data,
    isLoading: health.isLoading || modelInfo.isLoading,
    error: health.error || modelInfo.error,
    refresh,
  };
}

// Utility hook for formatting AI data
export function useAIFormatters() {
  const formatFee = useCallback((fee: number) => aiClient.formatFee(fee), []);
  const formatConfidence = useCallback(
    (confidence: number) => aiClient.formatConfidence(confidence),
    []
  );
  const getRiskLevelColor = useCallback(
    (riskLevel: string) => aiClient.getRiskLevelColor(riskLevel),
    []
  );
  const getMarketConditionColor = useCallback(
    (condition: string) => aiClient.getMarketConditionColor(condition),
    []
  );

  return {
    formatFee,
    formatConfidence,
    getRiskLevelColor,
    getMarketConditionColor,
  };
}
