import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../lib/axios";
import {
  CollectionPoint,
  CollectionPointCreate,
  CollectionPointListResponse,
  CollectionPointUpdate,
  DeliveryConfirmationCreate,
  LogisticsDashboardResponse,
  OrderLogistics,
  SchedulePickupRequest,
  StartDeliveryRequest,
} from "../types/logistics";

export interface CollectionPointsFilter {
  district?: string;
  is_active?: boolean;
  search?: string;
}

export interface LogisticsDashboardFilter {
  date_filter?: string;
  status?: string;
  collection_point_id?: string;
  district?: string;
}

export const useCollectionPoints = (filters?: CollectionPointsFilter) => {
  return useQuery<CollectionPointListResponse>({
    queryKey: ["collectionPoints", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.district) params.append("district", filters.district);
      if (filters?.is_active !== undefined) params.append("is_active", String(filters.is_active));
      if (filters?.search) params.append("search", filters.search);

      const res = await apiClient.get<CollectionPointListResponse>(`/api/v1/admin/collection-points?${params.toString()}`);
      return res.data;
    },
  });
};

export const useActiveCollectionPoints = (district?: string, search?: string) => {
  return useQuery<CollectionPointListResponse>({
    queryKey: ["activeCollectionPoints", district, search],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (district) params.append("district", district);
      if (search) params.append("search", search);

      const res = await apiClient.get<CollectionPointListResponse>(`/api/v1/collection-points/active?${params.toString()}`);
      return res.data;
    },
  });
};

export const useCreateCollectionPoint = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CollectionPointCreate) => {
      const res = await apiClient.post<CollectionPoint>("/api/v1/admin/collection-points", payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collectionPoints"] });
      queryClient.invalidateQueries({ queryKey: ["activeCollectionPoints"] });
    },
  });
};

export const useUpdateCollectionPoint = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: CollectionPointUpdate }) => {
      const res = await apiClient.put<CollectionPoint>(`/api/v1/admin/collection-points/${id}`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collectionPoints"] });
      queryClient.invalidateQueries({ queryKey: ["activeCollectionPoints"] });
    },
  });
};

export const useDeleteCollectionPoint = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/api/v1/admin/collection-points/${id}`);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collectionPoints"] });
      queryClient.invalidateQueries({ queryKey: ["activeCollectionPoints"] });
    },
  });
};

export const useOrderLogistics = (orderId?: string) => {
  return useQuery<OrderLogistics>({
    queryKey: ["orderLogistics", orderId],
    queryFn: async () => {
      const res = await apiClient.get<OrderLogistics>(`/api/v1/orders/${orderId}/logistics`);
      return res.data;
    },
    enabled: !!orderId,
  });
};

export const useSchedulePickup = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ orderId, data }: { orderId: string; data: SchedulePickupRequest }) => {
      const res = await apiClient.post<OrderLogistics>(`/api/v1/admin/orders/${orderId}/pickup/schedule`, data);
      return res.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["orderLogistics", variables.orderId] });
      queryClient.invalidateQueries({ queryKey: ["logisticsDashboard"] });
      queryClient.invalidateQueries({ queryKey: ["buyer", "order", variables.orderId] });
      queryClient.invalidateQueries({ queryKey: ["farmer", "order", variables.orderId] });
      queryClient.invalidateQueries({ queryKey: ["farmer", "orders"] });
    },
  });
};

export const useCompletePickup = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ orderId, notes }: { orderId: string; notes?: string }) => {
      const res = await apiClient.post<OrderLogistics>(`/api/v1/admin/orders/${orderId}/pickup/complete`, { notes });
      return res.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["orderLogistics", variables.orderId] });
      queryClient.invalidateQueries({ queryKey: ["logisticsDashboard"] });
      queryClient.invalidateQueries({ queryKey: ["buyer", "order", variables.orderId] });
      queryClient.invalidateQueries({ queryKey: ["farmer", "order", variables.orderId] });
      queryClient.invalidateQueries({ queryKey: ["farmer", "orders"] });
      queryClient.invalidateQueries({ queryKey: ["farmer", "orderStats"] });
    },
  });
};

export const useStartDelivery = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ orderId, data }: { orderId: string; data: StartDeliveryRequest }) => {
      const res = await apiClient.post<OrderLogistics>(`/api/v1/admin/orders/${orderId}/delivery/start`, data);
      return res.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["orderLogistics", variables.orderId] });
      queryClient.invalidateQueries({ queryKey: ["logisticsDashboard"] });
      queryClient.invalidateQueries({ queryKey: ["buyer", "order", variables.orderId] });
      queryClient.invalidateQueries({ queryKey: ["farmer", "order", variables.orderId] });
      queryClient.invalidateQueries({ queryKey: ["farmer", "orders"] });
      queryClient.invalidateQueries({ queryKey: ["farmer", "orderStats"] });
    },
  });
};

export const useCompleteDelivery = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ orderId, data }: { orderId: string; data: DeliveryConfirmationCreate }) => {
      const res = await apiClient.post<OrderLogistics>(`/api/v1/admin/orders/${orderId}/delivery/complete`, data);
      return res.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["orderLogistics", variables.orderId] });
      queryClient.invalidateQueries({ queryKey: ["logisticsDashboard"] });
      queryClient.invalidateQueries({ queryKey: ["buyer", "order", variables.orderId] });
      queryClient.invalidateQueries({ queryKey: ["farmer", "order", variables.orderId] });
      queryClient.invalidateQueries({ queryKey: ["farmer", "orders"] });
      queryClient.invalidateQueries({ queryKey: ["farmer", "orderStats"] });
    },
  });
};

export const useLogisticsDashboard = (filters?: LogisticsDashboardFilter) => {
  return useQuery<LogisticsDashboardResponse>({
    queryKey: ["logisticsDashboard", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.date_filter) params.append("date_filter", filters.date_filter);
      if (filters?.status && filters.status !== "ALL") params.append("status", filters.status);
      if (filters?.collection_point_id && filters.collection_point_id !== "ALL") params.append("collection_point_id", filters.collection_point_id);
      if (filters?.district) params.append("district", filters.district);

      const res = await apiClient.get<LogisticsDashboardResponse>(`/api/v1/admin/logistics/dashboard?${params.toString()}`);
      return res.data;
    },
  });
};
