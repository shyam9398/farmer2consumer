export type NotificationType =
  | "AUTH"
  | "PROFILE"
  | "VERIFICATION"
  | "PRODUCE"
  | "ORDER"
  | "LOGISTICS"
  | "PAYMENT"
  | "PAYOUT"
  | "PRICE_INTELLIGENCE"
  | "DEMAND_INTELLIGENCE"
  | "MATCHING"
  | "SYSTEM";

export interface NotificationItemData {
  id: string;
  recipient_user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  entity_type?: string | null;
  entity_id?: string | null;
  action_url?: string | null;
  is_read: boolean;
  read_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface NotificationListResponse {
  items: NotificationItemData[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  unread_count: number;
}

export interface UnreadNotificationCountResponse {
  unread_count: number;
}

export interface NotificationPreferences {
  id: string;
  user_id: string;
  order_notifications: boolean;
  verification_notifications: boolean;
  logistics_notifications: boolean;
  payment_notifications: boolean;
  payout_notifications: boolean;
  matching_notifications: boolean;
  intelligence_notifications: boolean;
  system_notifications: boolean;
  created_at: string;
  updated_at: string;
}

export interface NotificationPreferenceUpdate {
  order_notifications?: boolean;
  verification_notifications?: boolean;
  logistics_notifications?: boolean;
  payment_notifications?: boolean;
  payout_notifications?: boolean;
  matching_notifications?: boolean;
  intelligence_notifications?: boolean;
  system_notifications?: boolean;
}

export interface NotificationFilterParams {
  page?: number;
  page_size?: number;
  unread_only?: boolean;
  type?: NotificationType;
}
