import React from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ShoppingBag,
  ArrowRight,
  ArrowLeft,
  Trash2,
  ShieldCheck,
  Truck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CartItemCard } from "@/components/cart/CartItemCard";
import { useCart, useClearCart } from "@/hooks/useCart";

export const CartPage: React.FC = () => {
  const navigate = useNavigate();
  const { data: cart, isLoading, error } = useCart();
  const clearMutation = useClearCart();

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 sm:px-8 py-12 max-w-5xl space-y-6">
        <div className="h-8 w-48 bg-slate-800 rounded animate-pulse" />
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-32 bg-slate-900/60 rounded-xl border border-slate-800 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !cart) {
    return (
      <div className="container mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="text-xl font-bold text-white">Unable to load your shopping cart</h2>
        <p className="text-sm text-slate-400">Please check your network connection and try again.</p>
        <Button onClick={() => window.location.reload()} variant="outline" size="sm">
          Retry
        </Button>
      </div>
    );
  }

  const isEmpty = !cart.items || cart.items.length === 0;

  return (
    <div className="container mx-auto px-4 sm:px-8 py-8 sm:py-12 max-w-6xl space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <ShoppingBag className="w-7 h-7 text-emerald-400" />
            <span>Buyer Shopping Cart</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Direct farmer orders with guaranteed origin and mandi-transparent pricing.
          </p>
        </div>

        {!isEmpty && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => clearMutation.mutate()}
            disabled={clearMutation.isPending}
            className="text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 text-xs gap-1.5 self-start sm:self-auto"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Cart</span>
          </Button>
        )}
      </div>

      {isEmpty ? (
        /* Empty Cart State */
        <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/40 p-12 text-center space-y-5 max-w-lg mx-auto my-8">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-bold text-white">Your cart is empty</h3>
            <p className="text-xs text-slate-400 leading-relaxed max-w-sm mx-auto">
              Explore harvest lots listed directly by verified Indian farmers. Add wholesale
              quantities of vegetables, grains, and fruits to your cart.
            </p>
          </div>
          <Link to="/marketplace">
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs gap-2 mt-2">
              <span>Browse Marketplace</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      ) : (
        /* Cart Content & Financial Summary */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Items List */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-400 px-1">
              <span>Items in Cart ({cart.item_count})</span>
              <span>Prices verified against live mandi listings</span>
            </div>

            <div className="space-y-3">
              {cart.items.map((item) => (
                <CartItemCard key={item.id} item={item} />
              ))}
            </div>

            <div className="pt-4">
              <Link to="/marketplace" className="inline-flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 font-medium">
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Continue Shopping Marketplace</span>
              </Link>
            </div>
          </div>

          {/* Checkout & Summary Sidebar */}
          <div className="space-y-5">
            <Card className="glass-card border-border/60 sticky top-24">
              <CardContent className="p-5 sm:p-6 space-y-5">
                <h3 className="text-base font-bold text-white border-b border-slate-800 pb-3">
                  Order Financial Summary
                </h3>

                <div className="space-y-3 text-xs">
                  <div className="flex justify-between text-slate-300">
                    <span>Produce Subtotal ({cart.item_count} items):</span>
                    <span className="font-semibold text-white font-mono text-sm">
                      ₹{cart.subtotal.toLocaleString()}
                    </span>
                  </div>

                  <div className="flex justify-between text-slate-400">
                    <span className="flex items-center gap-1">
                      <Truck className="w-3.5 h-3.5 text-slate-500" />
                      <span>Logistics & Transport:</span>
                    </span>
                    <span className="text-emerald-400 font-medium">
                      ₹0 (Calculated at Delivery)
                    </span>
                  </div>

                  <div className="flex justify-between text-slate-400">
                    <span>Mandatory APMC Mandi Tax:</span>
                    <span className="text-emerald-400 font-medium">₹0 (Zero Middleman Direct)</span>
                  </div>

                  <div className="border-t border-slate-800 pt-3 flex justify-between items-baseline">
                    <span className="text-sm font-bold text-white">Estimated Total:</span>
                    <div className="text-right">
                      <span className="text-2xl font-black text-emerald-400 font-mono">
                        ₹{cart.total_amount.toLocaleString()}
                      </span>
                      <p className="text-[10px] text-slate-500">Excluding inter-state toll</p>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={() => navigate("/buyer/checkout")}
                  className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-2 shadow-lg shadow-emerald-950/40"
                >
                  <span>Proceed to Checkout</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>

                {/* Trust Badges */}
                <div className="rounded-lg bg-slate-950/60 border border-slate-800/80 p-3 space-y-2 text-[11px] text-slate-400">
                  <div className="flex items-center gap-2 text-slate-300 font-medium">
                    <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Mandi Direct Fair Pricing Guarantee</span>
                  </div>
                  <p className="text-[10px] leading-relaxed">
                    100% of the produce value is directly disbursed to the verified farmer upon quality settlement.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};
