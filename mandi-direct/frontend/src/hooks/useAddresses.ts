import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/axios";
import { BuyerAddress, BuyerAddressCreate } from "@/types/order";

export const ADDRESSES_QUERY_KEY = ["buyer", "addresses"];

export const useBuyerAddresses = () => {
  return useQuery<BuyerAddress[]>({
    queryKey: ADDRESSES_QUERY_KEY,
    queryFn: async () => {
      const res = await apiClient.get<BuyerAddress[]>("/api/v1/buyer/addresses");
      return res.data;
    },
  });
};

export const useCreateAddress = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: BuyerAddressCreate) => {
      const res = await apiClient.post<BuyerAddress>("/api/v1/buyer/addresses", payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADDRESSES_QUERY_KEY });
    },
  });
};

export const useUpdateAddress = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: string;
      payload: Partial<BuyerAddressCreate>;
    }) => {
      const res = await apiClient.put<BuyerAddress>(`/api/v1/buyer/addresses/${id}`, payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADDRESSES_QUERY_KEY });
    },
  });
};

export const useDeleteAddress = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/api/v1/buyer/addresses/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADDRESSES_QUERY_KEY });
    },
  });
};

export const useSetDefaultAddress = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await apiClient.patch<BuyerAddress>(`/api/v1/buyer/addresses/${id}/default`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADDRESSES_QUERY_KEY });
    },
  });
};
