import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/axios";
import {
  Farm,
  FarmFormData,
  FarmerDashboardSummary,
  FarmerProfile,
  FarmerProfileFormData,
} from "@/types/farmer";

// Query Keys
export const FARMER_KEYS = {
  profile: ["farmerProfile"] as const,
  summary: ["farmerSummary"] as const,
  farms: ["farms"] as const,
  farm: (id: string) => ["farms", id] as const,
};

// -----------------------------------------------------------------------------
// Farmer Profile Hooks
// -----------------------------------------------------------------------------

export const useFarmerProfile = () => {
  return useQuery({
    queryKey: FARMER_KEYS.profile,
    queryFn: async () => {
      try {
        const res = await apiClient.get<FarmerProfile>("/api/v1/farmers/profile");
        return res.data;
      } catch (err: any) {
        if (err?.response?.status === 404) {
          return null;
        }
        throw err;
      }
    },
    retry: (failureCount, error: any) => {
      // Do not retry on 404 (not yet created) or 401/403
      if (error?.response?.status === 404 || error?.response?.status === 403) {
        return false;
      }
      return failureCount < 2;
    },
  });
};

export const useCreateFarmerProfile = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: FarmerProfileFormData) => {
      const res = await apiClient.post<FarmerProfile>("/api/v1/farmers/profile", data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FARMER_KEYS.profile });
      queryClient.invalidateQueries({ queryKey: FARMER_KEYS.summary });
    },
  });
};

export const useUpdateFarmerProfile = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<FarmerProfileFormData>) => {
      const res = await apiClient.put<FarmerProfile>("/api/v1/farmers/profile", data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FARMER_KEYS.profile });
      queryClient.invalidateQueries({ queryKey: FARMER_KEYS.summary });
    },
  });
};

export const useUploadFarmerPhoto = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      const res = await apiClient.post<FarmerProfile>(
        "/api/v1/farmers/profile/photo",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FARMER_KEYS.profile });
      queryClient.invalidateQueries({ queryKey: FARMER_KEYS.summary });
    },
  });
};

// -----------------------------------------------------------------------------
// Farm Management Hooks
// -----------------------------------------------------------------------------

export const useFarms = () => {
  return useQuery({
    queryKey: FARMER_KEYS.farms,
    queryFn: async () => {
      const res = await apiClient.get<Farm[]>("/api/v1/farmers/farms");
      return res.data;
    },
  });
};

export const useFarm = (farmId?: string) => {
  return useQuery({
    queryKey: FARMER_KEYS.farm(farmId || ""),
    queryFn: async () => {
      if (!farmId) return null;
      const res = await apiClient.get<Farm>(`/api/v1/farmers/farms/${farmId}`);
      return res.data;
    },
    enabled: Boolean(farmId),
  });
};

export const useCreateFarm = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: FarmFormData) => {
      const res = await apiClient.post<Farm>("/api/v1/farmers/farms", data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FARMER_KEYS.farms });
      queryClient.invalidateQueries({ queryKey: FARMER_KEYS.summary });
      queryClient.invalidateQueries({ queryKey: FARMER_KEYS.profile });
    },
  });
};

export const useUpdateFarm = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ farmId, data }: { farmId: string; data: Partial<FarmFormData> }) => {
      const res = await apiClient.put<Farm>(`/api/v1/farmers/farms/${farmId}`, data);
      return res.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: FARMER_KEYS.farms });
      queryClient.invalidateQueries({ queryKey: FARMER_KEYS.farm(variables.farmId) });
      queryClient.invalidateQueries({ queryKey: FARMER_KEYS.summary });
      queryClient.invalidateQueries({ queryKey: FARMER_KEYS.profile });
    },
  });
};

export const useDeleteFarm = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (farmId: string) => {
      const res = await apiClient.delete(`/api/v1/farmers/farms/${farmId}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FARMER_KEYS.farms });
      queryClient.invalidateQueries({ queryKey: FARMER_KEYS.summary });
      queryClient.invalidateQueries({ queryKey: FARMER_KEYS.profile });
    },
  });
};

// -----------------------------------------------------------------------------
// Dashboard Summary Hook
// -----------------------------------------------------------------------------

export const useFarmerSummary = () => {
  return useQuery({
    queryKey: FARMER_KEYS.summary,
    queryFn: async () => {
      const res = await apiClient.get<FarmerDashboardSummary>("/api/v1/farmers/summary");
      return res.data;
    },
  });
};
