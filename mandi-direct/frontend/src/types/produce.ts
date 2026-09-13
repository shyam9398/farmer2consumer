export type ProduceStatus =
  | "DRAFT"
  | "PENDING_VERIFICATION"
  | "APPROVED"
  | "REJECTED"
  | "LISTED"
  | "PARTIALLY_SOLD"
  | "SOLD_OUT"
  | "EXPIRED"
  | "ARCHIVED";

export type ProductCategory =
  | "VEGETABLE"
  | "FRUIT"
  | "GRAIN"
  | "PULSE"
  | "SPICE"
  | "OILSEED"
  | "OTHER";

export type QuantityUnit = "KG" | "QUINTAL" | "TON";

export type PriceUnit = "PER_KG" | "PER_QUINTAL" | "PER_TON";

export type QualityGrade =
  | "PREMIUM"
  | "GRADE_A"
  | "GRADE_B"
  | "GRADE_C"
  | "UNGRADED";

export interface ProduceImage {
  id: string;
  produce_listing_id: string;
  storage_path: string;
  image_url: string;
  public_url?: string;
  file_name?: string | null;
  mime_type?: string | null;
  file_size?: number | null;
  width?: number | null;
  height?: number | null;
  is_primary: boolean;
  display_order?: number;
  sort_order: number;
  created_at: string;
}

export type ImageUploadStatus = "SELECTED" | "UPLOADING" | "UPLOADED" | "FAILED" | "DELETING";

export interface PendingUploadImage {
  id: string;
  file: File;
  previewUrl: string;
  progress: number;
  status: ImageUploadStatus;
  errorMessage?: string;
  uploadedImage?: ProduceImage;
}

export interface ProduceImageReorderRequest {
  image_ids: string[];
}

export interface ProduceListing {
  id: string;
  farmer_profile_id: string;
  farm_id: string;
  farm_name?: string | null;
  product_name: string;
  category: ProductCategory;
  variety: string | null;
  description: string | null;
  total_quantity: number;
  available_quantity: number;
  reserved_quantity: number;
  sold_quantity: number;
  quantity_unit: QuantityUnit;
  quality_grade: QualityGrade;
  harvest_date: string;
  available_from: string;
  available_until: string | null;
  expected_price: number;
  price_unit: PriceUnit;
  minimum_order_quantity: number;
  status: ProduceStatus;
  verification_notes: string | null;
  submitted_at: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
  images: ProduceImage[];
  primary_image_url?: string | null;
}

export interface ProduceFormData {
  farm_id: string;
  product_name: string;
  category: ProductCategory;
  variety?: string;
  description?: string;
  total_quantity: number;
  quantity_unit: QuantityUnit;
  quality_grade: QualityGrade;
  harvest_date: string;
  available_from: string;
  available_until?: string;
  expected_price: number;
  price_unit: PriceUnit;
  minimum_order_quantity: number;
}

export interface ProduceListResponse {
  items: ProduceListing[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface ProduceSummaryStats {
  total_listings: number;
  draft_count: number;
  pending_count: number;
  approved_count: number;
  listed_count: number;
  partially_sold_count: number;
  sold_out_count: number;
  rejected_count: number;
  archived_count: number;
}

export interface CropReferenceItem {
  name: string;
  category: ProductCategory;
  varieties: string[];
  standard_unit: QuantityUnit;
}

export interface ProduceFilterParams {
  status?: string;
  category?: string;
  farm_id?: string;
  search?: string;
  page?: number;
  page_size?: number;
}
