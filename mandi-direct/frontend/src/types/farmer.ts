export type VerificationStatus = "PENDING" | "VERIFIED" | "REJECTED";

export type OwnershipType = "OWNED" | "LEASED" | "FAMILY" | "OTHER";

export type AreaUnit = "ACRE" | "HECTARE";

export type SoilType =
  | "RED"
  | "BLACK"
  | "ALLUVIAL"
  | "LOAMY"
  | "SANDY"
  | "CLAY"
  | "OTHER";

export type IrrigationType =
  | "RAINFED"
  | "BOREWELL"
  | "CANAL"
  | "DRIP"
  | "SPRINKLER"
  | "OTHER";

export type Gender = "MALE" | "FEMALE" | "OTHER";

export interface FarmerProfile {
  id: string;
  profile_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  date_of_birth: string | null;
  gender: Gender | null;
  profile_photo_url: string | null;
  address_line: string;
  village: string;
  mandal: string;
  district: string;
  state: string;
  pincode: string;
  verification_status: VerificationStatus;
  verification_notes: string | null;
  created_at: string;
  updated_at: string;
  profile_completion_pct: number;
  is_profile_complete: boolean;
}

export interface FarmerProfileFormData {
  full_name?: string;
  phone?: string;
  date_of_birth?: string;
  gender?: Gender;
  address_line: string;
  village: string;
  mandal: string;
  district: string;
  state: string;
  pincode: string;
}

export interface Farm {
  id: string;
  farmer_profile_id: string;
  farm_name: string;
  total_area: number;
  area_unit: AreaUnit;
  ownership_type: OwnershipType;
  soil_type: SoilType | null;
  irrigation_type: IrrigationType | null;
  primary_crops: string[];
  latitude: number | null;
  longitude: number | null;
  address_line: string | null;
  village: string;
  mandal: string;
  district: string;
  state: string;
  pincode: string;
  created_at: string;
  updated_at: string;
}

export interface FarmFormData {
  farm_name: string;
  total_area: number;
  area_unit: AreaUnit;
  ownership_type: OwnershipType;
  soil_type?: SoilType | "";
  irrigation_type?: IrrigationType | "";
  primary_crops: string[];
  latitude?: number | "";
  longitude?: number | "";
  address_line?: string;
  village: string;
  mandal: string;
  district: string;
  state: string;
  pincode: string;
}

export interface FarmerDashboardSummary {
  farmer_name: string;
  email: string;
  verification_status: VerificationStatus;
  verification_notes: string | null;
  profile_completion_pct: number;
  is_profile_complete: boolean;
  missing_fields: string[];
  total_farms: number;
  total_farm_area_acres: number;
  primary_crops: string[];
  ready_for_produce: boolean;
  total_produce_listings?: number;
  active_produce_listings?: number;
}
