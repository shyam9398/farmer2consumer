import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/axios";
import {
  AdminDashboardStats,
  FarmerVerificationDetail,
  FarmerVerificationListResponse,
  ProduceVerificationDetail,
  ProduceVerificationListResponse,
  VerificationDecisionPayload,
  VerificationRecordListResponse,
  VerificationRejectPayload,
} from "@/types/admin";

export const ADMIN_KEYS = {
  stats: ["admin", "stats"] as const,
  farmers: (params?: Record<string, any>) => ["admin", "farmers", params] as const,
  farmerDetail: (id: string) => ["admin", "farmers", "detail", id] as const,
  produce: (params?: Record<string, any>) => ["admin", "produce", params] as const,
  produceDetail: (id: string) => ["admin", "produce", "detail", id] as const,
  history: (params?: Record<string, any>) => ["admin", "history", params] as const,
};

// -----------------------------------------------------------------------------
// Admin Stats Hook
// -----------------------------------------------------------------------------

export const useAdminDashboardStats = () => {
  return useQuery({
    queryKey: ADMIN_KEYS.stats,
    queryFn: async () => {
      const res = await apiClient.get<AdminDashboardStats>("/api/v1/admin/dashboard/stats");
      return res.data;
    },
    refetchInterval: 30000, // Background refresh every 30s
  });
};

// -----------------------------------------------------------------------------
// Farmer Verification Hooks
// -----------------------------------------------------------------------------

export interface FarmerVerificationFilterParams {
  status?: string;
  search?: string;
  page?: number;
  page_size?: number;
}

export const useFarmerVerificationList = (params: FarmerVerificationFilterParams = {}) => {
  return useQuery({
    queryKey: ADMIN_KEYS.farmers(params),
    queryFn: async () => {
      const res = await apiClient.get<FarmerVerificationListResponse>(
        "/api/v1/admin/farmers/verification",
        { params }
      );
      return res.data;
    },
  });
};

export const useFarmerVerificationDetail = (farmerId: string | undefined) => {
  return useQuery({
    queryKey: ADMIN_KEYS.farmerDetail(farmerId || ""),
    queryFn: async () => {
      if (!farmerId) throw new Error("Farmer ID is required");
      const res = await apiClient.get<FarmerVerificationDetail>(
        `/api/v1/admin/farmers/${farmerId}/verification`
      );
      return res.data;
    },
    enabled: !!farmerId,
  });
};

export const useApproveFarmer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      farmerId,
      payload,
    }: {
      farmerId: string;
      payload?: VerificationDecisionPayload;
    }) => {
      const res = await apiClient.post<FarmerVerificationDetail>(
        `/api/v1/admin/farmers/${farmerId}/approve`,
        payload || {}
      );
      return res.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ADMIN_KEYS.stats });
      queryClient.invalidateQueries({ queryKey: ["admin", "farmers"] });
      queryClient.invalidateQueries({
        queryKey: ADMIN_KEYS.farmerDetail(variables.farmerId),
      });
      queryClient.invalidateQueries({ queryKey: ["admin", "history"] });
    },
  });
};

export const useRejectFarmer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      farmerId,
      payload,
    }: {
      farmerId: string;
      payload: VerificationRejectPayload;
    }) => {
      const res = await apiClient.post<FarmerVerificationDetail>(
        `/api/v1/admin/farmers/${farmerId}/reject`,
        payload
      );
      return res.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ADMIN_KEYS.stats });
      queryClient.invalidateQueries({ queryKey: ["admin", "farmers"] });
      queryClient.invalidateQueries({
        queryKey: ADMIN_KEYS.farmerDetail(variables.farmerId),
      });
      queryClient.invalidateQueries({ queryKey: ["admin", "history"] });
    },
  });
};

// -----------------------------------------------------------------------------
// Produce Verification Hooks
// -----------------------------------------------------------------------------

export interface ProduceVerificationFilterParams {
  status?: string;
  category?: string;
  search?: string;
  page?: number;
  page_size?: number;
}

export const useProduceVerificationList = (params: ProduceVerificationFilterParams = {}) => {
  return useQuery({
    queryKey: ADMIN_KEYS.produce(params),
    queryFn: async () => {
      const res = await apiClient.get<ProduceVerificationListResponse>(
        "/api/v1/admin/produce/verification",
        { params }
      );
      return res.data;
    },
  });
};

export const useProduceVerificationDetail = (produceId: string | undefined) => {
  return useQuery({
    queryKey: ADMIN_KEYS.produceDetail(produceId || ""),
    queryFn: async () => {
      if (!produceId) throw new Error("Produce ID is required");
      const res = await apiClient.get<ProduceVerificationDetail>(
        `/api/v1/admin/produce/${produceId}/verification`
      );
      return res.data;
    },
    enabled: !!produceId,
  });
};

export const useApproveProduce = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      produceId,
      payload,
    }: {
      produceId: string;
      payload?: VerificationDecisionPayload;
    }) => {
      const res = await apiClient.post<ProduceVerificationDetail>(
        `/api/v1/admin/produce/${produceId}/approve`,
        payload || {}
      );
      return res.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ADMIN_KEYS.stats });
      queryClient.invalidateQueries({ queryKey: ["admin", "produce"] });
      queryClient.invalidateQueries({
        queryKey: ADMIN_KEYS.produceDetail(variables.produceId),
      });
      queryClient.invalidateQueries({ queryKey: ["admin", "history"] });
    },
  });
};

export const useRejectProduce = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      produceId,
      payload,
    }: {
      produceId: string;
      payload: VerificationRejectPayload;
    }) => {
      const res = await apiClient.post<ProduceVerificationDetail>(
        `/api/v1/admin/produce/${produceId}/reject`,
        payload
      );
      return res.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ADMIN_KEYS.stats });
      queryClient.invalidateQueries({ queryKey: ["admin", "produce"] });
      queryClient.invalidateQueries({
        queryKey: ADMIN_KEYS.produceDetail(variables.produceId),
      });
      queryClient.invalidateQueries({ queryKey: ["admin", "history"] });
    },
  });
};

// -----------------------------------------------------------------------------
// Global Verification History Hook
// -----------------------------------------------------------------------------

export interface VerificationHistoryFilterParams {
  entity_type?: string;
  action?: string;
  search?: string;
  page?: number;
  page_size?: number;
}

export const useVerificationHistory = (params: VerificationHistoryFilterParams = {}) => {
  return useQuery({
    queryKey: ADMIN_KEYS.history(params),
    queryFn: async () => {
      const res = await apiClient.get<VerificationRecordListResponse>(
        "/api/v1/admin/verification-history",
        { params }
      );
      return res.data;
    },
  });
};
