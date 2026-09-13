import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  Sparkles,
  Search,
  MapPin,
  ShoppingBag,
  Star,
  CheckCircle2,
  Loader2,
  ChevronRight,
  HelpCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { apiClient } from "@/lib/axios";
import { useAddToCart } from "@/hooks/useCart";
import { VoiceInputButton } from "@/components/common/VoiceInputButton";

interface DecisionHelperItem {
  produce_id: string;
  product_name: string;
  category: string;
  variety?: string | null;
  quality_grade?: string | null;
  price: number;
  price_unit: string;
  available_quantity: number;
  quantity_unit: string;
  primary_image_url?: string | null;
  farmer_id: string;
  farmer_name: string;
  farmer_rating: number;
  farmer_total_reviews: number;
  district?: string | null;
  state?: string | null;
  distance_km?: number | null;
  match_score: number;
  explanation: string;
}

interface DecisionHelperResponse {
  query: string;
  total_matches: number;
  recommendations: DecisionHelperItem[];
  parsed_intent: {
    crop_name?: string | null;
    category?: string | null;
    max_price?: number | null;
    min_quantity?: number | null;
    quality_grade?: string | null;
  };
}

export const BuyerDecisionHelper: React.FC = () => {
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<DecisionHelperResponse | null>(null);
  const [addedIds, setAddedIds] = useState<Record<string, boolean>>({});

  const addToCartMutation = useAddToCart();

  const handleSearch = async (searchQuery: string) => {
    const q = searchQuery.trim();
    if (!q) return;

    setIsLoading(true);
    setError(null);

    try {
      // Try to get browser location for geo-distance
      let buyerLat: number | undefined = undefined;
      let buyerLon: number | undefined = undefined;

      if (navigator.geolocation) {
        try {
          const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 3000 });
          });
          buyerLat = pos.coords.latitude;
          buyerLon = pos.coords.longitude;
        } catch {
          // Geolocation optional; proceed without it
        }
      }

      const res = await apiClient.post<DecisionHelperResponse>("/marketplace/decision-helper", {
        query: q,
        buyer_lat: buyerLat,
        buyer_lon: buyerLon,
        max_results: 6,
      });

      setResult(res.data);
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Failed to find recommendations for this query.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddToCart = async (item: DecisionHelperItem) => {
    try {
      await addToCartMutation.mutateAsync({
        produce_listing_id: item.produce_id,
        quantity: Math.min(10, item.available_quantity),
      });
      setAddedIds((prev) => ({ ...prev, [item.produce_id]: true }));
      setTimeout(() => {
        setAddedIds((prev) => ({ ...prev, [item.produce_id]: false }));
      }, 2500);
    } catch (err) {
      console.error("Failed to add to cart", err);
    }
  };

  const sampleQueries = [
    "Fresh Tomatoes under 40/kg",
    "Grade A Rice near me",
    "Low price Onions bulk",
    "Fresh Green Chillies Grade A",
  ];

  return (
    <Card className="glass-card border-emerald-500/30 overflow-hidden shadow-xl bg-gradient-to-br from-slate-900 via-slate-900/90 to-emerald-950/20">
      <CardContent className="p-5 sm:p-6 space-y-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/40 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-lg text-white flex items-center gap-2">
                Buyer Decision Helper
                <Badge variant="outline" className="text-[10px] text-emerald-400 border-emerald-500/40">
                  REAL-TIME INTELLIGENCE
                </Badge>
              </h3>
              <p className="text-xs text-slate-400">
                Natural search combining distance, freshness, quality grade, farmer ratings, and fair pricing.
              </p>
            </div>
          </div>
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSearch(query);
          }}
          className="relative flex items-center gap-2"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="What are you looking for? (e.g. Tomatoes under 30/kg near Guntur, Bulk Rice Grade A)"
              className="pl-10 pr-12 h-11 bg-slate-950/70 border-slate-700 text-sm text-white placeholder-slate-500 rounded-xl focus:ring-2 focus:ring-emerald-500"
            />
            <div className="absolute right-2 top-2">
              <VoiceInputButton
                onResult={(text) => {
                  setQuery(text);
                  handleSearch(text);
                }}
                promptLabel="Procurement query"
                size="sm"
              />
            </div>
          </div>
          <Button
            type="submit"
            disabled={isLoading || !query.trim()}
            className="h-11 px-5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl shrink-0 gap-1.5"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <span>Find Best</span>
                <ChevronRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </form>

        {/* Quick Suggestion Chips */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-400">
          <span className="font-medium text-slate-400 flex items-center gap-1">
            <HelpCircle className="h-3.5 w-3.5 text-emerald-400" /> Quick examples:
          </span>
          {sampleQueries.map((sq) => (
            <button
              key={sq}
              type="button"
              onClick={() => {
                setQuery(sq);
                handleSearch(sq);
              }}
              className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 hover:border-emerald-500/50 text-slate-300 text-xs transition-colors"
            >
              {sq}
            </button>
          ))}
        </div>

        {/* Error message */}
        {error && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
            {error}
          </div>
        )}

        {/* Recommendations Result */}
        {result && (
          <div className="space-y-4 pt-2 border-t border-border/40">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 font-medium">
                Found <span className="text-emerald-400 font-bold">{result.total_matches}</span> matching listings
                for "{result.query}"
              </span>
              {result.parsed_intent && (
                <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                  {result.parsed_intent.crop_name && (
                    <Badge variant="secondary" className="text-[10px]">
                      Crop: {result.parsed_intent.crop_name}
                    </Badge>
                  )}
                  {result.parsed_intent.max_price && (
                    <Badge variant="secondary" className="text-[10px]">
                      Max ₹{result.parsed_intent.max_price}
                    </Badge>
                  )}
                  {result.parsed_intent.quality_grade && (
                    <Badge variant="secondary" className="text-[10px]">
                      {result.parsed_intent.quality_grade}
                    </Badge>
                  )}
                </div>
              )}
            </div>

            {result.recommendations.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400 rounded-xl bg-slate-950/40 border border-border/40">
                No active listings matched your specific query criteria. Try broadening your terms or checking general marketplace.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {result.recommendations.map((item) => (
                  <div
                    key={item.produce_id}
                    className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-emerald-500/40 transition-all flex flex-col justify-between space-y-3"
                  >
                    <div>
                      {/* Top Badges */}
                      <div className="flex items-center justify-between gap-1 mb-2">
                        <Badge
                          variant="outline"
                          className="text-[10px] font-mono text-emerald-400 border-emerald-500/30"
                        >
                          {item.category}
                        </Badge>
                        <div className="flex items-center gap-1 text-[11px] text-amber-400 font-bold">
                          <Star className="h-3 w-3 fill-amber-400" />
                          <span>{item.farmer_rating.toFixed(1)}</span>
                          <span className="text-slate-500 text-[10px]">({item.farmer_total_reviews})</span>
                        </div>
                      </div>

                      {/* Title & Farmer */}
                      <Link
                        to={`/marketplace/${item.produce_id}`}
                        className="font-bold text-sm text-white hover:text-emerald-400 transition-colors line-clamp-1"
                      >
                        {item.product_name}
                      </Link>
                      <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <span>by {item.farmer_name}</span>
                        {item.district && (
                          <>
                            <span>•</span>
                            <MapPin className="h-2.5 w-2.5 text-emerald-400" />
                            <span>{item.district}</span>
                          </>
                        )}
                        {item.distance_km !== null && item.distance_km !== undefined && (
                          <span className="text-emerald-400">({item.distance_km.toFixed(1)} km)</span>
                        )}
                      </p>

                      {/* Explanation Callout */}
                      <div className="mt-2 p-2 rounded-lg bg-emerald-950/30 border border-emerald-500/20 text-[11px] text-emerald-300/90 leading-tight">
                        {item.explanation}
                      </div>
                    </div>

                    {/* Price & Add to Cart */}
                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                      <div>
                        <span className="text-sm font-black text-white">₹{item.price}</span>
                        <span className="text-[10px] text-slate-400 ml-1">/{item.price_unit}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Link to={`/marketplace/${item.produce_id}`}>
                          <Button variant="ghost" size="sm" className="h-8 text-xs text-slate-300 px-2.5">
                            Details
                          </Button>
                        </Link>
                        <Button
                          size="sm"
                          onClick={() => handleAddToCart(item)}
                          disabled={item.available_quantity <= 0 || addedIds[item.produce_id]}
                          className={`h-8 text-xs font-semibold px-3 ${
                            addedIds[item.produce_id]
                              ? "bg-emerald-500 text-slate-950"
                              : "bg-emerald-600 hover:bg-emerald-500 text-white"
                          }`}
                        >
                          {addedIds[item.produce_id] ? (
                            <span className="flex items-center gap-1">
                              <CheckCircle2 className="h-3.5 w-3.5" /> Added
                            </span>
                          ) : (
                            <span className="flex items-center gap-1">
                              <ShoppingBag className="h-3.5 w-3.5" /> Add
                            </span>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
