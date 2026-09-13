import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  MapPin,
  Plus,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Truck,
  PackageCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { AddressCard } from "@/components/address/AddressCard";
import { AddressFormModal } from "@/components/address/AddressFormModal";
import { useCart } from "@/hooks/useCart";
import { useBuyerAddresses } from "@/hooks/useAddresses";
import { useCreateOrder } from "@/hooks/useOrders";

export const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const { data: cart, isLoading: isCartLoading } = useCart();
  const { data: addresses, isLoading: isAddressesLoading } = useBuyerAddresses();
  const createOrderMutation = useCreateOrder();

  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [buyerNotes, setBuyerNotes] = useState("");
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Auto-select default address on load
  useEffect(() => {
    if (addresses && addresses.length > 0 && !selectedAddressId) {
      const def = addresses.find((a) => a.is_default) || addresses[0];
      setSelectedAddressId(def.id);
    }
  }, [addresses, selectedAddressId]);

  if (isCartLoading || isAddressesLoading) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-5xl space-y-6">
        <div className="h-8 w-48 bg-slate-800 rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 h-64 bg-slate-900/60 rounded-xl animate-pulse" />
          <div className="h-64 bg-slate-900/60 rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 text-center space-y-4 max-w-md">
        <h2 className="text-xl font-bold text-white">Your cart is empty</h2>
        <p className="text-xs text-slate-400">
          You must have items in your shopping cart before proceeding to checkout.
        </p>
        <Link to="/marketplace">
          <Button className="bg-emerald-600 hover:bg-emerald-700 text-xs font-semibold">
            Browse Marketplace
          </Button>
        </Link>
      </div>
    );
  }

  const selectedAddress = addresses?.find((a) => a.id === selectedAddressId);

  const handlePlaceOrder = async () => {
    if (!selectedAddressId) {
      setErrorMessage("Please select or add a delivery address to place your order.");
      return;
    }

    setErrorMessage(null);
    try {
      const order = await createOrderMutation.mutateAsync({
        delivery_address_id: selectedAddressId,
        buyer_notes: buyerNotes.trim() || undefined,
      });
      navigate(`/buyer/orders/${order.id}`);
    } catch (err: any) {
      const detail = err?.response?.data?.detail || "Failed to place order.";
      setErrorMessage(detail);
    }
  };

  return (
    <div className="container mx-auto px-4 sm:px-8 py-8 sm:py-12 max-w-6xl space-y-8">
      {/* Header */}
      <div className="border-b border-border/60 pb-4">
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
          <PackageCheck className="w-7 h-7 text-emerald-400" />
          <span>Checkout & Review Order</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Review shipping destination, produce lot specifications, and place wholesale order.
        </p>
      </div>

      {errorMessage && (
        <div className="rounded-xl border border-rose-500/40 bg-rose-950/30 p-4 flex items-start gap-3 text-rose-300 text-xs leading-relaxed">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold text-sm text-white">Order Placement Issue</p>
            <p>{errorMessage}</p>
            {errorMessage.includes("no longer available") && (
              <div className="pt-2">
                <Link to="/buyer/cart">
                  <Button variant="outline" size="sm" className="text-xs h-7 border-rose-500/50 hover:bg-rose-500/10 text-white">
                    Return to Cart & Adjust Quantities
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left 2 Cols: Step 1 Address + Step 2 Items + Notes */}
        <div className="lg:col-span-2 space-y-8">
          {/* STEP 1: Delivery Address */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold font-mono">
                  1
                </span>
                <h2 className="text-base font-bold text-white">Select Delivery Address</h2>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsAddressModalOpen(true)}
                className="text-xs h-8 gap-1.5 border-emerald-500/40 hover:bg-emerald-500/10 text-emerald-300"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add New Address</span>
              </Button>
            </div>

            {addresses && addresses.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {addresses.map((addr) => (
                  <AddressCard
                    key={addr.id}
                    address={addr}
                    isSelectable
                    isSelected={addr.id === selectedAddressId}
                    onSelect={(a) => setSelectedAddressId(a.id)}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-800 bg-slate-900/30 p-6 text-center space-y-3">
                <MapPin className="w-8 h-8 text-slate-500 mx-auto" />
                <p className="text-xs text-slate-400">
                  No saved delivery addresses found. Please add a shipping destination to continue.
                </p>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => setIsAddressModalOpen(true)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Delivery Address</span>
                </Button>
              </div>
            )}
          </section>

          {/* STEP 2: Order Items Snapshot */}
          <section className="space-y-3 border-t border-slate-800/80 pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold font-mono">
                  2
                </span>
                <h2 className="text-base font-bold text-white">Review Produce Lots</h2>
              </div>
              <Link to="/buyer/cart" className="text-xs text-emerald-400 hover:text-emerald-300 font-medium">
                Modify Cart
              </Link>
            </div>

            <div className="rounded-xl border border-border/60 bg-slate-900/60 divide-y divide-slate-800 overflow-hidden">
              {cart.items.map((item) => (
                <div key={item.id} className="p-3.5 sm:p-4 flex items-center justify-between gap-4 text-xs">
                  <div className="space-y-0.5">
                    <h4 className="font-bold text-white text-sm">{item.product.product_name}</h4>
                    <p className="text-slate-400 text-[11px]">
                      Farmer: <span className="text-slate-300">{item.product.farmer_name}</span> ({item.product.farmer_location})
                    </p>
                    <p className="text-slate-400 text-[11px]">
                      {item.quantity} {item.product.quantity_unit} × ₹{item.product.expected_price}/{item.product.quantity_unit}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-white font-mono">
                      ₹{item.subtotal.toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* STEP 3: Buyer Notes */}
          <section className="space-y-2 border-t border-slate-800/80 pt-6">
            <Label htmlFor="buyer_notes" className="text-xs text-slate-300">
              Delivery Notes or Packaging Requirements (Optional)
            </Label>
            <textarea
              id="buyer_notes"
              rows={3}
              value={buyerNotes}
              onChange={(e) => setBuyerNotes(e.target.value)}
              placeholder="e.g. Please deliver to cold room gate #2 before 10:00 AM. Require standard 50kg bags."
              className="w-full rounded-xl border border-slate-800 bg-slate-950/60 p-3 text-xs text-slate-200 placeholder:text-slate-600 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </section>
        </div>

        {/* Right Col: Price Summary & Place Order */}
        <div className="space-y-5">
          <Card className="glass-card border-border/60 sticky top-24">
            <CardContent className="p-5 sm:p-6 space-y-5">
              <h3 className="text-base font-bold text-white border-b border-slate-800 pb-3">
                Order Summary
              </h3>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between text-slate-300">
                  <span>Produce Lots Subtotal ({cart.item_count} items):</span>
                  <span className="font-semibold text-white font-mono text-sm">
                    ₹{cart.subtotal.toLocaleString()}
                  </span>
                </div>

                <div className="flex justify-between text-slate-400">
                  <span className="flex items-center gap-1">
                    <Truck className="w-3.5 h-3.5 text-slate-500" />
                    <span>Logistics & Freight:</span>
                  </span>
                  <span className="text-emerald-400 font-medium">
                    ₹0 (Dispatched by Farm)
                  </span>
                </div>

                <div className="flex justify-between text-slate-400">
                  <span>Platform Processing Fee:</span>
                  <span className="text-emerald-400 font-medium">₹0 (Zero Middleman)</span>
                </div>

                <div className="border-t border-slate-800 pt-3 flex justify-between items-baseline">
                  <span className="text-sm font-bold text-white">Payable Total:</span>
                  <span className="text-2xl font-black text-emerald-400 font-mono">
                    ₹{cart.total_amount.toLocaleString()}
                  </span>
                </div>
              </div>

              {selectedAddress && (
                <div className="rounded-lg bg-slate-950/60 border border-slate-800 p-3 text-[11px] space-y-1">
                  <span className="text-slate-400 font-medium block">Shipping Destination:</span>
                  <p className="font-semibold text-white">{selectedAddress.full_name} ({selectedAddress.phone})</p>
                  <p className="text-slate-300 truncate">
                    {selectedAddress.address_line1}, {selectedAddress.district} — {selectedAddress.pincode}
                  </p>
                </div>
              )}

              <Button
                onClick={handlePlaceOrder}
                disabled={createOrderMutation.isPending || !selectedAddressId}
                className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-2 shadow-lg shadow-emerald-950/40 disabled:opacity-50"
              >
                <span>{createOrderMutation.isPending ? "Placing Order..." : "Place Order Now"}</span>
                <ArrowRight className="w-4 h-4" />
              </Button>

              <div className="text-[11px] text-slate-400 space-y-2 border-t border-slate-800/80 pt-3">
                <div className="flex items-center gap-1.5 text-slate-300 font-medium">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Verified Mandi Transaction</span>
                </div>
                <p className="text-[10px] leading-relaxed text-slate-400">
                  Your order is submitted in PENDING state to the farmer. Payment settlement and cold-chain transit will be coordinated in upcoming stages.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add Address Modal */}
      <AddressFormModal
        isOpen={isAddressModalOpen}
        onClose={() => setIsAddressModalOpen(false)}
        onSuccess={(newAddr) => setSelectedAddressId(newAddr.id)}
      />
    </div>
  );
};
