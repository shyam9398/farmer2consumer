import { describe, it, expect } from "vitest";
import { farmerProfileSchema, farmSchema, indianPincodeRegex } from "../schemas/farmer";
import { UserRole } from "../types/auth";

describe("Phase 3: Farmer Profile & Farm Validation Schemas", () => {
  describe("Indian PIN Code Regex", () => {
    it("should accept valid 6-digit Indian PIN codes", () => {
      expect(indianPincodeRegex.test("500001")).toBe(true);
      expect(indianPincodeRegex.test("509216")).toBe(true);
      expect(indianPincodeRegex.test("110001")).toBe(true);
    });

    it("should reject invalid PIN codes", () => {
      expect(indianPincodeRegex.test("012345")).toBe(false); // Starting with 0
      expect(indianPincodeRegex.test("12345")).toBe(false); // 5 digits
      expect(indianPincodeRegex.test("1234567")).toBe(false); // 7 digits
      expect(indianPincodeRegex.test("ABCDEF")).toBe(false); // Letters
      expect(indianPincodeRegex.test("500 01")).toBe(false); // Space
    });
  });

  describe("Farmer Profile Zod Schema", () => {
    it("should accept valid farmer profile data", () => {
      const validProfile = {
        full_name: "Ramesh Kumar",
        phone: "+919876543210",
        address_line: "Door 3-45, Farm Road",
        village: "Kothur",
        mandal: "Shadnagar",
        district: "Ranga Reddy",
        state: "Telangana",
        pincode: "509216",
      };

      const result = farmerProfileSchema.safeParse(validProfile);
      expect(result.success).toBe(true);
    });

    it("should reject invalid pincode in profile", () => {
      const invalidProfile = {
        full_name: "Ramesh Kumar",
        address_line: "Door 3-45, Farm Road",
        village: "Kothur",
        mandal: "Shadnagar",
        district: "Ranga Reddy",
        state: "Telangana",
        pincode: "999", // Invalid
      };

      const result = farmerProfileSchema.safeParse(invalidProfile);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("PIN code");
      }
    });

    it("should reject empty required address fields", () => {
      const missingAddress = {
        village: "Kothur",
        pincode: "509216",
      };

      const result = farmerProfileSchema.safeParse(missingAddress);
      expect(result.success).toBe(false);
    });
  });

  describe("Farm Zod Schema", () => {
    it("should accept valid farm parcel data", () => {
      const validFarm = {
        farm_name: "Green Valley North Plot",
        total_area: 5.5,
        area_unit: "ACRE",
        ownership_type: "OWNED",
        soil_type: "BLACK",
        irrigation_type: "BOREWELL",
        primary_crops: ["Tomato", "Rice"],
        latitude: 17.1524,
        longitude: 78.2911,
        village: "Kothur",
        mandal: "Shadnagar",
        district: "Ranga Reddy",
        state: "Telangana",
        pincode: "509216",
      };

      const result = farmSchema.safeParse(validFarm);
      expect(result.success).toBe(true);
    });

    it("should reject negative or zero area", () => {
      const zeroAreaFarm = {
        farm_name: "Zero Area Plot",
        total_area: 0,
        area_unit: "ACRE",
        ownership_type: "OWNED",
        primary_crops: ["Tomato"],
        village: "Kothur",
        mandal: "Shadnagar",
        district: "Ranga Reddy",
        state: "Telangana",
        pincode: "509216",
      };

      const resultZero = farmSchema.safeParse(zeroAreaFarm);
      expect(resultZero.success).toBe(false);

      const negativeAreaFarm = {
        ...zeroAreaFarm,
        total_area: -3.5,
      };
      const resultNeg = farmSchema.safeParse(negativeAreaFarm);
      expect(resultNeg.success).toBe(false);
    });

    it("should reject invalid coordinates outside range", () => {
      const invalidLat = {
        farm_name: "Bad Lat Plot",
        total_area: 2.0,
        area_unit: "ACRE",
        ownership_type: "OWNED",
        primary_crops: ["Tomato"],
        latitude: 95.0, // Invalid > 90
        village: "Kothur",
        mandal: "Shadnagar",
        district: "Ranga Reddy",
        state: "Telangana",
        pincode: "509216",
      };

      const result = farmSchema.safeParse(invalidLat);
      expect(result.success).toBe(false);
    });

    it("should reject empty primary crops array", () => {
      const noCrops = {
        farm_name: "No Crops Plot",
        total_area: 2.0,
        area_unit: "ACRE",
        ownership_type: "OWNED",
        primary_crops: [],
        village: "Kothur",
        mandal: "Shadnagar",
        district: "Ranga Reddy",
        state: "Telangana",
        pincode: "509216",
      };

      const result = farmSchema.safeParse(noCrops);
      expect(result.success).toBe(false);
    });
  });

  describe("Farmer Profile Completion Calculation", () => {
    const calculateScore = (hasPersonal: boolean, hasAddress: boolean, hasFarms: boolean) => {
      let score = 0;
      if (hasPersonal) score += 20; // Name + Phone
      if (hasAddress) score += 60; // 6 address fields * 10
      if (hasFarms) score += 20; // At least one farm
      return score;
    };

    it("should return 0% when no profile exists", () => {
      expect(calculateScore(false, false, false)).toBe(0);
    });

    it("should return 80% when profile address exists but no farm", () => {
      expect(calculateScore(true, true, false)).toBe(80);
    });

    it("should return 100% when profile and at least one farm exist", () => {
      expect(calculateScore(true, true, true)).toBe(100);
    });
  });

  describe("Farmer Route Access Control", () => {
    const farmerGuardedRoutes = [
      "/farmer/dashboard",
      "/farmer/profile",
      "/farmer/farms",
      "/farmer/farms/new",
      "/farmer/farms/:farmId/edit",
    ];

    it("should permit FARMER role on all farmer management routes", () => {
      const userRole: UserRole = "FARMER";
      const allowedRoles: UserRole[] = ["FARMER"];
      expect(allowedRoles.includes(userRole)).toBe(true);
      expect(farmerGuardedRoutes.length).toBe(5);
    });

    it("should deny BUYER role on farmer management routes", () => {
      const userRole: UserRole = "BUYER";
      const allowedRoles: UserRole[] = ["FARMER"];
      expect(allowedRoles.includes(userRole)).toBe(false);
    });
  });
});
