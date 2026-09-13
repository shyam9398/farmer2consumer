import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/axios";
import { CartResponse } from "@/types/order";

export const CART_QUERY_KEY = ["buyer", "cart"];

export const useCart = () => {
  return useQuery<CartResponse>({
    queryKey: CART_QUERY_KEY,
    queryFn: async () => {
      const res = await apiClient.get<CartResponse>("/api/v1/buyer/cart");
      return res.data;
    },
    staleTime: 1000 * 30, // 30 seconds
  });
};

export const useAddToCart = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      produce_listing_id,
      quantity,
    }: {
      produce_listing_id: string;
      quantity: number;
    }) => {
      const res = await apiClient.post<CartResponse>("/api/v1/buyer/cart/items", {
        produce_listing_id,
        quantity,
      });
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(CART_QUERY_KEY, data);
      queryClient.invalidateQueries({ queryKey: ["marketplace"] });
    },
  });
};

export const useUpdateCartItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      item_id,
      quantity,
    }: {
      item_id: string;
      quantity: number;
    }) => {
      const res = await apiClient.patch<CartResponse>(
        `/api/v1/buyer/cart/items/${item_id}`,
        { quantity }
      );
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(CART_QUERY_KEY, data);
    },
  });
};

export const useRemoveCartItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (item_id: string) => {
      const res = await apiClient.delete<CartResponse>(
        `/api/v1/buyer/cart/items/${item_id}`
      );
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(CART_QUERY_KEY, data);
    },
  });
};

export const useClearCart = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await apiClient.delete("/api/v1/buyer/cart");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CART_QUERY_KEY });
    },
  });
};
