export type PayoutStatus =
  | "PENDING"
  | "PROCESSING"
  | "COMPLETED"
  | "FAILED"
  | "CANCELLED";

export interface PayoutRequestCreate {
  amount: number;
}

export interface FarmerPayout {
  id: string;
  farmer_profile_id: string;
  farmer_name?: string;
  farmer_phone?: string;
  payout_reference: string;
  amount: number;
  currency: string;
  status: PayoutStatus;
  payment_method: string;
  provider: string;
  provider_payout_id?: string;
  requested_at: string;
  processed_at?: string;
  failed_at?: string;
  failure_reason?: string;
  created_at: string;
}

export interface FarmerPayoutListResponse {
  items: FarmerPayout[];
  total: number;
  page: number;
  page_size: number;
}

export interface AdminPayoutUpdateRequest {
  status: "PROCESSING" | "COMPLETED" | "FAILED";
  failure_reason?: string;
  provider_payout_id?: string;
}
