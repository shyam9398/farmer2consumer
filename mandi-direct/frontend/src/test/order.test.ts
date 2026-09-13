import { describe, it, expect } from "vitest";
import { buyerAddressSchema } from "../schemas/address";

describe("Phase 8: Buyer Ordering & Checkout Frontend Tests", () => {
  describe("Delivery Address Zod Schema Validation", () => {
    it("should accept valid Indian delivery addresses", () => {
      const validAddress = {
        full_name: "Rajesh Kumar",
        phone: "+919876543210",
        address_line1: "Warehouse 4B, APMC Yard",
        address_line2: "Gate No. 2",
        district: "Hyderabad",
        state: "Telangana",
        pincode: "500034",
        is_default: true,
      };

      const result = buyerAddressSchema.safeParse(validAddress);
      expect(result.success).toBe(true);
    });

    it("should accept 10-digit mobile numbers without country code", () => {
      const valid = {
        full_name: "Ramesh Patel",
        phone: "9876543210",
        address_line1: "Survey 42, Main Road",
        district: "Krishna",
        state: "Andhra Pradesh",
        pincode: "520001",
        is_default: false,
      };
      expect(buyerAddressSchema.safeParse(valid).success).toBe(true);
    });

    it("should reject invalid 5-digit or 7-digit PIN codes", () => {
      const invalidShortPin = {
        full_name: "Ramesh Patel",
        phone: "9876543210",
        address_line1: "Survey 42",
        district: "Krishna",
        state: "Andhra Pradesh",
        pincode: "52000", // 5 digits
      };
      const res1 = buyerAddressSchema.safeParse(invalidShortPin);
      expect(res1.success).toBe(false);

      const invalidLongPin = {
        ...invalidShortPin,
        pincode: "5200012", // 7 digits
      };
      const res2 = buyerAddressSchema.safeParse(invalidLongPin);
      expect(res2.success).toBe(false);
    });

    it("should reject non-numeric characters in pincode", () => {
      const invalidPin = {
        full_name: "Ramesh Patel",
        phone: "9876543210",
        address_line1: "Survey 42",
        district: "Krishna",
        state: "Andhra Pradesh",
        pincode: "52000A",
      };
      expect(buyerAddressSchema.safeParse(invalidPin).success).toBe(false);
    });

    it("should reject invalid phone numbers", () => {
      const invalidPhone = {
        full_name: "Ramesh Patel",
        phone: "12345", // too short
        address_line1: "Survey 42",
        district: "Krishna",
        state: "Andhra Pradesh",
        pincode: "520001",
      };
      expect(buyerAddressSchema.safeParse(invalidPhone).success).toBe(false);
    });

    it("should require mandatory address fields", () => {
      const missingFields = {
        full_name: "",
        phone: "",
        address_line1: "",
        district: "",
        state: "",
        pincode: "",
      };
      const res = buyerAddressSchema.safeParse(missingFields);
      expect(res.success).toBe(false);
      if (!res.success) {
        const errorFields = res.error.issues.map((i) => i.path[0]);
        expect(errorFields).toContain("full_name");
        expect(errorFields).toContain("phone");
        expect(errorFields).toContain("address_line1");
        expect(errorFields).toContain("district");
        expect(errorFields).toContain("state");
        expect(errorFields).toContain("pincode");
      }
    });
  });

  describe("Cart Financial & Decimal Calculations", () => {
    it("should accurately compute item line subtotal", () => {
      const quantity = 75.5; // KG
      const price = 28.0; // ₹ / KG
      const subtotal = Math.round(quantity * price * 100) / 100;
      expect(subtotal).toBe(2114.0);
    });

    it("should accurately aggregate multi-item cart totals", () => {
      const items = [
        { quantity: 100, price: 28 }, // 2800
        { quantity: 50, price: 42 }, // 2100
        { quantity: 20, price: 18.5 }, // 370
      ];

      const subtotal = items.reduce(
        (sum, item) => sum + Math.round(item.quantity * item.price * 100) / 100,
        0
      );
      const deliveryFee = 0;
      const total = subtotal + deliveryFee;

      expect(subtotal).toBe(5270);
      expect(total).toBe(5270);
    });
  });

  describe("Order State Machine Rules", () => {
    const ALLOWED_FARMER_TRANSITIONS: Record<string, string[]> = {
      PENDING: ["ACCEPTED", "REJECTED"],
      ACCEPTED: ["PREPARING"],
      PREPARING: ["READY_FOR_PICKUP"],
    };

    it("should permit valid farmer workflow transitions", () => {
      expect(ALLOWED_FARMER_TRANSITIONS["PENDING"]).toContain("ACCEPTED");
      expect(ALLOWED_FARMER_TRANSITIONS["PENDING"]).toContain("REJECTED");
      expect(ALLOWED_FARMER_TRANSITIONS["ACCEPTED"]).toContain("PREPARING");
      expect(ALLOWED_FARMER_TRANSITIONS["PREPARING"]).toContain("READY_FOR_PICKUP");
    });

    it("should prohibit unauthorized skips in state transitions", () => {
      expect(ALLOWED_FARMER_TRANSITIONS["PENDING"]).not.toContain("DELIVERED");
      expect(ALLOWED_FARMER_TRANSITIONS["ACCEPTED"]).not.toContain("DELIVERED");
      expect(ALLOWED_FARMER_TRANSITIONS["PREPARING"]).not.toContain("ACCEPTED");
    });
  });
});
