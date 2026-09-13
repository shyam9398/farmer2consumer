import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/axios";
import {
  FarmerEarningDetail,
  FarmerEarningsListResponse,
  FarmerEarningsSummary,
} from "@/types/earnings";

export interface UseFarmerEarningsParams {
  page?: number;
  page_size?: number;
  status?: string;
  date_from?: string;
  date_to?: string;
  product?: string;
}

export function useFarmerEarningsSummary() {
  return useQuery<FarmerEarningsSummary>({
    queryKey: ["farmerEarningsSummary"],
    queryFn: async () => {
      const response = await apiClient.get<FarmerEarningsSummary>("/farmer/earnings/summary");
      return response.data;
    },
  });
}

export function useFarmerEarnings(params: UseFarmerEarningsParams = {}) {
  return useQuery<FarmerEarningsListResponse>({
    queryKey: ["farmerEarnings", params],
    queryFn: async () => {
      const response = await apiClient.get<FarmerEarningsListResponse>("/farmer/earnings", {
        params,
      });
      return response.data;
    },
  });
}

export function useFarmerEarningDetail(earningId: string) {
  return useQuery<FarmerEarningDetail>({
    queryKey: ["farmerEarningDetail", earningId],
    queryFn: async () => {
      const response = await apiClient.get<FarmerEarningDetail>(
        `/farmer/earnings/${earningId}`
      );
      return response.data;
    },
    enabled: Boolean(earningId),
  });
}
