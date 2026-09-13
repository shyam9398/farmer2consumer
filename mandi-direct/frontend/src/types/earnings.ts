export type EarningStatus =
  | "EXPECTED"
  | "PENDING_SETTLEMENT"
  | "AVAILABLE"
  | "PAID"
  | "CANCELLED"
  | "REFUNDED";

export interface FarmerEarningItem {
  id: string;
  farmer_profile_id: string;
  order_id: string;
  order_number: string;
  order_item_id: string;
  product_name: string;
  quantity: number;
  quantity_unit: string;
  unit_price: number;
  gross_amount: number;
  platform_fee: number;
  logistics_fee: number;
  other_deductions: number;
  net_amount: number;
  currency: string;
  status: EarningStatus;
  earned_at: string;
  created_at: string;
}

export interface FarmerEarningDetail extends FarmerEarningItem {
  order_date: string;
  delivery_date?: string;
  buyer_name?: string;
  buyer_notes?: string;
  settlement_date?: string;
  paid_date?: string;
}

export interface FarmerEarningsSummary {
  total_gross: number;
  total_deductions: number;
  total_net: number;
  pending_settlement: number;
  available_balance: number;
  total_paid: number;
  total_orders: number;
  delivered_orders: number;
  total_quantity_sold: number;
  produce_sold_qty: number;
  total_sales: number;
  estimated_additional_earnings: number;
}

export interface FarmerEarningsListResponse {
  items: FarmerEarningItem[];
  total: number;
  page: number;
  page_size: number;
}
