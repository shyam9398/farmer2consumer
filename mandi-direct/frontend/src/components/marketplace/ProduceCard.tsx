import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  MapPin,
  CheckCircle2,
  Calendar,
  Sparkles,
  Package,
  ImageOff,
  ArrowRight,
  ShoppingBag,
  Minus,
  Plus,
  Check,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MarketplaceProduct } from "@/types/marketplace";
import { useAddToCart } from "@/hooks/useCart";

interface ProduceCardProps {
  product: MarketplaceProduct;
}

export const ProduceCard: React.FC<ProduceCardProps> = ({ product }) => {
  const [imgError, setImgError] = useState(false);
  const [selectedQty, setSelectedQty] = useState<number>(
    product.minimum_order_quantity || (product.quantity_unit === "TON" ? 1 : 10)
  );
  const [isAdded, setIsAdded] = useState(false);

  const addToCartMutation = useAddToCart();

  const isSoldOut = product.status === "SOLD_OUT" || product.available_quantity <= 0;
  const isLowStock = !isSoldOut && product.available_quantity <= 20;

  const formatPriceUnit = (unit: string) => {
    switch (unit?.toUpperCase()) {
      case "PER_KG":
        return "/ KG";
      case "PER_QUINTAL":
        return "/ Quintal";
      case "PER_TON":
        return "/ Ton";
      default:
        return unit ? `/ ${unit}` : "/ KG";
    }
  };

  const formatGradeBadge = (grade: string) => {
    switch (grade?.toUpperCase()) {
      case "PREMIUM":
        return "border-amber-500/40 text-amber-300 bg-amber-500/10";
      case "GRADE_A":
        return "border-emerald-500/40 text-emerald-300 bg-emerald-500/10";
      case "GRADE_B":
        return "border-blue-500/40 text-blue-300 bg-blue-500/10";
      case "GRADE_C":
        return "border-slate-500/40 text-slate-300 bg-slate-500/10";
      default:
        return "border-slate-600/40 text-slate-400 bg-slate-800/40";
    }
  };

  const formatGradeLabel = (grade: string) => {
    switch (grade?.toUpperCase()) {
      case "PREMIUM":
        return "Premium Grade";
      case "GRADE_A":
        return "Grade A";
      case "GRADE_B":
        return "Grade B";
      case "GRADE_C":
        return "Grade C";
      default:
        return "Ungraded";
    }
  };

  // Public-safe location (District, State)
  const locationDisplay =
    [product.location.district, product.location.state]
      .filter(Boolean)
      .join(", ") || "Andhra Pradesh";

  const step =
    product.quantity_unit === "TON" ? 0.25 : product.quantity_unit === "QUINTAL" ? 1 : 5;

  const handleStep = (delta: number) => {
    const min = product.minimum_order_quantity || 1;
    const max = product.available_quantity;
    const next = Math.max(min, Math.min(max, Math.round((selectedQty + delta * step) * 100) / 100));
    setSelectedQty(next);
  };

  const handleAddToCart = async () => {
    if (isSoldOut) return;
    try {
      await addToCartMutation.mutateAsync({
        produce_listing_id: product.id,
        quantity: selectedQty,
      });
      setIsAdded(true);
      setTimeout(() => setIsAdded(false), 2000);
    } catch (err) {
      console.error("Failed to add to cart:", err);
    }
  };

  return (
    <Card className="glass-card flex flex-col justify-between overflow-hidden border-border/60 hover:border-emerald-500/40 transition-all duration-300 group hover:shadow-xl hover:shadow-emerald-950/20">
      {/* Image Container with Fallback */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-900/60 border-b border-border/40">
        {product.primary_image_url && !imgError ? (
          <img
            src={product.primary_image_url}
            alt={product.product_name}
            onError={() => setImgError(true)}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 p-4 text-slate-500 bg-gradient-to-br from-slate-900 to-slate-950">
            <ImageOff className="h-8 w-8 text-slate-600" />
            <span className="text-xs font-medium text-slate-400">Produce Photo Unavailable</span>
          </div>
        )}

        {/* Quality Grade Tag overlay */}
        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
          <Badge
            variant="outline"
            className={`text-[11px] font-semibold backdrop-blur-md px-2 py-0.5 shadow-sm ${formatGradeBadge(
              product.quality_grade
            )}`}
          >
            <Sparkles className="h-3 w-3 mr-1" />
            {formatGradeLabel(product.quality_grade)}
          </Badge>
        </div>

        {/* Category & Inventory Status Badges overlay */}
        <div className="absolute top-2.5 right-2.5 flex items-center gap-1">
          {isSoldOut ? (
            <Badge
              variant="outline"
              className="text-[10px] font-bold uppercase tracking-wider bg-rose-950/80 backdrop-blur-md text-rose-400 border-rose-500/40 shadow-sm"
            >
              Sold Out
            </Badge>
          ) : isLowStock ? (
            <Badge
              variant="outline"
              className="text-[10px] font-bold uppercase tracking-wider bg-amber-950/80 backdrop-blur-md text-amber-400 border-amber-500/40 shadow-sm"
            >
              Low Stock
            </Badge>
          ) : (
            <Badge
              variant="outline"
              className="text-[10px] font-bold uppercase tracking-wider bg-emerald-950/80 backdrop-blur-md text-emerald-400 border-emerald-500/40 shadow-sm"
            >
              Available
            </Badge>
          )}

          <Badge
            variant="secondary"
            className="text-[10px] uppercase font-mono tracking-wider bg-slate-900/80 backdrop-blur-md text-slate-200 border border-slate-700/50"
          >
            {product.category}
          </Badge>
        </div>

        {/* Available quantity bar pill */}
        <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between text-xs px-2.5 py-1 rounded bg-slate-950/80 backdrop-blur-md border border-border/40 text-slate-300">
          <span className="flex items-center gap-1 text-[11px] text-slate-400">
            <Package className="h-3.5 w-3.5 text-emerald-400" /> In Stock:
          </span>
          {isSoldOut ? (
            <span className="font-bold text-rose-400 uppercase text-[11px]">0 {product.quantity_unit}</span>
          ) : (
            <span className="font-semibold text-white">
              {product.available_quantity.toLocaleString()} {product.quantity_unit}
            </span>
          )}
        </div>
      </div>

      {/* Card Content & Details */}
      <CardContent className="p-4 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-2">
          {/* Produce Name and Variety */}
          <div>
            <h3 className="font-heading font-bold text-lg text-white group-hover:text-emerald-400 transition-colors line-clamp-1">
              {product.product_name}
            </h3>
            {product.variety && (
              <p className="text-xs text-slate-400 font-medium line-clamp-1">
                Variety: <span className="text-slate-300">{product.variety}</span>
              </p>
            )}
          </div>

          {/* Price & Unit Display */}
          <div className="rounded-lg bg-emerald-950/20 border border-emerald-500/20 p-2.5 flex items-baseline justify-between">
            <span className="text-xs text-emerald-300 font-medium">Farmer Direct Price</span>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-black text-emerald-400">₹{product.price}</span>
              <span className="text-xs text-emerald-300/80">{formatPriceUnit(product.price_unit)}</span>
            </div>
          </div>

          {/* Farmer & Verification Status */}
          <div className="space-y-1 pt-1 text-xs">
            <div className="flex items-center gap-1.5 text-slate-300 font-medium">
              <span>Farmer: {product.farmer.name}</span>
              {product.farmer.is_verified && (
                <span
                  className="inline-flex items-center text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20 font-semibold"
                  title="Verified Farmer"
                >
                  <CheckCircle2 className="h-3 w-3 mr-0.5 text-emerald-400" />
                  Verified
                </span>
              )}
            </div>

            {/* Farm Location */}
            <div className="flex items-center gap-1 text-[11px] text-slate-400">
              <MapPin className="h-3 w-3 text-emerald-500/80 shrink-0" />
              <span className="truncate">{locationDisplay}</span>
            </div>

            {/* Harvest Date */}
            {product.harvest_date && (
              <div className="flex items-center gap-1 text-[11px] text-slate-500">
                <Calendar className="h-3 w-3 text-slate-500 shrink-0" />
                <span>Harvested: {product.harvest_date}</span>
              </div>
            )}
          </div>
        </div>

        {/* Phase 8 Ordering Actions */}
        <div className="space-y-2 pt-2 border-t border-slate-800">
          {!isSoldOut ? (
            <div className="flex items-center gap-2">
              {/* Stepper */}
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 shrink-0">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleStep(-1)}
                  disabled={selectedQty <= (product.minimum_order_quantity || 1)}
                  className="h-6 w-6 p-0 text-slate-300 hover:text-white"
                >
                  <Minus className="w-3 h-3" />
                </Button>
                <span className="w-12 text-center text-[11px] font-bold font-mono text-white">
                  {selectedQty}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleStep(1)}
                  disabled={selectedQty >= product.available_quantity}
                  className="h-6 w-6 p-0 text-slate-300 hover:text-white"
                >
                  <Plus className="w-3 h-3" />
                </Button>
              </div>

              {/* Add to Cart Button */}
              <Button
                type="button"
                size="sm"
                onClick={handleAddToCart}
                disabled={addToCartMutation.isPending}
                className={`flex-1 h-8 text-xs font-semibold gap-1.5 transition-all ${
                  isAdded
                    ? "bg-emerald-700 text-white"
                    : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-950/30"
                }`}
              >
                {isAdded ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Added!</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>Add to Cart</span>
                  </>
                )}
              </Button>
            </div>
          ) : (
            <Button disabled className="w-full h-8 text-xs opacity-50 cursor-not-allowed bg-slate-800 text-slate-400">
              Produce Sold Out
            </Button>
          )}

          {/* View Details Link */}
          <Link to={`/marketplace/products/${product.id}`} className="w-full block">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-between text-slate-400 hover:text-white hover:bg-slate-800/80 text-[11px] h-7 px-2"
            >
              <span>View Full Parcel Details</span>
              <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};
