import { z } from "zod";

export const buyerAddressSchema = z.object({
  full_name: z
    .string()
    .trim()
    .min(2, "Full name must be at least 2 characters")
    .max(150, "Full name cannot exceed 150 characters"),
  phone: z
    .string()
    .trim()
    .regex(
      /^(\+91)?[6-9]\d{9}$/,
      "Must be a valid 10-digit Indian mobile number (e.g. 9876543210 or +919876543210)"
    ),
  address_line1: z
    .string()
    .trim()
    .min(5, "Address must be at least 5 characters")
    .max(500, "Address cannot exceed 500 characters"),
  address_line2: z.string().trim().max(500).optional().or(z.literal("")),
  village: z.string().trim().max(100).optional().or(z.literal("")),
  mandal: z.string().trim().max(100).optional().or(z.literal("")),
  district: z
    .string()
    .trim()
    .min(2, "District is required")
    .max(100),
  state: z
    .string()
    .trim()
    .min(2, "State is required")
    .max(100),
  pincode: z
    .string()
    .trim()
    .regex(/^[1-9][0-9]{5}$/, "Pincode must be a valid 6-digit Indian PIN code"),
  landmark: z.string().trim().max(150).optional().or(z.literal("")),
  is_default: z.boolean().default(false),
});

export type BuyerAddressFormValues = z.infer<typeof buyerAddressSchema>;
