export type MatchLevel =
  | "VERY_LOW"
  | "LOW"
  | "MODERATE"
  | "HIGH"
  | "VERY_HIGH"
  | "INSUFFICIENT_DATA";

export type ConfidenceLevel = "LOW" | "MEDIUM" | "HIGH";

export interface BuyerPreferences {
  id?: string;
  buyer_user_id?: string;
  preferred_categories: string[];
  preferred_products: string[];
  preferred_varieties: string[];
  preferred_quality_grades: string[];
  preferred_districts: string[];
  preferred_states: string[];
  minimum_quantity: number | null;
  maximum_quantity: number | null;
  minimum_price: number | null;
  maximum_price: number | null;
  created_at?: string;
  updated_at?: string;
}

export interface MatchSignal {
  signal_type: string;
  signal_name: string;
  matched: boolean;
  points_awarded: number;
  max_points: number;
  description: string;
}

export interface MatchResult {
  match_score: number;
  match_level: MatchLevel;
  confidence: ConfidenceLevel;
  explanation: string;
  matched_signals: MatchSignal[];
  unmatched_signals: MatchSignal[];
  generated_at: string;
}

export interface BuyerSafeInfo {
  buyer_id: string;
  display_name: string;
  buyer_type: string;
  district?: string | null;
  state?: string | null;
  preferred_categories: string[];
  interested_products: string[];
  verified_purchases_count: number;
}

export interface FarmerProduceSafeInfo {
  produce_id: string;
  product_name: string;
  category: string;
  variety?: string | null;
  quality_grade: string;
  expected_price: number;
  price_unit: string;
  available_quantity: number;
  quantity_unit: string;
  primary_image_url?: string | null;
  village?: string | null;
  mandal?: string | null;
  district: string;
  state: string;
  farmer_id: string;
  farmer_name: string;
  is_verified_farmer: boolean;
  demand_level?: string | null;
  demand_trend?: string | null;
}

export interface BuyerMatchItem {
  buyer: BuyerSafeInfo;
  produce: FarmerProduceSafeInfo;
  match: MatchResult;
}

export interface ProductMatchItem {
  produce: FarmerProduceSafeInfo;
  match: MatchResult;
}

export interface FarmerBuyerMatchesResponse {
  items: BuyerMatchItem[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  high_match_count: number;
  generated_at: string;
}

export interface BuyerProductMatchesResponse {
  items: ProductMatchItem[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  generated_at: string;
}

export interface ProduceBuyerMatchesResponse {
  produce: FarmerProduceSafeInfo;
  items: BuyerMatchItem[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  high_match_count: number;
  generated_at: string;
}

export interface MatchingFilters {
  produce_id?: string;
  category?: string;
  product_name?: string;
  variety?: string;
  quality_grade?: string;
  district?: string;
  state?: string;
  min_score?: number;
  match_level?: string;
  sort?: string;
  page?: number;
  page_size?: number;
}
