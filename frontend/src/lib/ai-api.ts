/**
 * AI API Client for Aura Protocol
 * Handles communication with the AI backend FastAPI server
 */

import { config } from "@/config/env";

// Types for AI API responses
export interface FeeRecommendation {
  recommended_fee: number;
  confidence: number;
  reasoning: string;
  market_condition: string;
  primary_model: string;
  ensemble_prediction?: number;
  all_predictions?: Record<string, number>;
  model_confidences?: Record<string, number>;
  features_used?: number;
  prediction_timestamp: string;
  current_volatility?: number;
}

export interface MarketData {
  price_usd: number | null;
  volatility: number | null;
  volume_24h: number | null;
  market_condition: string;
  timestamp: string;
}

export interface ContractScanResult {
  address: string;
  risk_score: number;
  risk_level: string;
  flags: Array<{
    type: string;
    severity: string;
    message: string;
  }>;
  contract_type: string;
  is_verified: boolean;
  recommendation: string;
  timestamp: string;
}

export interface HealthStatus {
  status: string;
  timestamp: string;
  version: string;
  services: Record<string, string>;
}

export interface ModelInfo {
  is_trained: boolean;
  best_model: string;
  available_models: string[];
  feature_count: number;
  features: string[];
}

export interface VolatilityData {
  volatility: number | null;
  threshold: number;
  status: string;
  timestamp: string;
}

class AuraAIClient {
  private baseUrl: string;
  private cache: Map<string, { data: unknown; expiry: number }> = new Map();
  private readonly cacheTimeout = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.baseUrl = config.ai.apiUrl || "https://aura-production-6374.up.railway.app";
  }

  private getCacheKey(
    endpoint: string,
    params?: Record<string, unknown>
  ): string {
    const paramStr = params ? JSON.stringify(params) : "";
    return `${endpoint}${paramStr}`;
  }

  private getFromCache<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() < cached.expiry) {
      return cached.data as T;
    }
    return null;
  }

  private setCache(key: string, data: unknown): void {
    this.cache.set(key, {
      data,
      expiry: Date.now() + this.cacheTimeout,
    });
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    useCache = true
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const cacheKey = this.getCacheKey(
      endpoint,
      options.body ? JSON.parse(options.body as string) : undefined
    );

    // Check cache first
    if (useCache && options.method !== "POST") {
      const cached = this.getFromCache<T>(cacheKey);
      if (cached) {
        return cached;
      }
    }

    try {
      const response = await fetch(url, {
        headers: {
          "Content-Type": "application/json",
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`AI API Error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();

      // Cache successful responses
      if (useCache && response.status === 200) {
        this.setCache(cacheKey, data);
      }

      return data;
    } catch (error) {
      console.error(`AI API request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  // Health and status endpoints
  async getHealth(): Promise<HealthStatus> {
    return this.request<HealthStatus>("/health");
  }

  async getModelInfo(): Promise<ModelInfo> {
    return this.request<ModelInfo>("/model-info");
  }

  // Market data endpoints
  async getMarketData(forceRefresh = false): Promise<MarketData> {
    return this.request<MarketData>("/market-data", {}, !forceRefresh);
  }

  async getVolatility(): Promise<VolatilityData> {
    return this.request<VolatilityData>("/volatility");
  }

  // AI recommendation endpoints
  async getFeeRecommendation(
    options: {
      forceRefresh?: boolean;
      useProduction?: boolean;
    } = {}
  ): Promise<FeeRecommendation> {
    const { forceRefresh = false, useProduction = true } = options;

    const queryParams = new URLSearchParams({
      force_refresh: forceRefresh.toString(),
      use_production: useProduction.toString(),
    });

    return this.request<FeeRecommendation>(
      `/recommend-fee?${queryParams}`,
      {},
      !forceRefresh
    );
  }

  async getProductionFeeRecommendation(): Promise<FeeRecommendation> {
    return this.request<FeeRecommendation>("/recommend-fee/production");
  }

  async getMarketAnalysis(): Promise<{
    market_data: MarketData;
    fee_recommendation: FeeRecommendation;
    analysis_timestamp: string;
  }> {
    return this.request("/market-analysis");
  }

  // Contract scanning endpoints
  async scanContract(
    address: string,
    quick = false
  ): Promise<ContractScanResult> {
    return this.request<ContractScanResult>(
      "/scan-contract",
      {
        method: "POST",
        body: JSON.stringify({
          address,
          quick,
        }),
      },
      false
    );
  }

  async quickRiskAssessment(address: string): Promise<{
    address: string;
    risk_score: number;
    risk_level: string;
    message: string;
    is_verified?: boolean;
    timestamp: string;
  }> {
    return this.request(`/quick-risk/${address}`);
  }

  // Admin endpoints
  async retrainModels(): Promise<{
    message: string;
    timestamp: string;
    note?: string;
  }> {
    return this.request(
      "/retrain-models",
      {
        method: "POST",
      },
      false
    );
  }

  // Utility methods
  clearCache(): void {
    this.cache.clear();
  }

  getCacheStats(): {
    size: number;
    keys: string[];
  } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }

  // Format fee for display
  formatFee(fee: number): string {
    return `${fee.toFixed(3)}%`;
  }

  // Format confidence for display
  formatConfidence(confidence: number): string {
    return `${(confidence * 100).toFixed(1)}%`;
  }

  // Get risk level color
  getRiskLevelColor(riskLevel: string): string {
    switch (riskLevel.toLowerCase()) {
      case "low":
        return "text-green-400";
      case "medium":
        return "text-yellow-400";
      case "high":
        return "text-orange-400";
      case "critical":
        return "text-red-400";
      default:
        return "text-gray-400";
    }
  }

  // Get market condition color
  getMarketConditionColor(condition: string): string {
    switch (condition.toLowerCase()) {
      case "stable":
      case "stable_liquid":
        return "text-green-400";
      case "moderate":
        return "text-blue-400";
      case "high_volatility":
        return "text-yellow-400";
      case "extreme_volatility":
      case "high_volatility_congested":
        return "text-red-400";
      case "network_congested":
        return "text-orange-400";
      default:
        return "text-gray-400";
    }
  }
}

// Create and export singleton instance
export const aiClient = new AuraAIClient();

// Export default
export default aiClient;
