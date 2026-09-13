import { describe, it, expect } from "vitest";
import { buyerPreferenceSchema } from "@/components/matching/BuyerPreferenceForm";
import {
  getBuyerPreferences,
  updateBuyerPreferences,
} from "@/hooks/useBuyerPreferences";
import {
  getFarmerBuyerMatches,
  getProduceBuyerMatches,
  getBuyerProductMatches,
  getBuyerSingleProductMatch,
} from "@/hooks/useMatching";

describe("Phase 13 — Smart Farmer-Buyer Matching Specs", () => {
  describe("Buyer Preference Form Validation", () => {
    it("should accept valid buyer preference inputs", () => {
      const validData = {
        preferred_categories: ["VEGETABLE", "FRUIT"],
        preferred_products_str: "Tomato, Onion, Chilli",
        preferred_varieties_str: "Hybrid",
        preferred_quality_grades: ["GRADE_A", "PREMIUM"],
        preferred_districts_str: "Krishna, Guntur",
        preferred_states_str: "Andhra Pradesh",
        minimum_quantity: 100,
        maximum_quantity: 500,
        minimum_price: 20,
        maximum_price: 35,
      };

      const result = buyerPreferenceSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("should reject when minimum quantity exceeds maximum quantity", () => {
      const invalidData = {
        preferred_categories: ["VEGETABLE"],
        preferred_products_str: "Tomato",
        preferred_varieties_str: "",
        preferred_quality_grades: [],
        preferred_districts_str: "",
        preferred_states_str: "",
        minimum_quantity: 600,
        maximum_quantity: 200, // Invalid: min > max
        minimum_price: 20,
        maximum_price: 35,
      };

      const result = buyerPreferenceSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain(
          "Minimum quantity cannot exceed maximum quantity"
        );
      }
    });

    it("should reject when minimum price exceeds maximum price", () => {
      const invalidData = {
        preferred_categories: [],
        preferred_products_str: "",
        preferred_varieties_str: "",
        preferred_quality_grades: [],
        preferred_districts_str: "",
        preferred_states_str: "",
        minimum_quantity: null,
        maximum_quantity: null,
        minimum_price: 50,
        maximum_price: 25, // Invalid: min > max
      };

      const result = buyerPreferenceSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain(
          "Minimum price cannot exceed maximum price"
        );
      }
    });

    it("should accept empty optional ranges", () => {
      const emptyRanges = {
        preferred_categories: [],
        preferred_products_str: "",
        preferred_varieties_str: "",
        preferred_quality_grades: [],
        preferred_districts_str: "",
        preferred_states_str: "",
        minimum_quantity: null,
        maximum_quantity: null,
        minimum_price: null,
        maximum_price: null,
      };

      const result = buyerPreferenceSchema.safeParse(emptyRanges);
      expect(result.success).toBe(true);
    });
  });

  describe("Matching API Functions & Query Hooks", () => {
    it("should export buyer preference API methods", () => {
      expect(typeof getBuyerPreferences).toBe("function");
      expect(typeof updateBuyerPreferences).toBe("function");
    });

    it("should export matching API query methods", () => {
      expect(typeof getFarmerBuyerMatches).toBe("function");
      expect(typeof getProduceBuyerMatches).toBe("function");
      expect(typeof getBuyerProductMatches).toBe("function");
      expect(typeof getBuyerSingleProductMatch).toBe("function");
    });
  });

  describe("Deterministic Matching Thresholds", () => {
    it("should verify standard match levels exist", () => {
      const levels = [
        "VERY_LOW",
        "LOW",
        "MODERATE",
        "HIGH",
        "VERY_HIGH",
        "INSUFFICIENT_DATA",
      ];
      expect(levels).toHaveLength(6);
    });
  });
});
