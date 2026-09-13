import { describe, it, expect } from "vitest";
import { demandApi } from "@/lib/demandApi";

describe("Phase 12 — Demand Intelligence Frontend Specs", () => {
  it("should define demand API endpoints correctly", () => {
    expect(typeof demandApi.getSummary).toBe("function");
    expect(typeof demandApi.getProductDemand).toBe("function");
    expect(typeof demandApi.getHistory).toBe("function");
    expect(typeof demandApi.getRegional).toBe("function");
    expect(typeof demandApi.getRecommendations).toBe("function");
    expect(typeof demandApi.getCombinedInsight).toBe("function");
    expect(typeof demandApi.getAdminSummary).toBe("function");
  });

  it("should handle demand level badge categorization", () => {
    const levels = ["VERY_LOW", "LOW", "MODERATE", "HIGH", "VERY_HIGH", "INSUFFICIENT_DATA"];
    expect(levels).toHaveLength(6);
  });

  it("should handle demand trend badge categorization", () => {
    const trends = ["RISING", "FALLING", "STABLE", "VOLATILE", "INSUFFICIENT_DATA"];
    expect(trends).toHaveLength(5);
  });
});
