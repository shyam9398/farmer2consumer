import { Farm, VerificationStatus } from "./farmer";
import {
  ProduceImage,
  ProduceListing,
  ProduceStatus,
  ProductCategory,
  PriceUnit,
  QualityGrade,
  QuantityUnit,
} from "./produce";

export interface AdminDashboardStats {
  pending_farmers: number;
  verified_farmers: number;
  rejected_farmers: number;
  total_farmers: number;
  pending_produce: number;
  approved_produce: number;
  rejected_produce: number;
  total_produce: number;
}

export interface VerificationRecord {
  id: string;
  entity_type: "FARMER" | "PRODUCE";
  entity_id: string;
  action: "APPROVE" | "REJECT" | "RESUBMIT";
  previous_status: string | null;
  new_status: string;
  admin_user_id: string | null;
  admin_name: string | null;
  admin_email: string | null;
  reason: string | null;
  created_at: string;
}

export interface FarmerVerificationItem {
  id: string;
  farmer_id: string;
  profile_id: string;
  full_name: string;
  phone: string | null;
  email: string;
  profile_photo_url: string | null;
  village: string;
  mandal: string;
  district: string;
  state: string;
  pincode: string;
  profile_completion_percentage: number;
  farm_count: number;
  verification_status: VerificationStatus;
  verification_notes: string | null;
  verified_at: string | null;
  verified_by_name: string | null;
  created_at: string;
}

export interface FarmerVerificationListResponse {
  items: FarmerVerificationItem[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface FarmerVerificationDetail {
  farmer: FarmerVerificationItem;
  farms: Farm[];
  history: VerificationRecord[];
}

export interface ProduceVerificationItem {
  id: string;
  produce_id: string;
  product_name: string;
  category: ProductCategory;
  variety: string | null;
  total_quantity: number;
  quantity_unit: QuantityUnit;
  quality_grade: QualityGrade;
  expected_price: number;
  price_unit: PriceUnit;
  harvest_date: string;
  farmer_id: string;
  farmer_name: string;
  farmer_status: VerificationStatus;
  farm_id: string;
  farm_name: string;
  location: string;
  image_count: number;
  primary_image_url: string | null;
  status: ProduceStatus;
  verification_notes: string | null;
  submitted_at: string | null;
  created_at: string;
}

export interface ProduceVerificationListResponse {
  items: ProduceVerificationItem[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface ProduceVerificationDetail {
  produce: ProduceListing;
  farmer_id: string;
  farmer_name: string;
  farmer_verification_status: string;
  farmer_location: string;
  farm: Farm;
  images: ProduceImage[];
  history: VerificationRecord[];
}

export interface VerificationRecordListResponse {
  items: VerificationRecord[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface VerificationDecisionPayload {
  notes?: string;
}

export interface VerificationRejectPayload {
  reason: string;
}
