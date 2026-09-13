import { z } from "zod";

export const indianPincodeRegex = /^[1-9][0-9]{5}$/;

export const farmerProfileSchema = z.object({
  full_name: z
    .string()
    .min(2, "Full name must be at least 2 characters")
    .max(150, "Full name cannot exceed 150 characters")
    .optional(),
  phone: z
    .string()
    .min(10, "Phone number must be at least 10 digits")
    .max(15, "Phone number cannot exceed 15 digits")
    .optional()
    .or(z.literal("")),
  date_of_birth: z.string().optional().or(z.literal("")),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]).optional().or(z.literal("")),
  address_line: z
    .string()
    .min(3, "Address line must be at least 3 characters")
    .max(500, "Address cannot exceed 500 characters"),
  village: z
    .string()
    .min(2, "Village name must be at least 2 characters")
    .max(100, "Village name cannot exceed 100 characters"),
  mandal: z
    .string()
    .min(2, "Mandal/Tehsil must be at least 2 characters")
    .max(100, "Mandal cannot exceed 100 characters"),
  district: z
    .string()
    .min(2, "District must be at least 2 characters")
    .max(100, "District cannot exceed 100 characters"),
  state: z
    .string()
    .min(2, "State must be at least 2 characters")
    .max(100, "State cannot exceed 100 characters"),
  pincode: z
    .string()
    .regex(indianPincodeRegex, "Pincode must be a valid 6-digit Indian PIN code (e.g. 500001)"),
});

export type FarmerProfileFormValues = z.infer<typeof farmerProfileSchema>;

export const farmSchema = z.object({
  farm_name: z
    .string()
    .min(2, "Farm name must be at least 2 characters")
    .max(150, "Farm name cannot exceed 150 characters"),
  total_area: z.coerce
    .number({ invalid_type_error: "Area must be a number" })
    .positive("Farm area must be greater than zero"),
  area_unit: z.enum(["ACRE", "HECTARE"], {
    required_error: "Please select an area unit",
  }),
  ownership_type: z.enum(["OWNED", "LEASED", "FAMILY", "OTHER"], {
    required_error: "Please select an ownership type",
  }),
  soil_type: z
    .enum(["RED", "BLACK", "ALLUVIAL", "LOAMY", "SANDY", "CLAY", "OTHER"])
    .optional()
    .or(z.literal("")),
  irrigation_type: z
    .enum(["RAINFED", "BOREWELL", "CANAL", "DRIP", "SPRINKLER", "OTHER"])
    .optional()
    .or(z.literal("")),
  primary_crops: z
    .array(z.string())
    .min(1, "Please select or add at least one primary crop"),
  latitude: z.coerce
    .number()
    .min(-90, "Latitude must be between -90 and 90")
    .max(90, "Latitude must be between -90 and 90")
    .optional()
    .or(z.literal("")),
  longitude: z.coerce
    .number()
    .min(-180, "Longitude must be between -180 and 180")
    .max(180, "Longitude must be between -180 and 180")
    .optional()
    .or(z.literal("")),
  address_line: z.string().max(500).optional().or(z.literal("")),
  village: z
    .string()
    .min(2, "Village name must be at least 2 characters")
    .max(100),
  mandal: z
    .string()
    .min(2, "Mandal must be at least 2 characters")
    .max(100),
  district: z
    .string()
    .min(2, "District must be at least 2 characters")
    .max(100),
  state: z
    .string()
    .min(2, "State must be at least 2 characters")
    .max(100),
  pincode: z
    .string()
    .regex(indianPincodeRegex, "Pincode must be a valid 6-digit Indian PIN code (e.g. 500001)"),
});

export type FarmFormValues = z.infer<typeof farmSchema>;
