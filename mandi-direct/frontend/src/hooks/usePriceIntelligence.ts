import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient as axiosInstance } from "@/lib/axios";
import {
  CSVImportResponse,
  PriceHistoryResponse,
  PriceIntelligenceSummary,
  PriceObservation,
  PriceObservationCreateInput,
  PriceObservationListResponse,
  PriceObservationUpdateInput,
  PriceRecommendationRequest,
  PriceRecommendationResponse,
  RegionalPriceResponse,
} from "@/types/priceIntelligence";

export const PRICE_INTELLIGENCE_KEYS = {
  all: ["price-intelligence"] as const,
  summary: (product: string, variety?: string, quality?: string) =>
    [...PRICE_INTELLIGENCE_KEYS.all, "summary", product, variety, quality] as const,
  history: (product: string, variety?: string, quality?: string, daysBack?: number) =>
    [...PRICE_INTELLIGENCE_KEYS.all, "history", product, variety, quality, daysBack] as const,
  regional: (product: string, variety?: string, quality?: string, district?: string, state?: string) =>
    [...PRICE_INTELLIGENCE_KEYS.all, "regional", product, variety, quality, district, state] as const,
  adminList: (params: Record<string, any>) =>
    [...PRICE_INTELLIGENCE_KEYS.all, "admin", "list", params] as const,
};

// --- Farmer & Marketplace Public Hooks ---

export function usePriceIntelligenceSummary(
  productName: string,
  variety?: string,
  qualityGrade?: string,
  options?: { enabled?: boolean }
) {
  return useQuery<PriceIntelligenceSummary>({
    queryKey: PRICE_INTELLIGENCE_KEYS.summary(productName, variety, qualityGrade),
    queryFn: async () => {
      const response = await axiosInstance.get<PriceIntelligenceSummary>("/api/v1/price-intelligence/summary", {
        params: { product_name: productName, variety, quality_grade: qualityGrade },
      });
      return response.data;
    },
    enabled: options?.enabled !== false && Boolean(productName && productName.trim().length >= 2),
    staleTime: 1000 * 60 * 5, // 5 minutes cache
  });
}

export function usePriceHistory(
  productName: string,
  variety?: string,
  qualityGrade?: string,
  daysBack: number = 30,
  options?: { enabled?: boolean }
) {
  return useQuery<PriceHistoryResponse>({
    queryKey: PRICE_INTELLIGENCE_KEYS.history(productName, variety, qualityGrade, daysBack),
    queryFn: async () => {
      const response = await axiosInstance.get<PriceHistoryResponse>("/api/v1/price-intelligence/history", {
        params: { product_name: productName, variety, quality_grade: qualityGrade, days_back: daysBack },
      });
      return response.data;
    },
    enabled: options?.enabled !== false && Boolean(productName && productName.trim().length >= 2),
    staleTime: 1000 * 60 * 5,
  });
}

export function useRegionalPrices(
  productName: string,
  variety?: string,
  qualityGrade?: string,
  district?: string,
  state?: string,
  options?: { enabled?: boolean }
) {
  return useQuery<RegionalPriceResponse>({
    queryKey: PRICE_INTELLIGENCE_KEYS.regional(productName, variety, qualityGrade, district, state),
    queryFn: async () => {
      const response = await axiosInstance.get<RegionalPriceResponse>("/api/v1/price-intelligence/regional", {
        params: { product_name: productName, variety, quality_grade: qualityGrade, district, state },
      });
      return response.data;
    },
    enabled: options?.enabled !== false && Boolean(productName && productName.trim().length >= 2),
    staleTime: 1000 * 60 * 5,
  });
}

export function usePriceRecommendation() {
  return useMutation<PriceRecommendationResponse, Error, PriceRecommendationRequest>({
    mutationFn: async (payload) => {
      const response = await axiosInstance.post<PriceRecommendationResponse>(
        "/api/v1/price-intelligence/recommendation",
        payload
      );
      return response.data;
    },
  });
}

// --- Admin Management Hooks ---

export function useAdminPriceObservations(params: {
  product_name?: string;
  category?: string;
  source_type?: string;
  state?: string;
  district?: string;
  search?: string;
  page?: number;
  size?: number;
}) {
  return useQuery<PriceObservationListResponse>({
    queryKey: PRICE_INTELLIGENCE_KEYS.adminList(params),
    queryFn: async () => {
      const response = await axiosInstance.get<PriceObservationListResponse>("/api/v1/admin/price-observations", {
        params,
      });
      return response.data;
    },
  });
}

export function useCreatePriceObservation() {
  const queryClient = useQueryClient();
  return useMutation<PriceObservation, Error, PriceObservationCreateInput>({
    mutationFn: async (payload) => {
      const response = await axiosInstance.post<PriceObservation>("/api/v1/admin/price-observations", payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PRICE_INTELLIGENCE_KEYS.all });
    },
  });
}

export function useUpdatePriceObservation() {
  const queryClient = useQueryClient();
  return useMutation<PriceObservation, Error, { id: string; data: PriceObservationUpdateInput }>({
    mutationFn: async ({ id, data }) => {
      const response = await axiosInstance.patch<PriceObservation>(`/api/v1/admin/price-observations/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PRICE_INTELLIGENCE_KEYS.all });
    },
  });
}

export function useDeletePriceObservation() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (id) => {
      await axiosInstance.delete(`/api/v1/admin/price-observations/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PRICE_INTELLIGENCE_KEYS.all });
    },
  });
}

export function useImportPriceObservations() {
  const queryClient = useQueryClient();
  return useMutation<CSVImportResponse, Error, File>({
    mutationFn: async (file) => {
      const formData = new FormData();
      formData.append("file", file);
      const response = await axiosInstance.post<CSVImportResponse>(
        "/api/v1/admin/price-observations/import",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PRICE_INTELLIGENCE_KEYS.all });
    },
  });
}
