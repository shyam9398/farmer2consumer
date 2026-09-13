import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/axios";
import { FARMER_KEYS } from "@/hooks/useFarmer";
import {
  CropReferenceItem,
  ProduceFilterParams,
  ProduceFormData,
  ProduceImage,
  ProduceListing,
  ProduceListResponse,
  ProduceSummaryStats,
} from "@/types/produce";

export const PRODUCE_KEYS = {
  all: ["produce"] as const,
  list: (filters?: ProduceFilterParams) => ["produce", "list", filters] as const,
  detail: (id: string) => ["produce", "detail", id] as const,
  images: (id: string) => ["produce", "images", id] as const,
  stats: ["produce", "stats"] as const,
  crops: ["reference", "crops"] as const,
};

// -----------------------------------------------------------------------------
// Produce Queries
// -----------------------------------------------------------------------------

export const useProduceList = (filters?: ProduceFilterParams) => {
  return useQuery({
    queryKey: PRODUCE_KEYS.list(filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.status) params.append("status", filters.status);
      if (filters?.category) params.append("category", filters.category);
      if (filters?.farm_id) params.append("farm_id", filters.farm_id);
      if (filters?.search) params.append("search", filters.search);
      if (filters?.page) params.append("page", String(filters.page));
      if (filters?.page_size) params.append("page_size", String(filters.page_size));

      const res = await apiClient.get<ProduceListResponse>(
        `/api/v1/farmers/produce?${params.toString()}`
      );
      return res.data;
    },
  });
};

export const useProduceDetail = (produceId: string | undefined) => {
  return useQuery({
    queryKey: PRODUCE_KEYS.detail(produceId || ""),
    queryFn: async () => {
      if (!produceId) return null;
      const res = await apiClient.get<ProduceListing>(`/api/v1/farmers/produce/${produceId}`);
      return res.data;
    },
    enabled: !!produceId,
  });
};

export const useProduceStats = () => {
  return useQuery({
    queryKey: PRODUCE_KEYS.stats,
    queryFn: async () => {
      const res = await apiClient.get<ProduceSummaryStats>("/api/v1/farmers/produce/stats");
      return res.data;
    },
  });
};

export const useCropCatalog = () => {
  return useQuery({
    queryKey: PRODUCE_KEYS.crops,
    queryFn: async () => {
      const res = await apiClient.get<CropReferenceItem[]>("/api/v1/reference/crops");
      return res.data;
    },
    staleTime: 1000 * 60 * 60, // 1 hour cache
  });
};

// -----------------------------------------------------------------------------
// Produce Mutations
// -----------------------------------------------------------------------------

export const useCreateProduce = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: ProduceFormData) => {
      const res = await apiClient.post<ProduceListing>("/api/v1/farmers/produce?publish=true", data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PRODUCE_KEYS.all });
      queryClient.invalidateQueries({ queryKey: FARMER_KEYS.summary });
      queryClient.invalidateQueries({ queryKey: ["marketplace"] });
    },
  });
};

export const useUpdateProduce = (produceId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<ProduceFormData>) => {
      const res = await apiClient.patch<ProduceListing>(
        `/api/v1/farmers/produce/${produceId}`,
        data
      );
      return res.data;
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(PRODUCE_KEYS.detail(produceId), updated);
      queryClient.invalidateQueries({ queryKey: PRODUCE_KEYS.all });
      queryClient.invalidateQueries({ queryKey: FARMER_KEYS.summary });
    },
  });
};

export const useDeleteProduce = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (produceId: string) => {
      const res = await apiClient.delete(`/api/v1/farmers/produce/${produceId}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PRODUCE_KEYS.all });
      queryClient.invalidateQueries({ queryKey: FARMER_KEYS.summary });
    },
  });
};

export const useSubmitProduce = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (produceId: string) => {
      const res = await apiClient.post<ProduceListing>(
        `/api/v1/farmers/produce/${produceId}/submit`
      );
      return res.data;
    },
    onSuccess: (updated, produceId) => {
      queryClient.setQueryData(PRODUCE_KEYS.detail(produceId), updated);
      queryClient.invalidateQueries({ queryKey: PRODUCE_KEYS.all });
      queryClient.invalidateQueries({ queryKey: FARMER_KEYS.summary });
    },
  });
};

// -----------------------------------------------------------------------------
// Produce Images Queries & Mutations (Phase 5)
// -----------------------------------------------------------------------------

export const useProduceImages = (produceId: string | undefined) => {
  return useQuery({
    queryKey: PRODUCE_KEYS.images(produceId || ""),
    queryFn: async () => {
      if (!produceId) return [];
      const res = await apiClient.get<ProduceImage[]>(
        `/api/v1/farmers/produce/${produceId}/images`
      );
      return res.data;
    },
    enabled: !!produceId,
  });
};

export const useUploadProduceImage = (produceId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (
      input: File | { file: File; onProgress?: (percent: number) => void }
    ) => {
      const file = input instanceof File ? input : input.file;
      const onProgress = !(input instanceof File) ? input.onProgress : undefined;
      const formData = new FormData();
      formData.append("file", file);
      const res = await apiClient.post<ProduceImage>(
        `/api/v1/farmers/produce/${produceId}/images`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total && onProgress) {
              const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
              onProgress(percent);
            }
          },
        }
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PRODUCE_KEYS.images(produceId) });
      queryClient.invalidateQueries({ queryKey: PRODUCE_KEYS.detail(produceId) });
      queryClient.invalidateQueries({ queryKey: PRODUCE_KEYS.all });
    },
  });
};

export const useReorderProduceImages = (produceId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (imageIds: string[]) => {
      const res = await apiClient.patch<ProduceImage[]>(
        `/api/v1/farmers/produce/${produceId}/images/reorder`,
        { image_ids: imageIds }
      );
      return res.data;
    },
    onSuccess: (updatedImages) => {
      queryClient.setQueryData(PRODUCE_KEYS.images(produceId), updatedImages);
      queryClient.invalidateQueries({ queryKey: PRODUCE_KEYS.detail(produceId) });
      queryClient.invalidateQueries({ queryKey: PRODUCE_KEYS.all });
    },
  });
};

export const useDeleteProduceImage = (produceId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (imageId: string) => {
      const res = await apiClient.delete(
        `/api/v1/farmers/produce/${produceId}/images/${imageId}`
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PRODUCE_KEYS.images(produceId) });
      queryClient.invalidateQueries({ queryKey: PRODUCE_KEYS.detail(produceId) });
      queryClient.invalidateQueries({ queryKey: PRODUCE_KEYS.all });
    },
  });
};

export const useSetPrimaryProduceImage = (produceId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (imageId: string) => {
      const res = await apiClient.post<ProduceImage>(
        `/api/v1/farmers/produce/${produceId}/images/${imageId}/primary`
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PRODUCE_KEYS.images(produceId) });
      queryClient.invalidateQueries({ queryKey: PRODUCE_KEYS.detail(produceId) });
      queryClient.invalidateQueries({ queryKey: PRODUCE_KEYS.all });
    },
  });
};

export const usePublishProduce = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (produceId: string) => {
      const res = await apiClient.post<ProduceListing>(
        `/api/v1/farmers/produce/${produceId}/publish`
      );
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: PRODUCE_KEYS.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: PRODUCE_KEYS.all });
      queryClient.invalidateQueries({ queryKey: ["marketplace"] });
    },
  });
};

