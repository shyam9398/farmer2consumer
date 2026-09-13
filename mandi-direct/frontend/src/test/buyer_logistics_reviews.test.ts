import { describe, it, expect, beforeEach, vi } from "vitest";
import { apiClient } from "@/lib/axios";

describe("Buyer Decision Helper & Logistics Tests", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("should query decision helper with filters and return scored items", async () => {
    const mockResponse = {
      data: {
        query: "fresh tomatoes under 40",
        total_matches: 2,
        recommendations: [
          {
            produce_id: "prod-1",
            product_name: "Fresh Red Tomatoes",
            category: "VEGETABLE",
            variety: "Hybrid",
            quality_grade: "GRADE_A",
            price: 32.0,
            price_unit: "PER_KG",
            available_quantity: 500,
            quantity_unit: "KG",
            farmer_id: "farmer-1",
            farmer_name: "Suresh Rao",
            farmer_rating: 4.8,
            farmer_total_reviews: 14,
            district: "Guntur",
            state: "Andhra Pradesh",
            distance_km: 12.5,
            match_score: 91.2,
            explanation: "High quality Grade A crop within 12.5 km with fair price.",
          },
        ],
        parsed_intent: {
          crop_name: "tomato",
          max_price: 40.0,
        },
      },
    };

    const postSpy = vi.spyOn(apiClient, "post").mockResolvedValue(mockResponse);

    const res = await apiClient.post("/marketplace/decision-helper", {
      query: "fresh tomatoes under 40",
      buyer_lat: 16.5,
      buyer_lon: 80.6,
      max_results: 5,
    });

    expect(postSpy).toHaveBeenCalledWith("/marketplace/decision-helper", {
      query: "fresh tomatoes under 40",
      buyer_lat: 16.5,
      buyer_lon: 80.6,
      max_results: 5,
    });

    expect(res.data.total_matches).toBe(2);
    expect(res.data.recommendations[0].product_name).toBe("Fresh Red Tomatoes");
    expect(res.data.recommendations[0].farmer_rating).toBe(4.8);
    expect(res.data.recommendations[0].distance_km).toBe(12.5);
  });

  it("should fetch vehicles and manage fleet status", async () => {
    const mockVehicles = {
      data: {
        vehicles: [
          {
            id: "veh-1",
            vehicle_number: "AP29TB4492",
            vehicle_type: "TEMPO_407",
            capacity_kg: 2500,
            driver_name: "Ramesh Kumar",
            driver_phone: "9876543210",
            is_refrigerated: false,
            status: "AVAILABLE",
          },
          {
            id: "veh-2",
            vehicle_number: "AP29RF9000",
            vehicle_type: "REEFER_TRUCK",
            capacity_kg: 5000,
            driver_name: "Venkat Rao",
            driver_phone: "9876543211",
            is_refrigerated: true,
            status: "ON_DELIVERY",
          },
        ],
        total: 2,
      },
    };

    const getSpy = vi.spyOn(apiClient, "get").mockResolvedValue(mockResponseVehicles(mockVehicles));

    const res = await apiClient.get("/logistics/vehicles");
    expect(getSpy).toHaveBeenCalledWith("/logistics/vehicles");
    expect(res.data.vehicles.length).toBe(2);
    expect(res.data.vehicles[0].vehicle_number).toBe("AP29TB4492");
    expect(res.data.vehicles[1].is_refrigerated).toBe(true);
  });

  it("should book logistics for an order", async () => {
    const mockBooking = {
      data: {
        booking_status: "PENDING_CONFIRMATION",
        order_id: "order-123",
        message: "Logistics booking submitted successfully",
      },
    };

    const postSpy = vi.spyOn(apiClient, "post").mockResolvedValue(mockBooking);

    const res = await apiClient.post("/orders/order-123/book-logistics");
    expect(postSpy).toHaveBeenCalledWith("/orders/order-123/book-logistics");
    expect(res.data.booking_status).toBe("PENDING_CONFIRMATION");
  });

  it("should update logistics milestone status and broadcast GPS", async () => {
    const mockMilestone = {
      data: {
        order_id: "order-123",
        booking_status: "OUT_FOR_DELIVERY",
      },
    };
    const postSpy = vi.spyOn(apiClient, "post").mockResolvedValue(mockMilestone);

    const res = await apiClient.post("/logistics/bookings/order-123/status", {
      status: "OUT_FOR_DELIVERY",
    });

    expect(postSpy).toHaveBeenCalledWith("/logistics/bookings/order-123/status", {
      status: "OUT_FOR_DELIVERY",
    });
    expect(res.data.booking_status).toBe("OUT_FOR_DELIVERY");

    // Location broadcast
    const mockLoc = {
      data: {
        order_id: "order-123",
        latitude: 16.5123,
        longitude: 80.6456,
      },
    };
    postSpy.mockResolvedValueOnce(mockLoc);

    const locRes = await apiClient.post("/logistics/bookings/order-123/location", {
      latitude: 16.5123,
      longitude: 80.6456,
    });
    expect(locRes.data.latitude).toBe(16.5123);
  });

  it("should submit a verified review and fetch farmer rating summary", async () => {
    const mockReviewRes = {
      data: {
        id: "rev-1",
        order_id: "order-123",
        order_item_id: "item-456",
        rating: 5,
        comment: "Excellent fresh tomatoes straight from farm!",
      },
    };

    const postSpy = vi.spyOn(apiClient, "post").mockResolvedValue(mockReviewRes);

    const res = await apiClient.post("/orders/order-123/items/item-456/review", {
      rating: 5,
      comment: "Excellent fresh tomatoes straight from farm!",
    });

    expect(postSpy).toHaveBeenCalledWith("/orders/order-123/items/item-456/review", {
      rating: 5,
      comment: "Excellent fresh tomatoes straight from farm!",
    });
    expect(res.data.rating).toBe(5);

    // Fetch summary
    const mockSummary = {
      data: {
        farmer_profile_id: "farmer-1",
        average_rating: 4.8,
        total_reviews: 5,
        rating_distribution: { "5": 4, "4": 1, "3": 0, "2": 0, "1": 0 },
        reviews: [
          {
            id: "rev-1",
            order_id: "order-123",
            rating: 5,
            comment: "Excellent fresh tomatoes straight from farm!",
            created_at: "2026-09-12T10:00:00Z",
            buyer_masked_name: "Ramesh K.",
          },
        ],
      },
    };

    const getSpy = vi.spyOn(apiClient, "get").mockResolvedValue(mockSummary);
    const summaryRes = await apiClient.get("/farmers/farmer-1/reviews");

    expect(getSpy).toHaveBeenCalledWith("/farmers/farmer-1/reviews");
    expect(summaryRes.data.average_rating).toBe(4.8);
    expect(summaryRes.data.reviews[0].buyer_masked_name).toBe("Ramesh K.");
  });
});

function mockResponseVehicles(mock: any) {
  return mock;
}
