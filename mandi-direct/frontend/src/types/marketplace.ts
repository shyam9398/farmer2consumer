export interface MarketplaceFarmer {
  id: string;
  name: string;
  is_verified: boolean;
  verification_status: string;
  member_since?: string | null;
}

export interface MarketplaceLocation {
  village: string;
  mandal: string;
  district: string;
  state: string;
}

export interface MarketplaceFarm {
  id: string;
  farm_name: string;
  total_area: number;
  area_unit: string;
  soil_type?: string | null;
  irrigation_type?: string | null;
  village: string;
  mandal: string;
  district: string;
  state: string;
}

export interface MarketplaceImage {
  id: string;
  image_url: string;
  public_url?: string | null;
  is_primary: boolean;
  display_order: number;
  sort_order: number;
}

export interface MarketplaceTransparentPricing {
  farmer_price: number;
  price_unit: string;
  traditional_benchmark_price?: number | null;
  potential_savings?: number | null;
  notes?: string | null;
}

export interface MarketplaceProduct {
  id: string;
  product_name: string;
  category: string;
  variety?: string | null;
  description?: string | null;
  total_quantity: number;
  available_quantity: number;
  quantity_unit: string;
  quality_grade: string;
  price: number;
  expected_price: number;
  price_unit: string;
  harvest_date: string;
  available_from: string;
  available_until?: string | null;
  minimum_order_quantity: number;
  status: string;
  primary_image_url?: string | null;
  image_count: number;
  farmer: MarketplaceFarmer;
  location: MarketplaceLocation;
}

export interface MarketplaceProductDetails extends MarketplaceProduct {
  images: MarketplaceImage[];
  farm: MarketplaceFarm;
  transparent_pricing: MarketplaceTransparentPricing;
}

export interface MarketplaceListResponse {
  items: MarketplaceProduct[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface MarketplaceFilters {
  search?: string;
  category?: string;
  quality_grade?: string;
  farm_id?: string;
  district?: string;
  mandal?: string;
  village?: string;
  state?: string;
  min_price?: number;
  max_price?: number;
  min_quantity?: number;
  sort?: string;
  page?: number;
  page_size?: number;
}
