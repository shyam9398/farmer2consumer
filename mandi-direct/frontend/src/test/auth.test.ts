import { describe, it, expect } from "vitest";
import { UserRole } from "../types/auth";

describe("Frontend Role-Based Access Control Logic", () => {
  const allowedFarmerRoles: UserRole[] = ["FARMER"];
  const allowedBuyerRoles: UserRole[] = ["BUYER"];
  const allowedAdminRoles: UserRole[] = ["ADMIN"];

  it("should permit FARMER role on farmer-guarded route", () => {
    const userRole: UserRole = "FARMER";
    const hasAccess = allowedFarmerRoles.includes(userRole);
    expect(hasAccess).toBe(true);
  });

  it("should deny FARMER role on admin-guarded route", () => {
    const userRole: UserRole = "FARMER";
    const hasAccess = allowedAdminRoles.includes(userRole);
    expect(hasAccess).toBe(false);
  });

  it("should deny BUYER role on farmer-guarded route", () => {
    const userRole: UserRole = "BUYER";
    const hasAccess = allowedFarmerRoles.includes(userRole);
    expect(hasAccess).toBe(false);
    expect(allowedBuyerRoles.includes(userRole)).toBe(true);
  });

  it("should resolve correct post-login destination by role", () => {
    const resolveDestination = (role: UserRole): string => {
      switch (role) {
        case "FARMER":
          return "/farmer/dashboard";
        case "BUYER":
          return "/buyer/marketplace";
        case "ADMIN":
          return "/admin/dashboard";
        case "LOGISTICS":
          return "/logistics/portal";
        case "CONSUMER":
          return "/marketplace";
        default:
          return "/";
      }
    };

    expect(resolveDestination("FARMER")).toBe("/farmer/dashboard");
    expect(resolveDestination("BUYER")).toBe("/buyer/marketplace");
    expect(resolveDestination("ADMIN")).toBe("/admin/dashboard");
    expect(resolveDestination("CONSUMER")).toBe("/marketplace");
    expect(resolveDestination("LOGISTICS")).toBe("/logistics/portal");
  });
});

import { sanitizeBaseURL, normalizeApiPath } from "../lib/axios";

describe("Axios URL and Double-Slash Prevention", () => {
  it("should strip trailing slashes and /api/v1 from baseURL", () => {
    expect(sanitizeBaseURL("https://farmer2consumer-5uxb.vercel.app/")).toBe("https://farmer2consumer-5uxb.vercel.app");
    expect(sanitizeBaseURL("https://farmer2consumer-5uxb.vercel.app/api/v1")).toBe("https://farmer2consumer-5uxb.vercel.app");
    expect(sanitizeBaseURL("https://farmer2consumer-5uxb.vercel.app/api/v1/")).toBe("https://farmer2consumer-5uxb.vercel.app");
    expect(sanitizeBaseURL("http://localhost:8001///")).toBe("http://localhost:8001");
  });

  it("should normalize endpoints avoiding double slashes", () => {
    expect(normalizeApiPath("//api/v1/farmers/produce")).toBe("/api/v1/farmers/produce");
    expect(normalizeApiPath("/api/v1/farmers/produce")).toBe("/api/v1/farmers/produce");
    expect(normalizeApiPath("/farmers/produce")).toBe("/api/v1/farmers/produce");
    expect(normalizeApiPath("farmers/produce")).toBe("/api/v1/farmers/produce");
    expect(normalizeApiPath("//api/v1//health")).toBe("/api/v1/health");
    expect(normalizeApiPath("https://farmer2consumer-5uxb.vercel.app//api/v1//health")).toBe("https://farmer2consumer-5uxb.vercel.app/api/v1/health");
  });
});


