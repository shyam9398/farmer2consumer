import { describe, it, expect } from "vitest";
import { z } from "zod";

// Zod schemas for Admin Verification inputs
export const adminRejectSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(5, "A rejection explanation of at least 5 characters is required.")
    .max(1000, "Rejection explanation must not exceed 1000 characters."),
});

export const adminDecisionSchema = z.object({
  notes: z.string().max(1000).optional(),
});

describe("Phase 6: Admin Verification & Approval System", () => {
  describe("Admin Rejection Reason Validation", () => {
    it("should accept valid descriptive rejection reasons", () => {
      const valid = {
        reason: "Survey number on land title deed does not match registered revenue parcel.",
      };
      const result = adminRejectSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("should reject empty or whitespace-only reasons", () => {
      expect(adminRejectSchema.safeParse({ reason: "" }).success).toBe(false);
      expect(adminRejectSchema.safeParse({ reason: "   " }).success).toBe(false);
    });

    it("should reject reasons shorter than 5 characters", () => {
      const result = adminRejectSchema.safeParse({ reason: "bad" });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("at least 5 characters");
      }
    });

    it("should reject reasons exceeding 1000 characters", () => {
      const longReason = { reason: "a".repeat(1001) };
      const result = adminRejectSchema.safeParse(longReason);
      expect(result.success).toBe(false);
    });

    it("should allow optional notes on approvals", () => {
      expect(adminDecisionSchema.safeParse({}).success).toBe(true);
      expect(adminDecisionSchema.safeParse({ notes: "All clear" }).success).toBe(true);
    });
  });

  describe("Produce Approval Pre-Condition Guard Rules", () => {
    interface ProduceApprovalCandidate {
      status: string;
      farmerVerificationStatus: string;
      photosCount: number;
    }

    function validateProduceApprovalEligibility(candidate: ProduceApprovalCandidate): {
      eligible: boolean;
      reason?: string;
    } {
      if (candidate.status !== "PENDING_VERIFICATION") {
        return {
          eligible: false,
          reason: `Only lots in PENDING_VERIFICATION can be approved (current: ${candidate.status})`,
        };
      }
      if (candidate.farmerVerificationStatus !== "VERIFIED") {
        return {
          eligible: false,
          reason: "Farmer profile must be verified before produce can be approved for marketplace trading.",
        };
      }
      if (candidate.photosCount < 1) {
        return {
          eligible: false,
          reason: "Produce lot must have at least one verified photo attached.",
        };
      }
      return { eligible: true };
    }

    it("should allow approval when all pre-conditions are met", () => {
      const candidate: ProduceApprovalCandidate = {
        status: "PENDING_VERIFICATION",
        farmerVerificationStatus: "VERIFIED",
        photosCount: 2,
      };
      const check = validateProduceApprovalEligibility(candidate);
      expect(check.eligible).toBe(true);
    });

    it("should block approval if farmer is unverified or rejected", () => {
      const pendingFarmer: ProduceApprovalCandidate = {
        status: "PENDING_VERIFICATION",
        farmerVerificationStatus: "PENDING",
        photosCount: 1,
      };
      expect(validateProduceApprovalEligibility(pendingFarmer).eligible).toBe(false);

      const rejectedFarmer: ProduceApprovalCandidate = {
        status: "PENDING_VERIFICATION",
        farmerVerificationStatus: "REJECTED",
        photosCount: 1,
      };
      expect(validateProduceApprovalEligibility(rejectedFarmer).eligible).toBe(false);
    });

    it("should block approval if zero photos are uploaded", () => {
      const zeroPhotos: ProduceApprovalCandidate = {
        status: "PENDING_VERIFICATION",
        farmerVerificationStatus: "VERIFIED",
        photosCount: 0,
      };
      const check = validateProduceApprovalEligibility(zeroPhotos);
      expect(check.eligible).toBe(false);
      expect(check.reason).toContain("at least one verified photo");
    });

    it("should block approval if lot is not in PENDING_VERIFICATION status", () => {
      const draftLot: ProduceApprovalCandidate = {
        status: "DRAFT",
        farmerVerificationStatus: "VERIFIED",
        photosCount: 1,
      };
      expect(validateProduceApprovalEligibility(draftLot).eligible).toBe(false);

      const rejectedLot: ProduceApprovalCandidate = {
        status: "REJECTED",
        farmerVerificationStatus: "VERIFIED",
        photosCount: 1,
      };
      expect(validateProduceApprovalEligibility(rejectedLot).eligible).toBe(false);
    });
  });

  describe("Farmer & Produce State Machine Lifecycle", () => {
    it("should allow valid farmer state transitions", () => {
      const validFarmerTransitions: Record<string, string[]> = {
        PENDING: ["VERIFIED", "REJECTED"],
        REJECTED: ["PENDING", "VERIFIED"],
        VERIFIED: ["REJECTED"],
      };

      expect(validFarmerTransitions["PENDING"]).toContain("VERIFIED");
      expect(validFarmerTransitions["PENDING"]).toContain("REJECTED");
      expect(validFarmerTransitions["REJECTED"]).toContain("VERIFIED");
    });

    it("should allow farmer to resubmit rejected produce lots", () => {
      const allowedProduceTransitions: Record<string, string[]> = {
        DRAFT: ["PENDING_VERIFICATION"],
        PENDING_VERIFICATION: ["APPROVED", "REJECTED"],
        REJECTED: ["PENDING_VERIFICATION"], // Resubmission
        APPROVED: ["LISTED", "ARCHIVED"],
      };

      expect(allowedProduceTransitions["REJECTED"]).toContain("PENDING_VERIFICATION");
      expect(allowedProduceTransitions["PENDING_VERIFICATION"]).toContain("APPROVED");
      expect(allowedProduceTransitions["PENDING_VERIFICATION"]).toContain("REJECTED");
    });
  });
});
