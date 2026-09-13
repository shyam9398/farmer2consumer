import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/axios";
import {
  MarketplaceFilters,
  MarketplaceListResponse,
  MarketplaceProductDetails,
  MarketplaceProduct,
} from "@/types/marketplace";

export const MARKETPLACE_KEYS = {
  all: ["marketplace"] as const,
  products: (filters?: MarketplaceFilters) => ["marketplace", "products", filters] as const,
  product: (produceId: string) => ["marketplace", "product", produceId] as const,
};

export const DEFAULT_DEMO_PRODUCTS: MarketplaceProduct[] = [
  {
    id: "demo-tomato-1",
    product_name: "Hybrid Red Tomatoes",
    category: "VEGETABLE",
    variety: "Shimla Hybrid F1",
    description: "Farm-fresh ripe tomatoes harvested this morning. Firm texture, vibrant deep red color, zero pesticide residue.",
    total_quantity: 1500,
    available_quantity: 1300,
    quantity_unit: "KG",
    quality_grade: "GRADE_A",
    price: 24,
    expected_price: 24,
    price_unit: "PER_KG",
    harvest_date: "2026-09-12",
    available_from: "2026-09-13",
    minimum_order_quantity: 1,
    status: "LISTED",
    image_count: 1,
    primary_image_url: "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=600&q=80",
    farmer: { id: "farmer-1", name: "Ramesh Patel", is_verified: true, verification_status: "VERIFIED" },
    location: { village: "Shamshabad", mandal: "Shamshabad", district: "Ranga Reddy", state: "Telangana" },
  },
  {
    id: "demo-potato-2",
    product_name: "Kufri Jyoti Potatoes",
    category: "VEGETABLE",
    variety: "Kufri Jyoti",
    description: "Premium uniform-sized potatoes grown in sandy loam soil. High storage stability and excellent culinary taste.",
    total_quantity: 3000,
    available_quantity: 3000,
    quantity_unit: "KG",
    quality_grade: "GRADE_A",
    price: 18,
    expected_price: 18,
    price_unit: "PER_KG",
    harvest_date: "2026-09-11",
    available_from: "2026-09-13",
    minimum_order_quantity: 5,
    status: "LISTED",
    image_count: 1,
    primary_image_url: "https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=600&q=80",
    farmer: { id: "farmer-1", name: "Ramesh Patel", is_verified: true, verification_status: "VERIFIED" },
    location: { village: "Shamshabad", mandal: "Shamshabad", district: "Ranga Reddy", state: "Telangana" },
  },
  {
    id: "demo-chilli-3",
    product_name: "Guntur Sannam Red Chillies",
    category: "SPICE",
    variety: "S17 Sannam",
    description: "Authentic sun-dried pungent red chillies directly from the farm gates. High capsaicin content and natural dark crimson color.",
    total_quantity: 800,
    available_quantity: 750,
    quantity_unit: "KG",
    quality_grade: "PREMIUM",
    price: 185,
    expected_price: 185,
    price_unit: "PER_KG",
    harvest_date: "2026-09-08",
    available_from: "2026-09-12",
    minimum_order_quantity: 2,
    status: "LISTED",
    image_count: 1,
    primary_image_url: "https://images.unsplash.com/photo-1588252303782-cb80119abd6d?auto=format&fit=crop&w=600&q=80",
    farmer: { id: "farmer-1", name: "Ramesh Patel", is_verified: true, verification_status: "VERIFIED" },
    location: { village: "Shamshabad", mandal: "Shamshabad", district: "Ranga Reddy", state: "Telangana" },
  },
  {
    id: "demo-rice-4",
    product_name: "Sona Masoori Raw Rice",
    category: "GRAIN",
    variety: "BPT 5204",
    description: "Aged medium-grain fragrant Sona Masoori paddy milled freshly. Low starch, non-sticky texture, popular kitchen staple.",
    total_quantity: 5000,
    available_quantity: 4500,
    quantity_unit: "KG",
    quality_grade: "GRADE_A",
    price: 48,
    expected_price: 48,
    price_unit: "PER_KG",
    harvest_date: "2026-09-01",
    available_from: "2026-09-10",
    minimum_order_quantity: 10,
    status: "LISTED",
    image_count: 1,
    primary_image_url: "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=600&q=80",
    farmer: { id: "farmer-1", name: "Ramesh Patel", is_verified: true, verification_status: "VERIFIED" },
    location: { village: "Shamshabad", mandal: "Shamshabad", district: "Ranga Reddy", state: "Telangana" },
  },
  {
    id: "demo-mango-5",
    product_name: "Fresh Banganapalle Mangoes",
    category: "FRUIT",
    variety: "Banganapalle",
    description: "Naturally orchard-ripened royal Banganapalle sweet mangoes. Fiberless golden pulp with rich honey aroma.",
    total_quantity: 1200,
    available_quantity: 1185,
    quantity_unit: "KG",
    quality_grade: "PREMIUM",
    price: 95,
    expected_price: 95,
    price_unit: "PER_KG",
    harvest_date: "2026-09-12",
    available_from: "2026-09-13",
    minimum_order_quantity: 5,
    status: "LISTED",
    image_count: 1,
    primary_image_url: "https://images.unsplash.com/photo-1553279768-865429fa0078?auto=format&fit=crop&w=600&q=80",
    farmer: { id: "farmer-1", name: "Ramesh Patel", is_verified: true, verification_status: "VERIFIED" },
    location: { village: "Shamshabad", mandal: "Shamshabad", district: "Ranga Reddy", state: "Telangana" },
  },
  {
    id: "demo-turmeric-6",
    product_name: "Organic Turmeric Rhizomes",
    category: "SPICE",
    variety: "Salem Erode",
    description: "High-curcumin organic cured turmeric fingers. Rich bright golden powder yield with certified zero chemical additives.",
    total_quantity: 600,
    available_quantity: 600,
    quantity_unit: "KG",
    quality_grade: "GRADE_A",
    price: 110,
    expected_price: 110,
    price_unit: "PER_KG",
    harvest_date: "2026-09-07",
    available_from: "2026-09-12",
    minimum_order_quantity: 5,
    status: "LISTED",
    image_count: 1,
    primary_image_url: "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&w=600&q=80",
    farmer: { id: "farmer-1", name: "Ramesh Patel", is_verified: true, verification_status: "VERIFIED" },
    location: { village: "Shamshabad", mandal: "Shamshabad", district: "Ranga Reddy", state: "Telangana" },
  },
  {
    id: "demo-onion-7",
    product_name: "Nashik Red Onions",
    category: "VEGETABLE",
    variety: "Garwa Late Kharif",
    description: "Crisp, pungent red onions with tight outer layers. Hand-sorted and graded at farm gate for long transit resilience.",
    total_quantity: 2500,
    available_quantity: 2500,
    quantity_unit: "KG",
    quality_grade: "GRADE_A",
    price: 28,
    expected_price: 28,
    price_unit: "PER_KG",
    harvest_date: "2026-09-10",
    available_from: "2026-09-12",
    minimum_order_quantity: 5,
    status: "LISTED",
    image_count: 1,
    primary_image_url: "https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?auto=format&fit=crop&w=600&q=80",
    farmer: { id: "farmer-1", name: "Ramesh Patel", is_verified: true, verification_status: "VERIFIED" },
    location: { village: "Shamshabad", mandal: "Shamshabad", district: "Ranga Reddy", state: "Telangana" },
  },
  {
    id: "demo-moong-8",
    product_name: "Green Moong Dal",
    category: "PULSE",
    variety: "Pusa Vishal Whole",
    description: "Unpolished green gram pulses direct from rainfed Telangana harvest. Rich in protein and essential minerals.",
    total_quantity: 1000,
    available_quantity: 1000,
    quantity_unit: "KG",
    quality_grade: "GRADE_A",
    price: 92,
    expected_price: 92,
    price_unit: "PER_KG",
    harvest_date: "2026-09-05",
    available_from: "2026-09-11",
    minimum_order_quantity: 5,
    status: "LISTED",
    image_count: 1,
    primary_image_url: "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=600&q=80",
    farmer: { id: "farmer-1", name: "Ramesh Patel", is_verified: true, verification_status: "VERIFIED" },
    location: { village: "Shamshabad", mandal: "Shamshabad", district: "Ranga Reddy", state: "Telangana" },
  },
];

// -----------------------------------------------------------------------------
// Typed Axios API Layer (Single API Client)
// -----------------------------------------------------------------------------

export const getMarketplaceProducts = async (
  filters?: MarketplaceFilters
): Promise<MarketplaceListResponse> => {
  const params = new URLSearchParams();
  if (filters?.search && filters.search.trim()) {
    params.append("search", filters.search.trim());
  }
  if (filters?.category && filters.category !== "ALL") {
    params.append("category", filters.category);
  }
  if (filters?.quality_grade && filters.quality_grade !== "ALL") {
    params.append("quality_grade", filters.quality_grade);
  }
  if (filters?.farm_id) params.append("farm_id", filters.farm_id);
  if (filters?.district && filters.district.trim()) {
    params.append("district", filters.district.trim());
  }
  if (filters?.mandal && filters.mandal.trim()) {
    params.append("mandal", filters.mandal.trim());
  }
  if (filters?.village && filters.village.trim()) {
    params.append("village", filters.village.trim());
  }
  if (filters?.state && filters.state.trim()) {
    params.append("state", filters.state.trim());
  }
  if (filters?.min_price !== undefined && filters.min_price > 0) {
    params.append("min_price", String(filters.min_price));
  }
  if (filters?.max_price !== undefined && filters.max_price > 0) {
    params.append("max_price", String(filters.max_price));
  }
  if (filters?.min_quantity !== undefined && filters.min_quantity > 0) {
    params.append("min_quantity", String(filters.min_quantity));
  }
  if (filters?.sort && filters.sort !== "recommended") {
    params.append("sort", filters.sort);
  }
  if (filters?.page) params.append("page", String(filters.page));
  if (filters?.page_size) params.append("page_size", String(filters.page_size));

  const queryString = params.toString();
  const url = queryString ? `/api/v1/marketplace/products?${queryString}` : "/api/v1/marketplace/products";
  let items: any[] = [];
  let total = 0;
  let totalPages = 1;

  try {
    const res = await apiClient.get<MarketplaceListResponse>(url);
    items = res.data?.items || [];
    total = res.data?.total || items.length;
    totalPages = res.data?.total_pages || 1;
  } catch (err) {
    console.warn("Backend marketplace query:", err);
  }

  // Merge any farmer listings from localStorage / Supabase to ensure immediate reflection
  try {
    const raw = localStorage.getItem("mandi_custom_listings");
    if (raw) {
      const customListings = JSON.parse(raw);
      if (Array.isArray(customListings)) {
        for (const custom of customListings) {
          if (!items.some((it) => it.id === custom.id)) {
            items.unshift(custom);
            total += 1;
          }
        }
      }
    }
  } catch {
    // ignore
  }

  // If backend returns empty (or is starting up), use comprehensive verified demo produce data
  if (items.length === 0) {
    let filtered = [...DEFAULT_DEMO_PRODUCTS];
    if (filters?.category && filters.category !== "ALL") {
      filtered = filtered.filter((p) => p.category === filters.category);
    }
    if (filters?.search && filters.search.trim()) {
      const q = filters.search.trim().toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.product_name.toLowerCase().includes(q) ||
          (p.variety && p.variety.toLowerCase().includes(q)) ||
          p.location.district.toLowerCase().includes(q) ||
          p.location.village.toLowerCase().includes(q) ||
          p.farmer.name.toLowerCase().includes(q)
      );
    }
    if (filters?.district && filters.district.trim()) {
      const d = filters.district.trim().toLowerCase();
      filtered = filtered.filter((p) => p.location.district.toLowerCase().includes(d));
    }
    if (filters?.min_price !== undefined && filters.min_price > 0) {
      filtered = filtered.filter((p) => p.price >= filters.min_price!);
    }
    if (filters?.max_price !== undefined && filters.max_price > 0) {
      filtered = filtered.filter((p) => p.price <= filters.max_price!);
    }
    items = filtered;
    total = filtered.length;
    totalPages = 1;
  }

  return {
    items,
    total,
    page: filters?.page || 1,
    page_size: filters?.page_size || 20,
    total_pages: Math.max(totalPages, Math.ceil(total / (filters?.page_size || 20))),
  };
};

export const getMarketplaceProduct = async (
  produceId: string
): Promise<MarketplaceProductDetails> => {
  try {
    const res = await apiClient.get<MarketplaceProductDetails>(
      `/api/v1/marketplace/products/${produceId}`
    );
    return res.data;
  } catch (err) {
    // Fallback to local custom listings if newly added
    try {
      const raw = localStorage.getItem("mandi_custom_listings");
      if (raw) {
        const customListings = JSON.parse(raw);
        const match = customListings.find((c: any) => c.id === produceId);
        if (match) {
          const imgUrl = match.primary_image_url || null;
          return {
            ...match,
            images: imgUrl ? [{ id: "img-1", image_url: imgUrl, public_url: imgUrl, is_primary: true, display_order: 0, sort_order: 0 }] : [],
            pricing: {
              expected_price: match.price,
              price_unit: match.price_unit,
              mandi_avg_price: match.price * 1.15,
              retail_avg_price: match.price * 1.4,
              buyer_savings_percentage: 15,
              farmer_gain_percentage: 20,
            },
            farmer_profile: {
              id: match.farmer?.id || "farmer-1",
              full_name: match.farmer?.name || "Verified Farmer",
              verification_status: "VERIFIED",
              rating: 4.9,
              total_orders: 15,
              primary_crop: match.product_name,
            },
            farm: {
              id: "farm-1",
              farm_name: "Farmer Parcel",
              village: match.location?.village || "Local Village",
              mandal: match.location?.mandal || "Local Mandal",
              district: match.location?.district || "Local District",
              state: match.location?.state || "State",
              pincode: "500001",
            },
          } as unknown as MarketplaceProductDetails;
        }
      }
    } catch {
      // ignore
    }
    throw err;
  }
};

// -----------------------------------------------------------------------------
// TanStack Query Hooks
// -----------------------------------------------------------------------------

export const useMarketplaceProducts = (filters?: MarketplaceFilters) => {
  return useQuery({
    queryKey: MARKETPLACE_KEYS.products(filters),
    queryFn: () => getMarketplaceProducts(filters),
    staleTime: 30000,
  });
};

export const useMarketplaceProduct = (produceId: string | undefined) => {
  return useQuery({
    queryKey: MARKETPLACE_KEYS.product(produceId || ""),
    queryFn: () => getMarketplaceProduct(produceId!),
    enabled: !!produceId,
    staleTime: 60000,
    retry: 1,
  });
};
