export type PriceSourceType =
  | "MANDI_DIRECT_TRANSACTION"
  | "GOVERNMENT_DATA"
  | "EXTERNAL_API"
  | "ADMIN_IMPORT"
  | "OTHER";

export type PriceTrend =
  | "RISING"
  | "FALLING"
  | "STABLE"
  | "VOLATILE"
  | "INSUFFICIENT_DATA";

export type ConfidenceLevel = "LOW" | "MEDIUM" | "HIGH";

export type ExpectedPriceComparisonState =
  | "BELOW"
  | "WITHIN"
  | "ABOVE"
  | "NOT_SPECIFIED";

export type MatchLevel =
  | "PRODUCT_VARIETY_QUALITY_LOCATION"
  | "PRODUCT_VARIETY_QUALITY"
  | "PRODUCT_QUALITY"
  | "PRODUCT_ONLY"
  | "CATEGORY_ONLY"
  | "INSUFFICIENT_DATA";

export interface PriceObservation {
  id: string;
  product_name: string;
  category: string;
  variety?: string | null;
  quality_grade?: string | null;
  price: number;
  currency: string;
  price_unit: string;
  market_name?: string | null;
  district?: string | null;
  state?: string | null;
  source_type: PriceSourceType;
  source_name: string;
  source_reference?: string | null;
  observation_date: string;
  price_per_kg: number;
  created_at: string;
  updated_at: string;
}

export interface PriceObservationListResponse {
  items: PriceObservation[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

export interface PriceObservationCreateInput {
  product_name: string;
  category?: string;
  variety?: string;
  quality_grade?: string;
  price: number;
  currency?: string;
  price_unit?: string;
  market_name?: string;
  district?: string;
  state?: string;
  source_type: PriceSourceType;
  source_name: string;
  source_reference?: string;
  observation_date: string;
}

export interface PriceObservationUpdateInput {
  product_name?: string;
  category?: string;
  variety?: string;
  quality_grade?: string;
  price?: number;
  currency?: string;
  price_unit?: string;
  market_name?: string;
  district?: string;
  state?: string;
  source_type?: PriceSourceType;
  source_name?: string;
  source_reference?: string;
  observation_date?: string;
}

export interface CSVImportRowError {
  row_number: number;
  error: string;
  raw_data?: Record<string, any>;
}

export interface CSVImportResponse {
  total_rows: number;
  imported_count: number;
  error_count: number;
  errors: CSVImportRowError[];
}

export interface PriceIntelligenceSummary {
  product_name: string;
  category: string;
  variety?: string | null;
  quality_grade?: string | null;
  latest_price?: number | null;
  min_price?: number | null;
  max_price?: number | null;
  avg_price?: number | null;
  median_price?: number | null;
  weighted_avg_price?: number | null;
  avg_7d?: number | null;
  avg_30d?: number | null;
  avg_90d?: number | null;
  trend: PriceTrend;
  confidence: ConfidenceLevel;
  observation_count: number;
  sources: string[];
  disclaimer: string;
}

export interface PriceHistoryPoint {
  observation_date: string;
  avg_price_per_kg: number;
  min_price_per_kg: number;
  max_price_per_kg: number;
  observation_count: number;
  source_types: string[];
}

export interface PriceHistoryResponse {
  product_name: string;
  variety?: string | null;
  quality_grade?: string | null;
  start_date: string;
  end_date: string;
  history: PriceHistoryPoint[];
  total_observations: number;
  overall_avg_per_kg?: number | null;
  overall_min_per_kg?: number | null;
  overall_max_per_kg?: number | null;
  trend: PriceTrend;
}

export interface RegionalPriceItem {
  region_type: string;
  region_name: string;
  avg_price_per_kg?: number | null;
  min_price_per_kg?: number | null;
  max_price_per_kg?: number | null;
  observation_count: number;
  status_message: string;
}

export interface RegionalPriceResponse {
  product_name: string;
  variety?: string | null;
  quality_grade?: string | null;
  district?: string | null;
  state?: string | null;
  district_reference?: RegionalPriceItem | null;
  state_reference?: RegionalPriceItem | null;
  mandi_direct_reference?: RegionalPriceItem | null;
  overall_range_text: string;
  has_sufficient_data: boolean;
}

export interface PriceRecommendationRequest {
  product_name: string;
  category?: string;
  variety?: string;
  quality_grade?: string;
  district?: string;
  state?: string;
  expected_price?: number;
  price_unit?: string;
}

export interface PriceRecommendationResponse {
  product_name: string;
  variety?: string | null;
  quality_grade?: string | null;
  reference_price: number;
  recommended_min_price: number;
  recommended_target_price: number;
  recommended_max_price: number;
  display_unit: string;
  display_reference_price: number;
  display_min_price: number;
  display_target_price: number;
  display_max_price: number;
  trend: PriceTrend;
  confidence: ConfidenceLevel;
  match_level: MatchLevel;
  observation_count: number;
  data_sources: string[];
  explanation: string;
  expected_price_comparison: ExpectedPriceComparisonState;
  comparison_message: string;
  disclaimer: string;
  generated_at: string;
}
