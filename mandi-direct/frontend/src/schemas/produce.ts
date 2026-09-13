import { z } from "zod";

export const produceSchema = z
  .object({
    farm_id: z.string().min(1, "Please select the farm parcel where this produce was grown"),
    product_name: z
      .string()
      .min(2, "Product name must be at least 2 characters")
      .max(150, "Product name cannot exceed 150 characters"),
    category: z.enum(
      ["VEGETABLE", "FRUIT", "GRAIN", "PULSE", "SPICE", "OILSEED", "OTHER"],
      { required_error: "Please select a crop category" }
    ),
    variety: z.string().max(100, "Variety cannot exceed 100 characters").optional().or(z.literal("")),
    description: z
      .string()
      .max(2000, "Description cannot exceed 2000 characters")
      .optional()
      .or(z.literal("")),
    total_quantity: z.coerce
      .number({ invalid_type_error: "Total quantity must be a valid number" })
      .positive("Total harvest quantity must be greater than zero"),
    quantity_unit: z.enum(["KG", "QUINTAL", "TON"], {
      required_error: "Please select a quantity unit",
    }),
    quality_grade: z.enum(
      ["PREMIUM", "GRADE_A", "GRADE_B", "GRADE_C", "UNGRADED"],
      { required_error: "Please select quality grade" }
    ),
    harvest_date: z.string().min(1, "Harvest date is required"),
    available_from: z.string().min(1, "Available from date is required"),
    available_until: z.string().optional().or(z.literal("")),
    expected_price: z.coerce
      .number({ invalid_type_error: "Expected price must be a valid number" })
      .positive("Expected price must be greater than zero"),
    price_unit: z.enum(["PER_KG", "PER_QUINTAL", "PER_TON"], {
      required_error: "Please select a price unit",
    }),
    minimum_order_quantity: z.coerce
      .number({ invalid_type_error: "Minimum order quantity must be a valid number" })
      .positive("Minimum order quantity must be greater than zero"),
  })
  .refine(
    (data) => {
      if (data.minimum_order_quantity && data.total_quantity) {
        return data.minimum_order_quantity <= data.total_quantity;
      }
      return true;
    },
    {
      message: "Minimum order quantity cannot exceed total harvest volume",
      path: ["minimum_order_quantity"],
    }
  )
  .refine(
    (data) => {
      if (data.available_from && data.available_until) {
        return new Date(data.available_until) >= new Date(data.available_from);
      }
      return true;
    },
    {
      message: "Available until date must be on or after available from date",
      path: ["available_until"],
    }
  );

export type ProduceFormValues = z.infer<typeof produceSchema>;
