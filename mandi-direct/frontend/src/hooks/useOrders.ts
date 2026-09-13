import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/axios";
import {
  BuyerOrderDetail,
  BuyerOrderSummary,
  FarmerOrderDetail,
  FarmerOrderStats,
  FarmerOrderSummary,
  OrderStatus,
} from "@/types/order";
import { CART_QUERY_KEY } from "./useCart";

export const BUYER_ORDERS_QUERY_KEY = ["buyer", "orders"];
export const FARMER_ORDERS_QUERY_KEY = ["farmer", "orders"];
export const FARMER_ORDER_STATS_QUERY_KEY = ["farmer", "orderStats"];

export const useBuyerOrders = (statusFilter?: string) => {
  return useQuery<BuyerOrderSummary[]>({
    queryKey: [...BUYER_ORDERS_QUERY_KEY, statusFilter || "ALL"],
    queryFn: async () => {
      const params = statusFilter && statusFilter !== "ALL" ? { status: statusFilter } : {};
      const res = await apiClient.get<BuyerOrderSummary[]>("/api/v1/buyer/orders", { params });
      return res.data;
    },
  });
};

export const useBuyerOrder = (orderId?: string) => {
  return useQuery<BuyerOrderDetail>({
    queryKey: ["buyer", "order", orderId],
    queryFn: async () => {
      const res = await apiClient.get<BuyerOrderDetail>(`/api/v1/buyer/orders/${orderId}`);
      return res.data;
    },
    enabled: Boolean(orderId),
  });
};

export const useCreateOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      delivery_address_id,
      buyer_notes,
    }: {
      delivery_address_id: string;
      buyer_notes?: string;
    }) => {
      const res = await apiClient.post<BuyerOrderDetail>("/api/v1/buyer/orders", {
        delivery_address_id,
        buyer_notes,
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CART_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: BUYER_ORDERS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ["marketplace"] });
    },
  });
};

export const useCancelOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      orderId,
      reason,
    }: {
      orderId: string;
      reason?: string;
    }) => {
      const res = await apiClient.post<BuyerOrderDetail>(
        `/api/v1/buyer/orders/${orderId}/cancel`,
        { reason }
      );
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: BUYER_ORDERS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ["buyer", "order", data.id] });
      queryClient.invalidateQueries({ queryKey: ["marketplace"] });
    },
  });
};

// -----------------------------------------------------------------------------
// Farmer Order Hooks
// -----------------------------------------------------------------------------

export interface FarmerOrdersFilters {
  status?: string;
  search?: string;
  sort_by?: string;
}

export const useFarmerOrders = (filters?: FarmerOrdersFilters) => {
  return useQuery<FarmerOrderSummary[]>({
    queryKey: [...FARMER_ORDERS_QUERY_KEY, filters],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (filters?.status && filters.status !== "ALL") params.status = filters.status;
      if (filters?.search) params.search = filters.search;
      if (filters?.sort_by) params.sort_by = filters.sort_by;

      const res = await apiClient.get<FarmerOrderSummary[]>("/api/v1/farmer/orders", { params });
      return res.data;
    },
  });
};

export const useFarmerOrderStats = () => {
  return useQuery<FarmerOrderStats>({
    queryKey: FARMER_ORDER_STATS_QUERY_KEY,
    queryFn: async () => {
      const res = await apiClient.get<FarmerOrderStats>("/api/v1/farmer/orders/stats");
      return res.data;
    },
  });
};

export const useFarmerOrder = (orderId?: string) => {
  return useQuery<FarmerOrderDetail>({
    queryKey: ["farmer", "order", orderId],
    queryFn: async () => {
      const res = await apiClient.get<FarmerOrderDetail>(`/api/v1/farmer/orders/${orderId}`);
      return res.data;
    },
    enabled: Boolean(orderId),
  });
};

export const useUpdateFarmerOrderStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      orderId,
      status,
      reason,
    }: {
      orderId: string;
      status: OrderStatus;
      reason?: string;
    }) => {
      const res = await apiClient.patch<FarmerOrderDetail>(
        `/api/v1/farmer/orders/${orderId}/status`,
        { status, reason }
      );
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: FARMER_ORDERS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: FARMER_ORDER_STATS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ["farmer", "order", data.id] });
      queryClient.invalidateQueries({ queryKey: ["orderLogistics", data.id] });
      queryClient.invalidateQueries({ queryKey: ["buyer", "order", data.id] });
    },
  });
};
