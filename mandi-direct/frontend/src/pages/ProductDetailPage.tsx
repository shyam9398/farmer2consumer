import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  Calendar,
  Package,
  Sparkles,
  ShieldCheck,
  TrendingDown,
  Layers,
  AlertCircle,
  ShoppingBag,
  Check,
  Minus,
  Plus,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMarketplaceProduct } from "@/hooks/useMarketplace";
import { useAddToCart } from "@/hooks/useCart";
import { ProductGallery } from "@/components/marketplace/ProductGallery";
import { FarmerReviewsCard } from "@/components/farmer/FarmerReviewsCard";

export const ProductDetailPage: React.FC = () => {
  const { produceId } = useParams<{ produceId: string }>();
  const { data: product, isLoading, isError } = useMarketplaceProduct(produceId);
  const addToCartMutation = useAddToCart();

  const [orderQty, setOrderQty] = useState<number>(10);
  const [isAdded, setIsAdded] = useState(false);

  useEffect(() => {
    if (product) {
      setOrderQty(product.minimum_order_quantity || (product.quantity_unit === "TON" ? 0.5 : 10));
    }
  }, [product]);

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

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 sm:px-8 py-10 max-w-6xl space-y-8 animate-pulse">
        <div className="h-6 w-36 bg-slate-800 rounded" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-6 aspect-[4/3] bg-slate-800 rounded-2xl" />
          <div className="lg:col-span-6 space-y-4">
            <div className="h-8 w-3/4 bg-slate-800 rounded" />
            <div className="h-5 w-1/2 bg-slate-800 rounded" />
            <div className="h-16 w-full bg-slate-800 rounded-xl" />
            <div className="h-32 w-full bg-slate-800 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (isError || !product) {
    return (
      <div className="container mx-auto px-4 sm:px-8 py-16 max-w-xl text-center space-y-6">
        <div className="h-16 w-16 rounded-full bg-amber-500/10 text-amber-400 mx-auto flex items-center justify-center border border-amber-500/20">
          <AlertCircle className="h-8 w-8" />
        </div>
        <div className="space-y-2">
          <h2 className="font-heading text-2xl font-bold text-white">Product Not Available</h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            This produce may have been sold, withdrawn, expired, or removed from the marketplace.
          </p>
        </div>
        <Link to="/marketplace">
          <Button variant="harvest" className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Back to Marketplace
          </Button>
        </Link>
      </div>
    );
  }

  const locationStr = [
    product.farm.village,
    product.farm.mandal,
    product.farm.district,
    product.farm.state,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="container mx-auto px-4 sm:px-8 py-8 max-w-6xl space-y-8">
      {/* Breadcrumb / Back Link */}
      <div>
        <Link
          to="/marketplace"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-emerald-400 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Marketplace</span>
        </Link>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Gallery */}
        <div className="lg:col-span-6 space-y-6 sticky top-24">
          <ProductGallery
            images={product.images}
            productName={product.product_name}
            qualityGrade={product.quality_grade}
          />

          {/* Quick Specifications Card */}
          <Card className="glass-card border-border/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
                <Package className="h-4 w-4 text-emerald-400" />
                <span>Produce Lot Specifications</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4 text-xs">
              <div className="rounded-lg bg-secondary/30 p-2.5 space-y-0.5">
                <span className="text-slate-400 text-[11px]">Available Quantity:</span>
                <p className="font-bold text-white text-sm">
                  {product.available_quantity.toLocaleString()} {product.quantity_unit}
                </p>
              </div>
              <div className="rounded-lg bg-secondary/30 p-2.5 space-y-0.5">
                <span className="text-slate-400 text-[11px]">Min. Order Quantity:</span>
                <p className="font-bold text-white text-sm">
                  {product.minimum_order_quantity.toLocaleString()} {product.quantity_unit}
                </p>
              </div>
              <div className="rounded-lg bg-secondary/30 p-2.5 space-y-0.5">
                <span className="text-slate-400 text-[11px]">Quality Grade:</span>
                <p className="font-bold text-emerald-400 text-sm">
                  {product.quality_grade}
                </p>
              </div>
              <div className="rounded-lg bg-secondary/30 p-2.5 space-y-0.5">
                <span className="text-slate-400 text-[11px]">Category:</span>
                <p className="font-bold text-white text-sm">
                  {product.category}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Details, Farmer, Pricing */}
        <div className="lg:col-span-6 space-y-6">
          {/* Produce Header & Category */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="font-mono text-xs uppercase bg-slate-800 text-slate-200 border border-slate-700">
                {product.category}
              </Badge>
              <Badge variant="outline" className="border-emerald-500/40 text-emerald-300 bg-emerald-500/10 text-xs font-semibold">
                <Sparkles className="h-3 w-3 mr-1" />
                {product.quality_grade}
              </Badge>
            </div>
            <h1 className="font-heading text-3xl sm:text-4xl font-extrabold text-white">
              {product.product_name}
            </h1>
            {product.variety && (
              <p className="text-sm text-slate-400 font-medium">
                Botanical / Cultivar Variety: <span className="text-slate-200 font-semibold">{product.variety}</span>
              </p>
            )}
          </div>

          {/* Transparent Price Display Card */}
          <Card className="glass-card border-emerald-500/30 bg-gradient-to-br from-emerald-950/30 to-slate-900/50">
            <CardContent className="p-5 space-y-3">
              <div className="flex items-baseline justify-between">
                <div>
                  <span className="text-xs uppercase tracking-wider font-semibold text-emerald-400">
                    Direct Farmer Price
                  </span>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="text-3xl sm:text-4xl font-black text-white">₹{product.price}</span>
                    <span className="text-sm font-semibold text-emerald-300">
                      {formatPriceUnit(product.price_unit)}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant="success" className="text-xs px-2.5 py-1">
                    0% Intermediary Markup
                  </Badge>
                </div>
              </div>

              <div className="pt-2 border-t border-emerald-500/20 text-xs text-slate-300 flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>
                  Eliminating traditional APMC middlemen layers enables direct savings for wholesale buyers while delivering higher net earnings to the farmer.
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Description */}
          {product.description && (
            <div className="space-y-1.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Lot Description</h3>
              <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line bg-secondary/20 p-3.5 rounded-xl border border-border/40">
                {product.description}
              </p>
            </div>
          )}

          {/* Harvest & Window Schedule */}
          <Card className="glass-card border-border/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
                <Calendar className="h-4 w-4 text-emerald-400" />
                <span>Harvest & Availability Window</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-border/30">
                <span className="text-slate-400">Harvest Date:</span>
                <span className="font-semibold text-white">{product.harvest_date}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/30">
                <span className="text-slate-400">Available From:</span>
                <span className="font-semibold text-white">{product.available_from}</span>
              </div>
              {product.available_until && (
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">Available Until:</span>
                  <span className="font-semibold text-emerald-400">{product.available_until}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Farmer Information Card */}
          <Card className="glass-card border-border/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold text-white flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-400" />
                  <span>Farmer Information</span>
                </span>
                {product.farmer.is_verified && (
                  <Badge variant="success" className="text-[10px] gap-1 px-2 py-0.5">
                    <CheckCircle2 className="h-3 w-3" />
                    Verified Farmer
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-border/30">
                <span className="text-slate-400">Full Name:</span>
                <span className="font-bold text-white">{product.farmer.name}</span>
              </div>
              {product.farmer.member_since && (
                <div className="flex justify-between py-1 border-b border-border/30">
                  <span className="text-slate-400">Community Member Since:</span>
                  <span className="font-semibold text-slate-200">{product.farmer.member_since}</span>
                </div>
              )}
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Farmer Region:</span>
                <span className="font-semibold text-slate-200">
                  {product.location.district}, {product.location.state}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Farm Information Card */}
          <Card className="glass-card border-border/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
                <Layers className="h-4 w-4 text-emerald-400" />
                <span>Farm Parcel Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-border/30">
                <span className="text-slate-400">Farm Name:</span>
                <span className="font-bold text-white">{product.farm.farm_name}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/30">
                <span className="text-slate-400">Total Cultivation Area:</span>
                <span className="font-semibold text-slate-200">
                  {product.farm.total_area} {product.farm.area_unit}s
                </span>
              </div>
              {product.farm.soil_type && (
                <div className="flex justify-between py-1 border-b border-border/30">
                  <span className="text-slate-400">Soil Type:</span>
                  <span className="font-semibold text-slate-200">{product.farm.soil_type}</span>
                </div>
              )}
              {product.farm.irrigation_type && (
                <div className="flex justify-between py-1 border-b border-border/30">
                  <span className="text-slate-400">Irrigation Type:</span>
                  <span className="font-semibold text-slate-200">{product.farm.irrigation_type}</span>
                </div>
              )}
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Location:</span>
                <span className="font-semibold text-slate-200 text-right">{locationStr}</span>
              </div>
            </CardContent>
          </Card>

          {/* Live Phase 8 Ordering Action Section */}
          {(() => {
            const isSoldOut = product.status === "SOLD_OUT" || product.available_quantity <= 0;
            const step = product.quantity_unit === "TON" ? 0.25 : product.quantity_unit === "QUINTAL" ? 1 : 5;
            const minQty = product.minimum_order_quantity || 1;
            const maxQty = product.available_quantity;
            const currentSubtotal = Math.round(orderQty * product.price * 100) / 100;

            const handleStep = (delta: number) => {
              const next = Math.max(minQty, Math.min(maxQty, Math.round((orderQty + delta * step) * 100) / 100));
              setOrderQty(next);
            };

            const handleAddToCart = async () => {
              if (isSoldOut) return;
              try {
                await addToCartMutation.mutateAsync({
                  produce_listing_id: product.id,
                  quantity: orderQty,
                });
                setIsAdded(true);
                setTimeout(() => setIsAdded(false), 2500);
              } catch (err) {
                console.error("Failed to add to cart:", err);
              }
            };

            return (
              <div className="rounded-2xl border border-emerald-500/40 bg-slate-900/90 p-5 space-y-4 shadow-xl shadow-emerald-950/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                    <ShoppingBag className="h-4 w-4" />
                    <span>Wholesale Purchase Order</span>
                  </div>
                  {isSoldOut ? (
                    <Badge variant="outline" className="border-rose-500/40 text-rose-300 bg-rose-500/10 text-[10px]">
                      Sold Out
                    </Badge>
                  ) : (
                    <span className="text-[11px] text-slate-400">
                      {product.available_quantity} {product.quantity_unit} in stock
                    </span>
                  )}
                </div>

                {!isSoldOut ? (
                  <>
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs text-slate-300">
                        <span>Select Order Quantity:</span>
                        <span className="text-slate-400 text-[11px]">
                          Min: {minQty} {product.quantity_unit}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-700 flex-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleStep(-1)}
                            disabled={orderQty <= minQty}
                            className="h-9 w-9 p-0 text-slate-300 hover:text-white hover:bg-slate-800"
                          >
                            <Minus className="w-4 h-4" />
                          </Button>

                          <input
                            type="number"
                            value={orderQty}
                            min={minQty}
                            max={maxQty}
                            step={step}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value);
                              if (!isNaN(val)) {
                                setOrderQty(Math.max(minQty, Math.min(maxQty, val)));
                              }
                            }}
                            className="w-full text-center bg-transparent text-sm font-bold font-mono text-white focus:outline-none"
                          />

                          <span className="text-xs text-slate-400 pr-2 font-mono">{product.quantity_unit}</span>

                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleStep(1)}
                            disabled={orderQty >= maxQty}
                            className="h-9 w-9 p-0 text-slate-300 hover:text-white hover:bg-slate-800"
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-xl bg-slate-950/60 border border-slate-800 p-3 flex justify-between items-baseline">
                      <span className="text-xs text-slate-400">Order Subtotal:</span>
                      <div className="text-right">
                        <span className="text-xl font-black text-emerald-400 font-mono">
                          ₹{currentSubtotal.toLocaleString()}
                        </span>
                        <p className="text-[10px] text-slate-500">Excluding freight</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Button
                        onClick={handleAddToCart}
                        disabled={addToCartMutation.isPending}
                        className={`w-full h-11 text-xs font-bold gap-2 transition-all shadow-lg ${
                          isAdded
                            ? "bg-emerald-700 text-white shadow-emerald-950/60"
                            : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-950/40"
                        }`}
                      >
                        {isAdded ? (
                          <>
                            <Check className="w-4 h-4" />
                            <span>Added to Shopping Cart!</span>
                          </>
                        ) : (
                          <>
                            <ShoppingBag className="w-4 h-4" />
                            <span>{addToCartMutation.isPending ? "Adding..." : "Add to Cart"}</span>
                          </>
                        )}
                      </Button>

                      <Link to="/buyer/cart" className="block">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full text-xs h-9 border-slate-700 hover:bg-slate-800 text-slate-300"
                        >
                          View Shopping Cart & Checkout
                        </Button>
                      </Link>
                    </div>
                  </>
                ) : (
                  <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-center space-y-2">
                    <p className="text-xs text-slate-400">
                      This harvest lot has been fully purchased and committed to wholesale buyers.
                    </p>
                    <Link to="/marketplace">
                      <Button variant="outline" size="sm" className="text-xs w-full">
                        Browse Other Farmers' Produce
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      </div>

      {/* Verified Buyer Ratings & Reviews */}
      <div className="pt-6 border-t border-border/40">
        <FarmerReviewsCard
          farmerProfileId={product.farmer.id}
          farmerName={product.farmer.name}
        />
      </div>
    </div>
  );
};
