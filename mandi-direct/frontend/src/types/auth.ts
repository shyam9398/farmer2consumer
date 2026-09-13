export type UserRole = "FARMER" | "BUYER" | "ADMIN" | "LOGISTICS" | "CONSUMER";

export type UserStatus = "ACTIVE" | "PENDING" | "SUSPENDED";

export interface UserProfile {
  id: string;
  auth_user_id: string;
  full_name: string;
  phone: string | null;
  email: string;
  role: UserRole;
  status: UserStatus;
  created_at: string;
  updated_at: string;
}

export interface RegisterPayload {
  username: string;
  password: string;
  fullName: string;
  phone?: string;
  role: UserRole;
  email?: string;
}

export interface LoginPayload {
  username: string;
  password: string;
}
