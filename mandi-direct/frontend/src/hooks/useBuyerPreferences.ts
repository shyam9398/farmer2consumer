import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/axios";
import { BuyerPreferences } from "@/types/matching";

export const BUYER_PREFERENCES_KEY = ["buyer", "preferences"] as const;

export const getBuyerPreferences = async (): Promise<BuyerPreferences> => {
  const res = await apiClient.get<BuyerPreferences>("/api/v1/buyer/preferences");
  return res.data;
};

export const updateBuyerPreferences = async (
  payload: Partial<BuyerPreferences>
): Promise<BuyerPreferences> => {
  const res = await apiClient.put<BuyerPreferences>("/api/v1/buyer/preferences", payload);
  return res.data;
};

export const useBuyerPreferences = () => {
  return useQuery({
    queryKey: BUYER_PREFERENCES_KEY,
    queryFn: getBuyerPreferences,
    staleTime: 1000 * 60 * 5, // 5 mins
  });
};

export const useUpdateBuyerPreferences = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateBuyerPreferences,
    onSuccess: (updated) => {
      queryClient.setQueryData(BUYER_PREFERENCES_KEY, updated);
      queryClient.invalidateQueries({ queryKey: ["buyer", "matching"] });
      queryClient.invalidateQueries({ queryKey: ["farmer", "matching"] });
    },
  });
};
