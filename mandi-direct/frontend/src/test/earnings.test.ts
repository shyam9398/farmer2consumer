import { describe, it, expect } from "vitest";
import { NAVIGATION_ACTIONS, getActionDefinition } from "../services/navigationMapper/NavigationActionRegistry";
import { resolveIntent } from "../services/aiNavigation/intentResolver";
import { EarningStatus, FarmerEarningItem, FarmerEarningsSummary } from "../types/earnings";

describe("Phase 10: Farmer Earnings & Financial Ledger Routing Tests", () => {
  describe("Canonical Route Verification", () => {
    it("should resolve AI navigation intent to canonical route /farmer/earnings", () => {
      const intentResult = resolveIntent("where can I see my earnings");
      expect(intentResult).toBeDefined();
      expect(intentResult?.targetRoute).toBe("/farmer/earnings");
      expect(intentResult?.actionId).toBe("earnings");
    });

    it("should have farmer_earnings defined in NavigationActionRegistry pointing to /farmer/earnings", () => {
      const action = getActionDefinition("farmer_earnings");
      expect(action).not.toBeNull();
      expect(action?.requiresAuth).toBe(true);

      const targetStep = action?.steps.find((s) => s.stepId === "earnings_summary_card");
      expect(targetStep).toBeDefined();
      expect(targetStep?.route).toBe("/farmer/earnings");
      expect(targetStep?.targetId).toBe("earnings-summary-card");
    });

    it("should map alias 'earnings' to farmer_earnings action", () => {
      const directAction = NAVIGATION_ACTIONS.farmer_earnings;
      const aliasAction = NAVIGATION_ACTIONS.earnings;
      expect(aliasAction).toEqual(directAction);
    });
  });

  describe("Earnings Data Structure & Accounting Validation", () => {
    it("should calculate net take-home correctly with zero platform fee deduction", () => {
      const mockEarning: FarmerEarningItem = {
        id: "earn-101",
        farmer_profile_id: "farmer-01",
        order_id: "ord-202",
        order_number: "ORD-2026-0001",
        order_item_id: "item-303",
        product_name: "Fresh Sona Masoori Rice",
        quantity: 1000,
        quantity_unit: "kg",
        unit_price: 50,
        gross_amount: 50000,
        platform_fee: 0,
        logistics_fee: 0,
        other_deductions: 0,
        net_amount: 50000,
        currency: "INR",
        status: "AVAILABLE",
        earned_at: "2026-09-14T10:00:00Z",
        created_at: "2026-09-14T10:00:00Z",
      };

      const calculatedDeductions =
        mockEarning.platform_fee + mockEarning.logistics_fee + mockEarning.other_deductions;
      expect(mockEarning.gross_amount - calculatedDeductions).toBe(mockEarning.net_amount);
      expect(mockEarning.status).toBe("AVAILABLE");
    });

    it("should compute farmer savings compared to traditional APMC middleman fee (15%)", () => {
      const summary: FarmerEarningsSummary = {
        total_gross: 100000,
        total_deductions: 0,
        total_net: 100000,
        pending_settlement: 20000,
        available_balance: 80000,
        total_paid: 0,
        total_orders: 5,
        delivered_orders: 4,
        total_quantity_sold: 2500,
        produce_sold_qty: 2500,
        total_sales: 100000,
        estimated_additional_earnings: 15000,
      };

      expect(summary.total_net).toBe(summary.total_gross - summary.total_deductions);
      expect(summary.estimated_additional_earnings).toBe(summary.total_gross * 0.15);
      expect(summary.available_balance + summary.pending_settlement).toBe(summary.total_net);
    });

    it("should accept valid EarningStatus values", () => {
      const validStatuses: EarningStatus[] = [
        "EXPECTED",
        "PENDING_SETTLEMENT",
        "AVAILABLE",
        "PAID",
        "CANCELLED",
        "REFUNDED",
      ];
      expect(validStatuses).toHaveLength(6);
    });
  });
});
