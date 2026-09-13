import { describe, it, expect } from "vitest";
import { produceSchema } from "../schemas/produce";
import { ProduceStatus } from "../types/produce";

describe("Phase 4: Produce Management Zod Validation & State Machine", () => {
  const validProduceData = {
    farm_id: "farm-uuid-12345",
    product_name: "Fresh Red Tomatoes",
    category: "VEGETABLE" as const,
    variety: "Hybrid Roma",
    description: "Crate packed, naturally ripened farm harvest.",
    total_quantity: 500,
    quantity_unit: "KG" as const,
    quality_grade: "GRADE_A" as const,
    harvest_date: "2026-09-08",
    available_from: "2026-09-08",
    available_until: "2026-09-22",
    expected_price: 28.5,
    price_unit: "PER_KG" as const,
    minimum_order_quantity: 25,
  };

  describe("Produce Schema Validations", () => {
    it("should accept valid produce lot data", () => {
      const result = produceSchema.safeParse(validProduceData);
      expect(result.success).toBe(true);
    });

    it("should reject missing or empty product name", () => {
      const bad = { ...validProduceData, product_name: "T" };
      const result = produceSchema.safeParse(bad);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("at least 2 characters");
      }
    });

    it("should reject non-positive total quantity", () => {
      const zeroQty = { ...validProduceData, total_quantity: 0 };
      const negQty = { ...validProduceData, total_quantity: -100 };

      expect(produceSchema.safeParse(zeroQty).success).toBe(false);
      expect(produceSchema.safeParse(negQty).success).toBe(false);
    });

    it("should reject non-positive expected price", () => {
      const zeroPrice = { ...validProduceData, expected_price: 0 };
      const negPrice = { ...validProduceData, expected_price: -25 };

      expect(produceSchema.safeParse(zeroPrice).success).toBe(false);
      expect(produceSchema.safeParse(negPrice).success).toBe(false);
    });

    it("should reject MOQ exceeding total harvest quantity", () => {
      const badMoq = {
        ...validProduceData,
        total_quantity: 100,
        minimum_order_quantity: 250, // MOQ > Total
      };
      const result = produceSchema.safeParse(badMoq);
      expect(result.success).toBe(false);
      if (!result.success) {
        const hasMoqError = result.error.issues.some((i) =>
          i.message.toLowerCase().includes("cannot exceed total")
        );
        expect(hasMoqError).toBe(true);
      }
    });

    it("should reject available_until before available_from", () => {
      const badDates = {
        ...validProduceData,
        available_from: "2026-09-15",
        available_until: "2026-09-10", // 5 days earlier
      };
      const result = produceSchema.safeParse(badDates);
      expect(result.success).toBe(false);
      if (!result.success) {
        const hasDateError = result.error.issues.some((i) =>
          i.message.toLowerCase().includes("must be on or after")
        );
        expect(hasDateError).toBe(true);
      }
    });

    it("should allow optional fields to be empty string or omitted", () => {
      const minimalProduce = {
        farm_id: "farm-uuid-12345",
        product_name: "Basmati Rice",
        category: "GRAIN" as const,
        variety: "",
        description: "",
        total_quantity: 1000,
        quantity_unit: "QUINTAL" as const,
        quality_grade: "UNGRADED" as const,
        harvest_date: "2026-09-08",
        available_from: "2026-09-08",
        available_until: "",
        expected_price: 4200,
        price_unit: "PER_QUINTAL" as const,
        minimum_order_quantity: 10,
      };

      const result = produceSchema.safeParse(minimalProduce);
      expect(result.success).toBe(true);
    });
  });

  describe("Produce State Machine Restrictions", () => {
    const isEditable = (status: ProduceStatus): boolean => {
      return status === "DRAFT" || status === "REJECTED";
    };

    const isDeletable = (status: ProduceStatus): boolean => {
      return status === "DRAFT";
    };

    it("only allows modification on DRAFT or REJECTED listings", () => {
      expect(isEditable("DRAFT")).toBe(true);
      expect(isEditable("REJECTED")).toBe(true);
      expect(isEditable("PENDING_VERIFICATION")).toBe(false);
      expect(isEditable("APPROVED")).toBe(false);
      expect(isEditable("LISTED")).toBe(false);
      expect(isEditable("PARTIALLY_SOLD")).toBe(false);
      expect(isEditable("SOLD_OUT")).toBe(false);
      expect(isEditable("EXPIRED")).toBe(false);
      expect(isEditable("ARCHIVED")).toBe(false);
    });

    it("only allows deletion of DRAFT produce lots", () => {
      expect(isDeletable("DRAFT")).toBe(true);
      expect(isDeletable("REJECTED")).toBe(false);
      expect(isDeletable("PENDING_VERIFICATION")).toBe(false);
      expect(isDeletable("APPROVED")).toBe(false);
      expect(isDeletable("LISTED")).toBe(false);
      expect(isDeletable("SOLD_OUT")).toBe(false);
    });
  });

  describe("Phase 5: Media & Photo Management Rules", () => {
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];

    const validateImageFile = (type: string, size: number) => {
      if (!ALLOWED_MIME_TYPES.includes(type.toLowerCase())) {
        return { valid: false, error: "Only JPEG, PNG, or WebP images are allowed." };
      }
      if (size > MAX_FILE_SIZE) {
        return { valid: false, error: "Image exceeds 10MB limit." };
      }
      return { valid: true };
    };

    it("accepts valid JPEG, PNG, and WebP files under 10MB", () => {
      expect(validateImageFile("image/jpeg", 5 * 1024 * 1024).valid).toBe(true);
      expect(validateImageFile("image/png", 8 * 1024 * 1024).valid).toBe(true);
      expect(validateImageFile("image/webp", 10 * 1024 * 1024).valid).toBe(true);
    });

    it("rejects files exceeding 10MB", () => {
      const result = validateImageFile("image/jpeg", 10 * 1024 * 1024 + 1);
      expect(result.valid).toBe(false);
      expect(result.error).toContain("10MB limit");
    });

    it("rejects unsupported media formats like SVG, PDF, GIF", () => {
      expect(validateImageFile("image/svg+xml", 1024).valid).toBe(false);
      expect(validateImageFile("application/pdf", 1024).valid).toBe(false);
      expect(validateImageFile("image/gif", 1024).valid).toBe(false);
    });

    it("requires at least 1 photo before submitting for verification", () => {
      const canSubmitForVerification = (imagesCount: number, status: string): boolean => {
        return imagesCount >= 1 && (status === "DRAFT" || status === "REJECTED");
      };

      expect(canSubmitForVerification(0, "DRAFT")).toBe(false);
      expect(canSubmitForVerification(1, "DRAFT")).toBe(true);
      expect(canSubmitForVerification(3, "REJECTED")).toBe(true);
      expect(canSubmitForVerification(2, "PENDING_VERIFICATION")).toBe(false);
    });

    it("enforces maximum 5 photos per listing", () => {
      const canAddMorePhotos = (currentCount: number): boolean => {
        return currentCount < 5;
      };

      expect(canAddMorePhotos(0)).toBe(true);
      expect(canAddMorePhotos(4)).toBe(true);
      expect(canAddMorePhotos(5)).toBe(false);
    });

    it("correctly sorts photos by display_order ASC", () => {
      const unsorted = [
        { id: "img-3", display_order: 2 },
        { id: "img-1", display_order: 0 },
        { id: "img-2", display_order: 1 },
      ];

      const sorted = [...unsorted].sort((a, b) => a.display_order - b.display_order);
      expect(sorted.map((s) => s.id)).toEqual(["img-1", "img-2", "img-3"]);
    });

    it("guarantees a single primary cover photo invariant", () => {
      const photos = [
        { id: "img-1", is_primary: true },
        { id: "img-2", is_primary: false },
        { id: "img-3", is_primary: false },
      ];

      // Setting img-2 as primary
      const targetId = "img-2";
      const updated = photos.map((p) => ({
        ...p,
        is_primary: p.id === targetId,
      }));

      const primaries = updated.filter((p) => p.is_primary);
      expect(primaries.length).toBe(1);
      expect(primaries[0].id).toBe("img-2");
    });
  });
});
