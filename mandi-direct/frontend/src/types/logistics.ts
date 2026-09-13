export interface CollectionPoint {
  id: string;
  name: string;
  description?: string | null;
  address: string;
  village?: string | null;
  mandal?: string | null;
  district: string;
  state: string;
  pincode: string;
  latitude?: number | null;
  longitude?: number | null;
  contact_name: string;
  contact_phone: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CollectionPointCreate {
  name: string;
  description?: string;
  address: string;
  village?: string;
  mandal?: string;
  district: string;
  state: string;
  pincode: string;
  latitude?: number;
  longitude?: number;
  contact_name: string;
  contact_phone: string;
  is_active?: boolean;
}

export interface CollectionPointUpdate {
  name?: string;
  description?: string;
  address?: string;
  village?: string;
  mandal?: string;
  district?: string;
  state?: string;
  pincode?: string;
  latitude?: number;
  longitude?: number;
  contact_name?: string;
  contact_phone?: string;
  is_active?: boolean;
}

export interface CollectionPointListResponse {
  items: CollectionPoint[];
  total: number;
}

export interface DeliveryConfirmation {
  id: string;
  order_id: string;
  confirmed_by: string;
  confirmation_type: string;
  recipient_name: string;
  notes?: string | null;
  confirmed_at: string;
}

export interface DeliveryConfirmationCreate {
  recipient_name: string;
  confirmation_type?: string;
  notes?: string;
}

export interface OrderLogistics {
  id: string;
  order_id: string;
  collection_type: string;
  collection_point_id?: string | null;
  collection_point?: CollectionPoint | null;
  pickup_address?: string | null;
  pickup_village?: string | null;
  pickup_mandal?: string | null;
  pickup_district?: string | null;
  pickup_state?: string | null;
  pickup_pincode?: string | null;
  pickup_latitude?: number | null;
  pickup_longitude?: number | null;
  delivery_address?: string | null;
  delivery_village?: string | null;
  delivery_mandal?: string | null;
  delivery_district?: string | null;
  delivery_state?: string | null;
  delivery_pincode?: string | null;
  delivery_latitude?: number | null;
  delivery_longitude?: number | null;
  assigned_agent_name?: string | null;
  assigned_agent_phone?: string | null;
  vehicle_type?: string | null;
  vehicle_number?: string | null;
  booking_status?: string | null;
  assigned_vehicle_id?: string | null;
  logistics_user_id?: string | null;
  current_latitude?: number | null;
  current_longitude?: number | null;
  pickup_scheduled_at?: string | null;
  pickup_completed_at?: string | null;
  delivery_started_at?: string | null;
  delivery_completed_at?: string | null;
  estimated_delivery_at?: string | null;
  delivery_notes?: string | null;
  delivery_confirmation?: DeliveryConfirmation | null;
  created_at: string;
  updated_at: string;
}

export interface SchedulePickupRequest {
  pickup_scheduled_at: string;
  collection_point_id?: string;
  assigned_agent_name?: string;
  assigned_agent_phone?: string;
  vehicle_type?: string;
  vehicle_number?: string;
  pickup_notes?: string;
}

export interface StartDeliveryRequest {
  estimated_delivery_at?: string;
  notes?: string;
}

export interface LogisticsFarmerSummary {
  farmer_profile_id: string;
  farmer_name: string;
  farm_name?: string | null;
  village?: string | null;
  district?: string | null;
  phone?: string | null;
  products: string[];
}

export interface LogisticsOrderSummary {
  id: string;
  order_number: string;
  status: string;
  total_amount: number;
  buyer_name: string;
  buyer_phone?: string | null;
  delivery_city: string;
  delivery_state: string;
  delivery_pincode: string;
  farmers: LogisticsFarmerSummary[];
  items_count: number;
  logistics?: OrderLogistics | null;
  created_at: string;
}

export interface LogisticsDashboardStats {
  ready_for_pickup: number;
  picked_up: number;
  out_for_delivery: number;
  delivered_today: number;
  total_active_deliveries: number;
  today_scheduled_pickups: number;
}

export interface LogisticsDashboardResponse {
  stats: LogisticsDashboardStats;
  orders: LogisticsOrderSummary[];
  total_orders: number;
}
