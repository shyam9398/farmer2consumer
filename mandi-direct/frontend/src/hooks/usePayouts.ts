import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/axios";
import {
  AdminPayoutUpdateRequest,
  FarmerPayout,
  FarmerPayoutListResponse,
  PayoutRequestCreate,
} from "@/types/payout";

export function useFarmerPayouts(params: { page?: number; page_size?: number; status?: string } = {}) {
  return useQuery<FarmerPayoutListResponse>({
    queryKey: ["farmerPayouts", params],
    queryFn: async () => {
      const response = await apiClient.get<FarmerPayoutListResponse>("/farmer/payouts", { params });
      return response.data;
    },
  });
}

export function useRequestPayout() {
  const queryClient = useQueryClient();
  return useMutation<FarmerPayout, Error, PayoutRequestCreate>({
    mutationFn: async (payload) => {
      const response = await apiClient.post<FarmerPayout>("/farmer/payouts/request", payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["farmerEarningsSummary"] });
      queryClient.invalidateQueries({ queryKey: ["farmerEarnings"] });
      queryClient.invalidateQueries({ queryKey: ["farmerPayouts"] });
    },
  });
}

export function useAdminPayouts(params: { page?: number; page_size?: number; status?: string; farmer_profile_id?: string } = {}) {
  return useQuery<FarmerPayoutListResponse>({
    queryKey: ["adminPayouts", params],
    queryFn: async () => {
      const response = await apiClient.get<FarmerPayoutListResponse>("/admin/payouts", { params });
      return response.data;
    },
  });
}

export function useUpdatePayoutStatus() {
  const queryClient = useQueryClient();
  return useMutation<FarmerPayout, Error, { payoutId: string; payload: AdminPayoutUpdateRequest }>({
    mutationFn: async ({ payoutId, payload }) => {
      const response = await apiClient.patch<FarmerPayout>(`/admin/payouts/${payoutId}`, payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminPayouts"] });
      queryClient.invalidateQueries({ queryKey: ["farmerEarningsSummary"] });
      queryClient.invalidateQueries({ queryKey: ["farmerPayouts"] });
      queryClient.invalidateQueries({ queryKey: ["farmerEarnings"] });
    },
  });
}
