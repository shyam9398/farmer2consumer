import React, { useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Phone,
  Truck,
  ShieldCheck,
  AlertTriangle,
  XCircle,
  Star,
  Navigation,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OrderStatusBadge } from "@/components/order/OrderStatusBadge";
import { OrderStatusTimeline } from "@/components/order/OrderStatusTimeline";
import { useBuyerOrder, useCancelOrder } from "@/hooks/useOrders";
import { ReviewModal } from "@/components/buyer/ReviewModal";
import { apiClient } from "@/lib/axios";

export const BuyerOrderDetailPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const { data: order, isLoading, error, refetch } = useBuyerOrder(orderId);
  const cancelMutation = useCancelOrder();

  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [isBookingLogistics, setIsBookingLogistics] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);

  // Review modal state
  const [selectedReviewItem, setSelectedReviewItem] = useState<{
    id: string;
    product_name: string;
    farmer_name: string;
  } | null>(null);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-5xl space-y-6">
        <div className="h-8 w-48 bg-slate-800 rounded animate-pulse" />
        <div className="h-64 bg-slate-900/60 rounded-xl animate-pulse" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="container mx-auto px-4 py-16 text-center space-y-4 max-w-md">
        <h2 className="text-xl font-bold text-white">Order not found</h2>
        <p className="text-xs text-slate-400">
          The requested purchase order could not be located or you do not have permission to view it.
        </p>
        <Link to="/buyer/orders">
          <Button variant="outline" size="sm" className="text-xs">
            Back to Orders
          </Button>
        </Link>
      </div>
    );
  }

  const isPending = order.status === "PENDING";
  const isDelivered = order.status === "DELIVERED";
  const address = order.delivery_address_snapshot;

  const handleBookLogistics = async () => {
    if (!orderId) return;
    setIsBookingLogistics(true);
    setBookingError(null);
    try {
      await apiClient.post(`/orders/${orderId}/book-logistics`);
      refetch();
    } catch (err: any) {
      setBookingError(err?.response?.data?.detail || "Failed to book logistics.");
    } finally {
      setIsBookingLogistics(false);
    }
  };

  const handleConfirmCancel = async () => {
    if (!orderId) return;
    try {
      await cancelMutation.mutateAsync({
        orderId,
        reason: cancelReason.trim() || undefined,
      });
      setIsCancelModalOpen(false);
    } catch (err) {
      console.error("Failed to cancel order:", err);
    }
  };

  return (
    <div className="container mx-auto px-4 sm:px-8 py-8 sm:py-12 max-w-5xl space-y-8">
      {/* Top navigation */}
      <div className="flex items-center justify-between">
        <Link
          to="/buyer/orders"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to My Orders</span>
        </Link>

        <div className="flex items-center gap-2">
          {order.logistics && (
            <Link to={`/buyer/orders/${order.id}/tracking`}>
              <Button
                variant="outline"
                size="sm"
                className="text-emerald-400 border-emerald-500/40 hover:bg-emerald-500/10 text-xs gap-1.5 h-8"
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>Track Live</span>
              </Button>
            </Link>
          )}

          {isPending && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsCancelModalOpen(true)}
              className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 text-xs gap-1.5 h-8"
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>Cancel Order</span>
            </Button>
          )}
        </div>
      </div>

      {/* Order Header Card */}
      <div className="rounded-2xl border border-border/60 bg-slate-900/60 p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <span className="text-xl sm:text-2xl font-black text-white font-mono tracking-tight">
                Order #{order.order_number}
              </span>
              <OrderStatusBadge status={order.status} />
            </div>
            <p className="text-xs text-slate-400 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <span>
                Placed on: {new Date(order.created_at).toLocaleString("en-IN", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </span>
            </p>
          </div>

          <div className="text-left sm:text-right">
            <span className="text-[10px] text-slate-400 block uppercase font-mono">
              Total Order Value
            </span>
            <span className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono">
              ₹{order.total_amount.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Order Lifecycle Progress Timeline */}
        <OrderStatusTimeline
          currentStatus={order.status}
          history={order.status_history || []}
        />
      </div>

      {/* 2-Col Layout: Items vs Destination & Financials */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Items List (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
            Purchased Harvest Lots ({order.items.length})
          </h3>

          <div className="rounded-xl border border-border/60 bg-slate-900/60 divide-y divide-slate-800 overflow-hidden">
            {order.items.map((item) => (
              <div key={item.id} className="p-4 sm:p-5 flex items-start justify-between gap-4">
                <div className="space-y-1 flex-1">
                  <h4 className="font-bold text-white text-base">
                    {item.product_name}
                  </h4>
                  <p className="text-xs text-slate-400">
                    Verified Farmer: <span className="text-slate-300 font-medium">{item.farmer_name}</span>
                  </p>
                  <p className="text-xs text-emerald-400 font-medium pt-1">
                    {item.quantity} {item.quantity_unit} × ₹{item.unit_price} / {item.quantity_unit}
                  </p>

                  {/* Review Button if Delivered */}
                  {isDelivered && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setSelectedReviewItem({
                          id: item.id,
                          product_name: item.product_name,
                          farmer_name: item.farmer_name || "Verified Farmer",
                        })
                      }
                      className="mt-2 text-xs border-amber-500/40 text-amber-300 hover:bg-amber-500/10 gap-1.5 h-7"
                    >
                      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                      <span>Rate & Review Produce</span>
                    </Button>
                  )}
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">Line Total</span>
                  <span className="text-base font-bold text-white font-mono">
                    ₹{item.subtotal.toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {order.buyer_notes && (
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-1 text-xs">
              <span className="font-semibold text-slate-300 block">Packaging / Delivery Instructions:</span>
              <p className="text-slate-400 italic leading-relaxed">{order.buyer_notes}</p>
            </div>
          )}
        </div>

        {/* Destination & Summary (1 col) */}
        <div className="space-y-6">
          {/* Logistics & Delivery Tracking Card */}
          {order.logistics ? (
            <Card className="glass-card border-border/60 border-emerald-500/30 bg-emerald-950/10">
              <CardHeader className="pb-3">
                <CardTitle className="text-xs font-bold uppercase font-mono text-emerald-400 flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Logistics & Fulfillment</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-xs text-slate-300">
                <Link to={`/buyer/orders/${order.id}/tracking`}>
                  <Button
                    size="sm"
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs gap-1.5 mb-2 shadow-lg shadow-emerald-900/30"
                  >
                    <Navigation className="h-3.5 w-3.5" />
                    <span>Track Live GPS Delivery</span>
                  </Button>
                </Link>

                {order.logistics.estimated_delivery_at && (
                  <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                    <span className="text-[10px] text-slate-400 uppercase font-mono block">Estimated Delivery</span>
                    <span className="text-sm font-bold text-white">
                      {new Date(order.logistics.estimated_delivery_at).toLocaleString("en-IN", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </span>
                  </div>
                )}

                {order.logistics.collection_point && (
                  <div>
                    <span className="text-slate-400 block text-[11px]">Aggregation Hub:</span>
                    <p className="font-semibold text-white">{order.logistics.collection_point.name}</p>
                    <p className="text-slate-400 text-[11px]">{order.logistics.collection_point.district}, {order.logistics.collection_point.state}</p>
                  </div>
                )}

                {order.logistics.assigned_agent_name && (
                  <div className="pt-2 border-t border-slate-800 space-y-1 text-slate-400">
                    <p className="text-white font-medium">
                      Assigned Agent: {order.logistics.assigned_agent_name}
                      {order.logistics.assigned_agent_phone && ` (${order.logistics.assigned_agent_phone})`}
                    </p>
                    {order.logistics.vehicle_number && (
                      <p className="text-[11px]">Vehicle: {order.logistics.vehicle_type || "Transport"} ({order.logistics.vehicle_number})</p>
                    )}
                  </div>
                )}

                {order.logistics.delivery_confirmation && (
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-emerald-500/30 space-y-1">
                    <span className="text-[10px] text-emerald-400 font-bold uppercase font-mono block flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" />
                      Delivery Confirmed
                    </span>
                    <p className="text-white">Received by: {order.logistics.delivery_confirmation.recipient_name}</p>
                    <p className="text-[11px] text-slate-400">
                      Confirmed at: {new Date(order.logistics.delivery_confirmation.confirmed_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className="glass-card border-emerald-500/30 bg-emerald-950/20">
              <CardContent className="p-4 space-y-3 text-xs">
                <div className="flex items-center gap-2 text-emerald-400 font-bold">
                  <Truck className="h-4 w-4" />
                  <span>Fleet Logistics Booking</span>
                </div>
                <p className="text-slate-300">
                  Book end-to-end collection and delivery from farmer farm gate to your location.
                </p>
                {bookingError && (
                  <p className="text-rose-400 text-[11px]">{bookingError}</p>
                )}
                <Button
                  size="sm"
                  onClick={handleBookLogistics}
                  disabled={isBookingLogistics}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs gap-1.5"
                >
                  {isBookingLogistics ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Truck className="h-3.5 w-3.5" />
                  )}
                  <span>Book Fleet Logistics</span>
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Shipping Address */}
          <Card className="glass-card border-border/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-xs font-bold uppercase font-mono text-slate-400 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                <span>Delivery Destination</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1.5 text-xs text-slate-300">
              <p className="font-bold text-white text-sm">{address.full_name}</p>
              <p className="text-slate-300 flex items-center gap-1">
                <Phone className="w-3 h-3 text-slate-500" />
                <span>{address.phone}</span>
              </p>
              <div className="pt-1 text-slate-400 space-y-0.5">
                <p>{address.address_line1}</p>
                {address.address_line2 && <p>{address.address_line2}</p>}
                <p>
                  {[address.village, address.mandal].filter(Boolean).join(", ")}
                </p>
                <p className="font-semibold text-white">
                  {address.district}, {address.state} — {address.pincode}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Financial Breakdown */}
          <Card className="glass-card border-border/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-xs font-bold uppercase font-mono text-slate-400">
                Payment & Totals
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="flex justify-between text-slate-300">
                <span>Produce Subtotal:</span>
                <span className="font-semibold text-white font-mono">
                  ₹{order.subtotal.toLocaleString()}
                </span>
              </div>

              <div className="flex justify-between text-slate-400">
                <span>Freight & Cold Chain:</span>
                <span className="text-emerald-400 font-medium">₹0 (Included)</span>
              </div>

              <div className="flex justify-between text-slate-400">
                <span>Payment State:</span>
                <span className="font-semibold text-amber-400">{order.payment_status}</span>
              </div>

              <div className="border-t border-slate-800 pt-2.5 flex justify-between items-baseline">
                <span className="font-bold text-white text-sm">Total Amount:</span>
                <span className="text-xl font-black text-emerald-400 font-mono">
                  ₹{order.total_amount.toLocaleString()}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Cancel Order Confirmation Modal */}
      {isCancelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Confirm Order Cancellation</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Are you sure you want to cancel Order #{order.order_number}?
                  The reserved harvest quantities will be immediately returned to the farmer's marketplace stock.
                </p>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-slate-300">Reason for Cancellation (Optional)</label>
              <textarea
                rows={2}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="e.g. Changed order requirement or delivery date..."
                className="w-full rounded-lg border border-slate-800 bg-slate-950 p-2.5 text-xs text-white focus:outline-none focus:border-rose-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsCancelModalOpen(false)}
                disabled={cancelMutation.isPending}
                className="text-xs"
              >
                Keep Order
              </Button>
              <Button
                size="sm"
                onClick={handleConfirmCancel}
                disabled={cancelMutation.isPending}
                className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold"
              >
                {cancelMutation.isPending ? "Cancelling..." : "Yes, Cancel Order"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {selectedReviewItem && (
        <ReviewModal
          isOpen={Boolean(selectedReviewItem)}
          onClose={() => setSelectedReviewItem(null)}
          orderId={order.id}
          orderItemId={selectedReviewItem.id}
          produceName={selectedReviewItem.product_name}
          farmerName={selectedReviewItem.farmer_name}
          onReviewSubmitted={() => refetch()}
        />
      )}
    </div>
  );
};
