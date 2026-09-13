import { useQuery } from "@tanstack/react-query";
import { apiClient as axiosClient } from "./axios";

export type DemandLevel =
  | "VERY_LOW"
  | "LOW"
  | "MODERATE"
  | "HIGH"
  | "VERY_HIGH"
  | "INSUFFICIENT_DATA";

export type DemandTrend =
  | "RISING"
  | "FALLING"
  | "STABLE"
  | "VOLATILE"
  | "INSUFFICIENT_DATA";

export type SupplyDemandStatus =
  | "LOW_DEMAND"
  | "BALANCED"
  | "HIGH_DEMAND"
  | "SUPPLY_SHORTAGE"
  | "INSUFFICIENT_DATA";

export type ConfidenceLevel = "LOW" | "MEDIUM" | "HIGH";

export interface ProductDemand {
  product_name: string;
  category: string;
  demand_score: number;
  demand_level: DemandLevel;
  trend: DemandTrend;
  recent_quantity_sold: number;
  quantity_unit: string;
  order_count: number;
  unique_buyers: number;
  sales_velocity_per_day: number;
  demand_growth_percentage: number | null;
  available_supply: number;
  supply_demand_status: SupplyDemandStatus;
  confidence: ConfidenceLevel;
  explanation: string;
  matching_scope: string;
  period_days: number;
  generated_at: string;
}

export interface DemandSummary {
  period_days: number;
  total_orders: number;
  total_quantity_sold: number;
  total_unique_buyers: number;
  top_demanded_products: ProductDemand[];
  generated_at: string;
}

export interface DemandHistoryPoint {
  date: string;
  order_count: number;
  quantity_sold: number;
  unique_buyers: number;
  sales_velocity: number;
  demand_score: number;
  trend: DemandTrend;
}

export interface DemandHistoryResponse {
  product_name: string | null;
  period_days: number;
  points: DemandHistoryPoint[];
  generated_at: string;
}

export interface RegionalDemandItem {
  state: string;
  district: string | null;
  product_name: string | null;
  order_count: number;
  quantity_sold: number;
  unique_buyers: number;
  demand_level: DemandLevel;
  demand_score: number;
}

export interface RegionalDemandResponse {
  period_days: number;
  regions: RegionalDemandItem[];
  generated_at: string;
}

export interface DemandRecommendationItem {
  product_name: string;
  category: string;
  demand_score: number;
  demand_level: DemandLevel;
  trend: DemandTrend;
  available_supply: number;
  recommendation_reason: string;
}

export interface DemandRecommendationsResponse {
  period_days: number;
  recommendations: DemandRecommendationItem[];
  generated_at: string;
}

export interface PriceDemandCombinedInsight {
  product_name: string;
  reference_price: number | null;
  target_price: number | null;
  price_trend: string | null;
  demand_score: number;
  demand_level: DemandLevel;
  demand_trend: DemandTrend;
  supply_demand_status: SupplyDemandStatus;
  combined_insight: string;
  generated_at: string;
}

// API Calls
export const demandApi = {
  getSummary: async (periodDays: number = 30, limit: number = 10): Promise<DemandSummary> => {
    const res = await axiosClient.get(`/api/v1/demand-intelligence/summary`, {
      params: { period_days: periodDays, limit },
    });
    return res.data;
  },

  getProductDemand: async (productName: string, periodDays: number = 30): Promise<ProductDemand> => {
    const res = await axiosClient.get(
      `/api/v1/demand-intelligence/products/${encodeURIComponent(productName)}`,
      { params: { period_days: periodDays } }
    );
    return res.data;
  },

  getHistory: async (productName?: string, periodDays: number = 30): Promise<DemandHistoryResponse> => {
    const res = await axiosClient.get(`/api/v1/demand-intelligence/history`, {
      params: { product_name: productName, period_days: periodDays },
    });
    return res.data;
  },

  getRegional: async (productName?: string, periodDays: number = 30): Promise<RegionalDemandResponse> => {
    const res = await axiosClient.get(`/api/v1/demand-intelligence/regional`, {
      params: { product_name: productName, period_days: periodDays },
    });
    return res.data;
  },

  getRecommendations: async (periodDays: number = 30, limit: number = 5): Promise<DemandRecommendationsResponse> => {
    const res = await axiosClient.get(`/api/v1/demand-intelligence/recommendations`, {
      params: { period_days: periodDays, limit },
    });
    return res.data;
  },

  getCombinedInsight: async (productName: string, periodDays: number = 30): Promise<PriceDemandCombinedInsight> => {
    const res = await axiosClient.get(
      `/api/v1/demand-intelligence/combined-insight/${encodeURIComponent(productName)}`,
      { params: { period_days: periodDays } }
    );
    return res.data;
  },

  getAdminSummary: async (periodDays: number = 30, limit: number = 20): Promise<DemandSummary> => {
    const res = await axiosClient.get(`/api/v1/admin/demand-intelligence/summary`, {
      params: { period_days: periodDays, limit },
    });
    return res.data;
  },

  getAdminRegional: async (productName?: string, periodDays: number = 30): Promise<RegionalDemandResponse> => {
    const res = await axiosClient.get(`/api/v1/admin/demand-intelligence/regional`, {
      params: { product_name: productName, period_days: periodDays },
    });
    return res.data;
  },
};

// Custom React Query Hooks
export function useDemandSummary(periodDays: number = 30, limit: number = 10) {
  return useQuery({
    queryKey: ["demandSummary", periodDays, limit],
    queryFn: () => demandApi.getSummary(periodDays, limit),
  });
}

export function useProductDemand(productName: string, periodDays: number = 30, enabled: boolean = true) {
  return useQuery({
    queryKey: ["productDemand", productName, periodDays],
    queryFn: () => demandApi.getProductDemand(productName, periodDays),
    enabled: enabled && !!productName,
  });
}

export function useDemandHistory(productName?: string, periodDays: number = 30) {
  return useQuery({
    queryKey: ["demandHistory", productName, periodDays],
    queryFn: () => demandApi.getHistory(productName, periodDays),
  });
}

export function useRegionalDemand(productName?: string, periodDays: number = 30) {
  return useQuery({
    queryKey: ["regionalDemand", productName, periodDays],
    queryFn: () => demandApi.getRegional(productName, periodDays),
  });
}

export function useDemandRecommendations(periodDays: number = 30, limit: number = 5) {
  return useQuery({
    queryKey: ["demandRecommendations", periodDays, limit],
    queryFn: () => demandApi.getRecommendations(periodDays, limit),
  });
}

export function usePriceDemandCombinedInsight(productName: string, periodDays: number = 30, enabled: boolean = true) {
  return useQuery({
    queryKey: ["priceDemandInsight", productName, periodDays],
    queryFn: () => demandApi.getCombinedInsight(productName, periodDays),
    enabled: enabled && !!productName,
  });
}

export function useAdminDemandSummary(periodDays: number = 30, limit: number = 20) {
  return useQuery({
    queryKey: ["adminDemandSummary", periodDays, limit],
    queryFn: () => demandApi.getAdminSummary(periodDays, limit),
  });
}

export function useAdminDemandRegional(productName?: string, periodDays: number = 30) {
  return useQuery({
    queryKey: ["adminDemandRegional", productName, periodDays],
    queryFn: () => demandApi.getAdminRegional(productName, periodDays),
  });
}
