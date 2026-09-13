import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/axios";
import {
  BuyerProductMatchesResponse,
  FarmerBuyerMatchesResponse,
  MatchingFilters,
  ProduceBuyerMatchesResponse,
  ProductMatchItem,
} from "@/types/matching";

export const MATCHING_QUERY_KEYS = {
  farmerBuyers: (filters?: MatchingFilters) => ["farmer", "matching", "buyers", filters] as const,
  produceBuyers: (produceId: string, page?: number, pageSize?: number) =>
    ["farmer", "matching", "buyers", produceId, { page, pageSize }] as const,
  buyerProducts: (filters?: MatchingFilters) => ["buyer", "matching", "products", filters] as const,
  buyerSingleProduct: (produceId: string) => ["buyer", "matching", "product", produceId] as const,
};

// API Fetchers
export const getFarmerBuyerMatches = async (
  filters?: MatchingFilters
): Promise<FarmerBuyerMatchesResponse> => {
  const params = new URLSearchParams();
  if (filters?.produce_id) params.append("produce_id", filters.produce_id);
  if (filters?.district) params.append("district", filters.district);
  if (filters?.state) params.append("state", filters.state);
  if (filters?.min_score !== undefined) params.append("min_score", String(filters.min_score));
  if (filters?.match_level && filters.match_level !== "ALL") params.append("match_level", filters.match_level);
  if (filters?.sort) params.append("sort", filters.sort);
  if (filters?.page) params.append("page", String(filters.page));
  if (filters?.page_size) params.append("page_size", String(filters.page_size));

  const query = params.toString();
  const url = `/api/v1/farmer/matching/buyers${query ? `?${query}` : ""}`;
  const res = await apiClient.get<FarmerBuyerMatchesResponse>(url);
  return res.data;
};

export const getProduceBuyerMatches = async (
  produceId: string,
  page: number = 1,
  pageSize: number = 20
): Promise<ProduceBuyerMatchesResponse> => {
  const res = await apiClient.get<ProduceBuyerMatchesResponse>(
    `/api/v1/farmer/matching/buyers/${produceId}?page=${page}&page_size=${pageSize}`
  );
  return res.data;
};

export const getBuyerProductMatches = async (
  filters?: MatchingFilters
): Promise<BuyerProductMatchesResponse> => {
  const params = new URLSearchParams();
  if (filters?.category && filters.category !== "ALL") params.append("category", filters.category);
  if (filters?.product_name && filters.product_name.trim()) params.append("product_name", filters.product_name.trim());
  if (filters?.variety && filters.variety.trim()) params.append("variety", filters.variety.trim());
  if (filters?.quality_grade && filters.quality_grade !== "ALL") params.append("quality_grade", filters.quality_grade);
  if (filters?.district && filters.district.trim()) params.append("district", filters.district.trim());
  if (filters?.state && filters.state.trim()) params.append("state", filters.state.trim());
  if (filters?.min_score !== undefined) params.append("min_score", String(filters.min_score));
  if (filters?.match_level && filters.match_level !== "ALL") params.append("match_level", filters.match_level);
  if (filters?.sort) params.append("sort", filters.sort);
  if (filters?.page) params.append("page", String(filters.page));
  if (filters?.page_size) params.append("page_size", String(filters.page_size));

  const query = params.toString();
  const url = `/api/v1/buyer/matching/products${query ? `?${query}` : ""}`;
  const res = await apiClient.get<BuyerProductMatchesResponse>(url);
  return res.data;
};

export const getBuyerSingleProductMatch = async (
  produceId: string
): Promise<ProductMatchItem> => {
  const res = await apiClient.get<ProductMatchItem>(
    `/api/v1/buyer/matching/products/${produceId}`
  );
  return res.data;
};

// React Query Hooks
export const useFarmerBuyerMatches = (filters?: MatchingFilters) => {
  return useQuery({
    queryKey: MATCHING_QUERY_KEYS.farmerBuyers(filters),
    queryFn: () => getFarmerBuyerMatches(filters),
    staleTime: 1000 * 60 * 2,
  });
};

export const useProduceBuyerMatches = (
  produceId?: string,
  page: number = 1,
  pageSize: number = 20
) => {
  return useQuery({
    queryKey: MATCHING_QUERY_KEYS.produceBuyers(produceId || "", page, pageSize),
    queryFn: () => getProduceBuyerMatches(produceId!, page, pageSize),
    enabled: Boolean(produceId),
    staleTime: 1000 * 60 * 2,
  });
};

export const useBuyerProductMatches = (filters?: MatchingFilters) => {
  return useQuery({
    queryKey: MATCHING_QUERY_KEYS.buyerProducts(filters),
    queryFn: () => getBuyerProductMatches(filters),
    staleTime: 1000 * 60 * 2,
  });
};

// Alias as requested in prompt section 19
export const useBuyerMatchedProducts = useBuyerProductMatches;

export const useBuyerSingleProductMatch = (produceId?: string) => {
  return useQuery({
    queryKey: MATCHING_QUERY_KEYS.buyerSingleProduct(produceId || ""),
    queryFn: () => getBuyerSingleProductMatch(produceId!),
    enabled: Boolean(produceId),
    staleTime: 1000 * 60 * 5,
  });
};
