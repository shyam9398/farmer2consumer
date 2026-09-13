import { OrderLogistics } from "./logistics";

export type OrderStatus =
  | "PENDING"
  | "ACCEPTED"
  | "PREPARING"
  | "READY_FOR_PICKUP"
  | "PICKED_UP"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "CANCELLED"
  | "REJECTED";

export type PaymentStatus = "PENDING" | "PAID" | "FAILED" | "REFUNDED";

export interface BuyerAddress {
  id: string;
  buyer_user_id: string;
  full_name: string;
  phone: string;
  address_line1: string;
  address_line2?: string | null;
  village?: string | null;
  mandal?: string | null;
  district: string;
  state: string;
  pincode: string;
  landmark?: string | null;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface BuyerAddressCreate {
  full_name: string;
  phone: string;
  address_line1: string;
  address_line2?: string;
  village?: string;
  mandal?: string;
  district: string;
  state: string;
  pincode: string;
  landmark?: string;
  is_default?: boolean;
}

export interface CartProductInfo {
  id: string;
  product_name: string;
  category: string;
  variety?: string | null;
  expected_price: number;
  price_unit: string;
  quantity_unit: string;
  available_quantity: number;
  minimum_order_quantity: number;
  primary_image_url?: string | null;
  status: string;
  farmer_name: string;
  farmer_location: string;
}

export interface CartItem {
  id: string;
  cart_id: string;
  produce_listing_id: string;
  quantity: number;
  product: CartProductInfo;
  subtotal: number;
  created_at: string;
  updated_at: string;
}

export interface CartResponse {
  id: string;
  buyer_user_id: string;
  items: CartItem[];
  item_count: number;
  subtotal: number;
  delivery_fee: number;
  total_amount: number;
}

export interface OrderItem {
  id: string;
  order_id: string;
  produce_listing_id: string;
  farmer_profile_id: string;
  product_name: string;
  quantity: number;
  quantity_unit: string;
  unit_price: number;
  subtotal: number;
  primary_image_url?: string | null;
  farmer_name?: string | null;
}

export interface OrderStatusHistory {
  id: string;
  order_id: string;
  previous_status?: string | null;
  new_status: string;
  changed_by: string;
  actor_name?: string | null;
  reason?: string | null;
  created_at: string;
}

export interface BuyerOrderSummary {
  id: string;
  order_number: string;
  status: OrderStatus;
  payment_status: PaymentStatus;
  subtotal: number;
  delivery_fee: number;
  total_amount: number;
  items_count: number;
  first_product_name: string;
  first_product_image?: string | null;
  created_at: string;
}

export interface BuyerOrderDetail {
  id: string;
  order_number: string;
  status: OrderStatus;
  payment_status: PaymentStatus;
  subtotal: number;
  delivery_fee: number;
  total_amount: number;
  delivery_address_snapshot: BuyerAddress;
  buyer_notes?: string | null;
  items: OrderItem[];
  status_history: OrderStatusHistory[];
  logistics?: OrderLogistics | null;
  created_at: string;
  updated_at: string;
}

export interface FarmerOrderItem {
  id: string;
  produce_listing_id: string;
  product_name: string;
  variety?: string | null;
  quality_grade?: string | null;
  quantity: number;
  quantity_unit: string;
  unit_price: number;
  subtotal: number;
}

export interface FarmerOrderSummary {
  id: string;
  order_number: string;
  status: OrderStatus;
  created_at: string;
  items_count: number;
  product_names?: string[];
  farmer_subtotal: number;
  buyer_name: string;
  delivery_district: string;
  delivery_state: string;
  collection_point_name?: string | null;
}

export interface FarmerOrderDetail {
  id: string;
  order_number: string;
  status: OrderStatus;
  created_at: string;
  buyer_name: string;
  buyer_phone?: string | null;
  delivery_address: BuyerAddress;
  buyer_notes?: string | null;
  items: FarmerOrderItem[];
  farmer_subtotal: number;
  status_history: OrderStatusHistory[];
  logistics?: OrderLogistics | null;
}

export interface FarmerOrderStats {
  pending: number;
  accepted: number;
  preparing: number;
  ready_for_pickup: number;
  picked_up: number;
  out_for_delivery: number;
  delivered: number;
  rejected: number;
  cancelled: number;
  total_requiring_action: number;
}
