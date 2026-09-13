import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Minus, Plus, Trash2, MapPin, ImageOff, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CartItem } from "@/types/order";
import { useUpdateCartItem, useRemoveCartItem } from "@/hooks/useCart";

interface CartItemCardProps {
  item: CartItem;
}

export const CartItemCard: React.FC<CartItemCardProps> = ({ item }) => {
  const [imgError, setImgError] = useState(false);
  const updateMutation = useUpdateCartItem();
  const removeMutation = useRemoveCartItem();

  const product = item.product;
  const isAvailable = product.status === "LISTED" && product.available_quantity > 0;
  const exceedsStock = item.quantity > product.available_quantity;

  const handleQuantityChange = (newQty: number) => {
    if (newQty <= 0) {
      removeMutation.mutate(item.id);
      return;
    }
    if (newQty > product.available_quantity) return;
    updateMutation.mutate({ item_id: item.id, quantity: newQty });
  };

  const handleStep = (delta: number) => {
    // Step by 10 for quintal/ton, step by 5 or 1 for kg
    const step = product.quantity_unit === "TON" ? 0.25 : product.quantity_unit === "QUINTAL" ? 1 : 5;
    const nextQty = Math.max(1, Math.round((item.quantity + delta * step) * 100) / 100);
    handleQuantityChange(nextQty);
  };

  return (
    <div className="rounded-xl border border-border/60 bg-slate-900/60 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all hover:border-emerald-500/30">
      {/* Left: Thumbnail & Details */}
      <div className="flex items-start gap-4 flex-1">
        {/* Photo */}
        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg overflow-hidden bg-slate-950 shrink-0 border border-border/40 relative">
          {product.primary_image_url && !imgError ? (
            <img
              src={product.primary_image_url}
              alt={product.product_name}
              onError={() => setImgError(true)}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-slate-600 bg-slate-900">
              <ImageOff className="w-6 h-6" />
            </div>
          )}
          <Badge
            variant="secondary"
            className="absolute top-1 left-1 text-[9px] uppercase font-mono px-1 py-0 bg-slate-900/80 backdrop-blur-md"
          >
            {product.category}
          </Badge>
        </div>

        {/* Info */}
        <div className="space-y-1.5 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <Link
              to={`/marketplace/products/${product.id}`}
              className="font-bold text-white hover:text-emerald-400 transition-colors text-base line-clamp-1"
            >
              {product.product_name}
            </Link>
          </div>

          {product.variety && (
            <p className="text-xs text-slate-400">
              Variety: <span className="text-slate-300 font-medium">{product.variety}</span>
            </p>
          )}

          <div className="flex items-center gap-1 text-xs text-slate-400">
            <span className="text-slate-300">Farmer: {product.farmer_name}</span>
            <span className="text-slate-600">•</span>
            <MapPin className="w-3 h-3 text-emerald-500 shrink-0" />
            <span className="truncate">{product.farmer_location}</span>
          </div>

          <div className="flex items-baseline gap-2 pt-1">
            <span className="text-sm font-bold text-emerald-400">
              ₹{product.expected_price}
            </span>
            <span className="text-xs text-slate-400 font-medium">
              / {product.quantity_unit}
            </span>
            <span className="text-xs text-slate-500">
              (Stock: {product.available_quantity} {product.quantity_unit})
            </span>
          </div>

          {exceedsStock && (
            <div className="flex items-center gap-1 text-rose-400 text-xs font-semibold pt-1">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Requested quantity exceeds available stock ({product.available_quantity} remains).</span>
            </div>
          )}

          {!isAvailable && (
            <Badge variant="outline" className="border-rose-500/40 text-rose-300 bg-rose-500/10 text-[10px]">
              Item No Longer Available
            </Badge>
          )}
        </div>
      </div>

      {/* Right: Controls & Line Subtotal */}
      <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800">
        {/* Quantity Stepper */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-lg border border-border/60">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => handleStep(-1)}
            disabled={updateMutation.isPending || removeMutation.isPending}
            className="h-7 w-7 p-0 text-slate-300 hover:text-white hover:bg-slate-800"
          >
            <Minus className="w-3.5 h-3.5" />
          </Button>

          <span className="w-16 text-center text-xs font-bold font-mono text-white">
            {item.quantity} {product.quantity_unit}
          </span>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => handleStep(1)}
            disabled={
              updateMutation.isPending ||
              item.quantity >= product.available_quantity ||
              !isAvailable
            }
            className="h-7 w-7 p-0 text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-40"
          >
            <Plus className="w-3.5 h-3.5" />
          </Button>
        </div>

        {/* Subtotal & Remove */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-[10px] text-slate-400 block uppercase font-mono">Item Total</span>
            <span className="text-base font-black text-white">
              ₹{item.subtotal.toLocaleString()}
            </span>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => removeMutation.mutate(item.id)}
            disabled={removeMutation.isPending}
            className="text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 h-8 w-8 p-0"
            title="Remove from Cart"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
