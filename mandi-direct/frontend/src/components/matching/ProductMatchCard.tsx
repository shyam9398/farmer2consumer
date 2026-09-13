import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  MapPin,
  ShieldCheck,
  ShoppingBag,
  ArrowRight,
  Check,
} from "lucide-react";
import { ProductMatchItem } from "@/types/matching";
import { MatchExplanation } from "./MatchExplanation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAddToCart } from "@/hooks/useCart";

interface ProductMatchCardProps {
  item: ProductMatchItem;
}

export const ProductMatchCard: React.FC<ProductMatchCardProps> = ({ item }) => {
  const { produce, match } = item;
  const addToCartMutation = useAddToCart();
  const [added, setAdded] = useState(false);

  const handleQuickAdd = async (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      await addToCartMutation.mutateAsync({
        produce_listing_id: produce.produce_id,
        quantity: Math.min(produce.available_quantity, 50),
      });
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    } catch (err) {
      console.error("Failed to add matched product to cart:", err);
    }
  };

  return (
    <Card className="overflow-hidden border-border/70 hover:border-emerald-500/50 transition-all shadow-md bg-card/80 backdrop-blur-sm group flex flex-col">
      <CardContent className="p-5 space-y-4 flex-1 flex flex-col justify-between">
        <div className="space-y-4">
          {/* Main Info Header */}
          <div className="flex gap-4">
            {/* Produce Image */}
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden bg-secondary/40 shrink-0 border border-border/60 relative">
              {produce.primary_image_url ? (
                <img
                  src={produce.primary_image_url}
                  alt={produce.product_name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-500 text-xs text-center p-2">
                  No Photo
                </div>
              )}
              {produce.quality_grade && (
                <div className="absolute top-1 left-1">
                  <Badge variant="secondary" className="text-[9px] px-1 py-0 bg-background/80 backdrop-blur-sm border-border/50 text-emerald-300">
                    {produce.quality_grade.replace("_", " ")}
                  </Badge>
                </div>
              )}
            </div>

            {/* Produce Specs & Pricing */}
            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-bold text-lg text-white truncate tracking-tight">
                  {produce.product_name}
                </h3>
              </div>

              {produce.variety && (
                <p className="text-xs text-slate-400 truncate">
                  Variety: <span className="text-slate-200 font-medium">{produce.variety}</span>
                </p>
              )}

              {/* Price & Quantity */}
              <div className="pt-1 flex items-baseline gap-2">
                <span className="text-xl font-extrabold text-emerald-400 font-mono">
                  ₹{produce.expected_price}
                </span>
                <span className="text-xs text-slate-400">
                  / {produce.price_unit.replace("PER_", "").toLowerCase()}
                </span>
              </div>

              <p className="text-xs text-slate-400">
                Available: <span className="font-semibold text-slate-200">{produce.available_quantity} {produce.quantity_unit}</span>
              </p>

              {/* Farmer & Location Safe Badge */}
              <div className="pt-1 flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                <span className="flex items-center gap-1 font-medium text-slate-300">
                  {produce.farmer_name}
                  {produce.is_verified_farmer && (
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 inline" />
                  )}
                </span>
                <span>•</span>
                <span className="flex items-center gap-0.5">
                  <MapPin className="w-3 h-3 text-slate-400" />
                  {[produce.district, produce.state].filter(Boolean).join(", ")}
                </span>
              </div>
            </div>
          </div>

          {/* Explainable Match Scoring Card */}
          <MatchExplanation match={match} compact={true} />
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex items-center justify-between gap-2 border-t border-border/40">
          <Link
            to={`/marketplace/products/${produce.produce_id}`}
            className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 hover:underline"
          >
            <span>View Details</span>
            <ArrowRight className="w-3 h-3" />
          </Link>

          <Button
            size="sm"
            variant="outline"
            className={`text-xs h-8 gap-1.5 transition-all ${
              added
                ? "border-emerald-500 bg-emerald-500/20 text-emerald-300"
                : "border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/10"
            }`}
            onClick={handleQuickAdd}
            disabled={addToCartMutation.isPending || added}
          >
            {added ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>In Cart</span>
              </>
            ) : (
              <>
                <ShoppingBag className="w-3.5 h-3.5 text-emerald-400" />
                <span>{addToCartMutation.isPending ? "Adding..." : "Add to Cart"}</span>
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
