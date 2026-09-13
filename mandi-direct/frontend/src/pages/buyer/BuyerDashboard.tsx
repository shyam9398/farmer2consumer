import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  Sparkles,
  Sliders,
  ShoppingBag,
  Package,
  ArrowRight,
  Store,
  RefreshCw,
  AlertCircle,
  Search,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useBuyerProductMatches } from "@/hooks/useMatching";
import { useBuyerPreferences } from "@/hooks/useBuyerPreferences";
import { useMarketplaceProducts } from "@/hooks/useMarketplace";
import { ProductMatchCard } from "@/components/matching/ProductMatchCard";
import { ProduceCard } from "@/components/marketplace/ProduceCard";
import { BuyerDecisionHelper } from "@/components/buyer/BuyerDecisionHelper";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

export const BuyerDashboard: React.FC = () => {
  const { profile } = useAuth();
  const { data: preferences } = useBuyerPreferences();

  // Marketplace search & category filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sortBy, setSortBy] = useState("recommended");

  // Fetch smart matches
  const { data: matchesData } = useBuyerProductMatches({
    page: 1,
    page_size: 4,
    sort: "highest_match",
  });

  // Fetch marketplace products for buyer exploration
  const {
    data: marketplaceData,
    isLoading: isProductsLoading,
    error: productsError,
    refetch: refetchProducts,
  } = useMarketplaceProducts({
    search: searchTerm || undefined,
    category: categoryFilter !== "ALL" ? categoryFilter : undefined,
    sort: sortBy,
    page: 1,
    page_size: 12,
  });

  const buyerName = profile?.full_name || "Procurement Buyer";
  const hasPreferences =
    preferences &&
    ((preferences.preferred_categories?.length || 0) > 0 ||
      (preferences.preferred_products?.length || 0) > 0 ||
      (preferences.preferred_districts?.length || 0) > 0);

  const recommendedItems = matchesData?.items || [];
  const rawProducts = marketplaceData?.items || [];

  // Filter in-stock only if checked
  const displayProducts = inStockOnly
    ? rawProducts.filter((p) => p.status !== "SOLD_OUT" && p.available_quantity > 0)
    : rawProducts;

  const categories = [
    { key: "ALL", label: "All Categories", icon: "🌱" },
    { key: "VEGETABLE", label: "Vegetables", icon: "🥬" },
    { key: "GRAIN", label: "Grains & Cereals", icon: "🌾" },
    { key: "FRUIT", label: "Fruits", icon: "🍎" },
    { key: "PULSE", label: "Pulses", icon: "🫘" },
    { key: "SPICE", label: "Spices", icon: "🌶️" },
    { key: "OILSEED", label: "Oilseeds", icon: "🌻" },
  ];

  return (
    <div className="container mx-auto px-4 sm:px-8 py-8 space-y-8 max-w-6xl">
      {/* Top Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/60 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Badge variant="outline" className="text-xs text-emerald-400 border-emerald-500/30 font-bold">
              DIRECT BUYER WORKSPACE
            </Badge>
          </div>
          <h1 className="text-3xl font-extrabold text-white flex items-center gap-2">
            <span>Welcome, {buyerName}</span>
            <span className="text-2xl animate-pulse">🌾</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Direct Farm-to-Buyer Exchange · Guaranteed Quality & Zero Middlemen Commission
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Link to="/buyer/preferences">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs text-slate-300">
              <Sliders className="h-3.5 w-3.5 text-emerald-400" />
              <span>Preferences</span>
            </Button>
          </Link>
          <Link to="/buyer/orders">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs text-slate-300">
              <Package className="h-3.5 w-3.5 text-amber-400" />
              <span>My Orders</span>
            </Button>
          </Link>
          <Link to="/buyer/cart">
            <Button size="sm" className="gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-semibold">
              <ShoppingBag className="h-3.5 w-3.5" />
              <span>My Cart</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Preferences Prompt if not set */}
      {!hasPreferences && (
        <div className="bg-gradient-to-r from-emerald-950/40 via-teal-950/30 to-background border border-emerald-500/40 rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-emerald-300 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>Personalize Your Recommendations</span>
            </h3>
            <p className="text-xs text-slate-300">
              Set your preferences to receive better recommendations based on preferred crops, grades, districts, and budget.
            </p>
          </div>
          <Link to="/buyer/preferences">
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-500 text-xs gap-1.5 shrink-0">
              <span>Set Preferences</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>
      )}

      {/* Real-time AI Buyer Decision Helper Widget */}
      <BuyerDecisionHelper />

      {/* Dedicated Wholesale Marketplace Browser */}
      <div className="space-y-6 pt-2">
        <div className="border-b border-border/40 pb-4 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Store className="w-5 h-5 text-emerald-400" />
                <span>Browse Verified Farmer Harvest Lots</span>
              </h2>
              <p className="text-xs text-slate-400">
                Direct farm listings with inventory badges (Available, Low Stock, Sold Out) and public-safe farm regions.
              </p>
            </div>

            {/* In-Stock Only Toggle */}
            <div className="flex items-center gap-2 text-xs text-slate-300 bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-800">
              <input
                type="checkbox"
                id="in-stock-filter"
                checked={inStockOnly}
                onChange={(e) => setInStockOnly(e.target.checked)}
                className="rounded border-slate-700 bg-slate-950 text-emerald-500 focus:ring-emerald-500"
              />
              <label htmlFor="in-stock-filter" className="cursor-pointer font-medium">
                In Stock Only
              </label>
            </div>
          </div>

          {/* Search & Sort Controls */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search crops by name, variety, or grade (e.g. Sona Masoori, Hybrid Tomato)..."
                className="pl-10 h-10 bg-slate-950 border-slate-800 text-xs text-white rounded-xl focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
              <span className="text-xs text-slate-400 hidden sm:inline">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-slate-950 border border-slate-800 text-xs text-white rounded-xl px-3 py-2 h-10 focus:ring-2 focus:ring-emerald-500"
              >
                <option value="recommended">Recommended</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="newest">Newest Harvest</option>
              </select>
            </div>
          </div>

          {/* Category Filtering Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat.key}
                type="button"
                onClick={() => setCategoryFilter(cat.key)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  categoryFilter === cat.key
                    ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                    : "bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-emerald-500/40"
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Loading State */}
        {isProductsLoading && (
          <div className="flex flex-col items-center justify-center py-16 space-y-2">
            <RefreshCw className="w-6 h-6 text-emerald-400 animate-spin" />
            <p className="text-xs text-slate-400">Loading active farm harvest lots...</p>
          </div>
        )}

        {/* Error State */}
        {productsError && !isProductsLoading && (
          <div className="p-8 rounded-2xl bg-destructive/10 border border-destructive/40 text-center space-y-2">
            <AlertCircle className="w-6 h-6 text-rose-400 mx-auto" />
            <p className="text-xs text-rose-300">Failed to load marketplace produce.</p>
            <Button variant="outline" size="sm" onClick={() => refetchProducts()}>
              Retry
            </Button>
          </div>
        )}

        {/* Empty State */}
        {!isProductsLoading && !productsError && displayProducts.length === 0 && (
          <div className="p-12 text-center rounded-2xl bg-slate-900/60 border border-slate-800 text-slate-400 space-y-2">
            <Package className="h-8 w-8 mx-auto text-slate-600" />
            <p className="text-sm font-semibold text-white">No produce listings found</p>
            <p className="text-xs text-slate-500">
              Try adjusting your search query or selecting a different crop category.
            </p>
          </div>
        )}

        {/* Produce Cards Grid */}
        {!isProductsLoading && !productsError && displayProducts.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayProducts.map((product) => (
              <ProduceCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>

      {/* Recommended For You Section (Personalized smart matches) */}
      {recommendedItems.length > 0 && (
        <div className="space-y-4 pt-4 border-t border-border/40">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span>Matched to Your Buying History</span>
              </h2>
              <p className="text-xs text-slate-400">
                Direct algorithmic matches based on your preferred crop grades and procurement districts.
              </p>
            </div>
            <Link to="/buyer/matching">
              <Button variant="ghost" size="sm" className="text-xs text-emerald-400 hover:text-emerald-300 gap-1">
                <span>View All Matches</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recommendedItems.map((item) => (
              <ProductMatchCard key={item.produce.produce_id} item={item} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default BuyerDashboard;
