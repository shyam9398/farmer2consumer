import React, { useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Phone,
  CheckCircle2,
  XCircle,
  Package,
  AlertTriangle,
  Building,
  Truck,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OrderStatusBadge } from "@/components/order/OrderStatusBadge";
import { OrderStatusTimeline } from "@/components/order/OrderStatusTimeline";
import { useFarmerOrder, useUpdateFarmerOrderStatus } from "@/hooks/useOrders";
import { OrderStatus } from "@/types/order";

export const FarmerOrderDetailPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const { data: order, isLoading, error } = useFarmerOrder(orderId);
  const statusMutation = useUpdateFarmerOrderStatus();

  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectError, setRejectError] = useState("");

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
          This order does not contain produce from your farm or access is unauthorized.
        </p>
        <Link to="/farmer/orders">
          <Button variant="outline" size="sm" className="text-xs">
            Back to Orders
          </Button>
        </Link>
      </div>
    );
  }

  const handleUpdateStatus = async (targetStatus: OrderStatus, reason?: string) => {
    if (!orderId) return;

    if (targetStatus === "REJECTED" && (!reason || !reason.trim())) {
      setRejectError("A mandatory rejection reason is required.");
      return;
    }

    try {
      setRejectError("");
      await statusMutation.mutateAsync({
        orderId,
        status: targetStatus,
        reason,
      });
      if (targetStatus === "REJECTED") {
        setIsRejectModalOpen(false);
        setRejectReason("");
      }
    } catch (err: any) {
      console.error("Failed to update order status:", err);
      const detail = err?.response?.data?.detail || err.message;
      setRejectError(detail);
    }
  };

  const isPending = order.status === "PENDING";
  const isAccepted = order.status === "ACCEPTED";
  const isPreparing = order.status === "PREPARING";
  const isReadyForPickup = order.status === "READY_FOR_PICKUP";

  const logistics = order.logistics;
  const cp = logistics?.collection_point;

  return (
    <div className="container mx-auto px-4 sm:px-8 py-8 sm:py-12 max-w-5xl space-y-8">
      {/* Back button */}
      <div className="flex items-center justify-between">
        <Link
          to="/farmer/orders"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Farm Orders</span>
        </Link>
      </div>

      {/* Header Card */}
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
                Received: {new Date(order.created_at).toLocaleString("en-IN", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </span>
            </p>
          </div>

          <div className="text-left sm:text-right">
            <span className="text-[10px] text-slate-400 block uppercase font-mono">
              Your Produce Lot Earnings
            </span>
            <span className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono">
              ₹{order.farmer_subtotal.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Status Timeline */}
        <OrderStatusTimeline
          currentStatus={order.status}
          history={order.status_history || []}
        />

        {/* Workflow Action Bar */}
        {(isPending || isAccepted || isPreparing || isReadyForPickup) && (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="space-y-0.5 text-xs">
              <span className="font-bold text-white block">Required Action:</span>
              <p className="text-slate-300">
                {isPending
                  ? "A wholesale buyer has requested produce from your farm. Confirm availability to accept."
                  : isAccepted
                  ? "Order is confirmed. When you commence harvesting, cleaning, and sorting, mark preparing."
                  : isPreparing
                  ? "Produce is being prepared. When packed in crates and ready for logistics dispatch, mark ready."
                  : "Produce is marked ready. Mandi Direct logistics will collect it from the collection aggregation hub."}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
              {isPending && (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setRejectError("");
                      setIsRejectModalOpen(true);
                    }}
                    disabled={statusMutation.isPending}
                    className="border-rose-500/40 text-rose-300 hover:bg-rose-500/10 text-xs h-9"
                  >
                    <XCircle className="w-3.5 h-3.5 mr-1" />
                    <span>Reject Order</span>
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => handleUpdateStatus("ACCEPTED")}
                    disabled={statusMutation.isPending}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold h-9"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                    <span>{statusMutation.isPending ? "Accepting..." : "Accept Order"}</span>
                  </Button>
                </>
              )}

              {isAccepted && (
                <Button
                  type="button"
                  size="sm"
                  onClick={() => handleUpdateStatus("PREPARING")}
                  disabled={statusMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold h-9"
                >
                  <Package className="w-3.5 h-3.5 mr-1" />
                  <span>Start Harvesting & Packing</span>
                </Button>
              )}

              {isPreparing && (
                <Button
                  type="button"
                  size="sm"
                  onClick={() => handleUpdateStatus("READY_FOR_PICKUP")}
                  disabled={statusMutation.isPending}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold h-9"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                  <span>Mark Ready for Pickup</span>
                </Button>
              )}

              {isReadyForPickup && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Produce Ready for Collection</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 2-Col Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Your Produce Lots (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
            Your Requested Produce Lots ({order.items.length})
          </h3>

          <div className="rounded-xl border border-border/60 bg-slate-900/60 divide-y divide-slate-800 overflow-hidden">
            {order.items.map((item) => (
              <div key={item.id} className="p-4 sm:p-5 flex items-start justify-between gap-4">
                <div className="space-y-1.5">
                  <h4 className="font-bold text-white text-base">
                    {item.product_name}
                  </h4>
                  <div className="flex flex-wrap gap-2 text-xs">
                    {item.variety && (
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-medium">
                        Variety: {item.variety}
                      </span>
                    )}
                    {item.quality_grade && (
                      <span className="px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 font-semibold">
                        Grade: {item.quality_grade}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-emerald-400 font-medium pt-1">
                    Fulfillment Quantity: {item.quantity} {item.quantity_unit} @ ₹{item.unit_price} / {item.quantity_unit}
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">Subtotal</span>
                  <span className="text-base font-bold text-white font-mono">
                    ₹{item.subtotal.toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {order.buyer_notes && (
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-1 text-xs">
              <span className="font-semibold text-slate-300 block">Buyer Notes:</span>
              <p className="text-slate-400 italic leading-relaxed">{order.buyer_notes}</p>
            </div>
          )}
        </div>

        {/* Fulfillment & Collection Instructions (1 col) */}
        <div className="space-y-6">
          {/* Collection Aggregation Center Info */}
          {cp ? (
            <Card className="glass-card border-border/60 border-cyan-500/30 bg-cyan-950/10">
              <CardHeader className="pb-3">
                <CardTitle className="text-xs font-bold uppercase font-mono text-cyan-400 flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Produce Collection Point</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-xs text-slate-300">
                <div>
                  <p className="font-bold text-white text-sm">{cp.name}</p>
                  <p className="text-slate-400 text-xs mt-0.5">{cp.address}</p>
                  <p className="text-slate-400 text-xs">
                    {cp.village ? `${cp.village}, ` : ""}{cp.district}, {cp.state} — {cp.pincode}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-800 space-y-1 text-slate-400">
                  <p className="flex items-center gap-1.5 text-white">
                    <Phone className="w-3 h-3 text-cyan-400" />
                    <span>Hub Contact: {cp.contact_name} ({cp.contact_phone})</span>
                  </p>
                  {logistics?.pickup_scheduled_at && (
                    <p className="flex items-center gap-1.5 text-emerald-400 font-semibold pt-1">
                      <Clock className="w-3 h-3" />
                      <span>Scheduled Pickup: {new Date(logistics.pickup_scheduled_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</span>
                    </p>
                  )}
                  {logistics?.vehicle_number && (
                    <p className="flex items-center gap-1.5 text-slate-300">
                      <Truck className="w-3 h-3 text-slate-400" />
                      <span>Vehicle: {logistics.vehicle_type || "Transport"} ({logistics.vehicle_number})</span>
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="glass-card border-border/60">
              <CardHeader className="pb-3">
                <CardTitle className="text-xs font-bold uppercase font-mono text-slate-400 flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-slate-400" />
                  <span>Collection Arrangement</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-slate-400">
                <p>Logistics aggregation hub will be assigned by the Mandi Direct dispatch desk once produce is prepared.</p>
              </CardContent>
            </Card>
          )}

          {/* Buyer Fulfillment Summary */}
          <Card className="glass-card border-border/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-xs font-bold uppercase font-mono text-slate-400 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                <span>Delivery Destination</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs text-slate-300">
              <p className="font-bold text-white text-sm">{order.buyer_name}</p>
              <div className="pt-1 text-slate-400 space-y-0.5">
                <p>{order.delivery_address?.address_line1}</p>
                <p className="font-semibold text-white">
                  {order.delivery_address?.district}, {order.delivery_address?.state} — {order.delivery_address?.pincode}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Decline Order Modal */}
      {isRejectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Decline Produce Lot</h3>
                <p className="text-xs text-slate-400 mt-1">
                  If you cannot fulfill this harvest lot, declining will notify the buyer and restore the stock to your farm inventory.
                </p>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-slate-300 font-semibold flex items-center justify-between">
                <span>Reason for Declining * (Mandatory)</span>
              </label>
              <textarea
                rows={3}
                value={rejectReason}
                onChange={(e) => {
                  setRejectReason(e.target.value);
                  if (rejectError) setRejectError("");
                }}
                placeholder="e.g. Inclement weather delayed harvest, or unexpected crop damage..."
                className="w-full rounded-lg border border-slate-800 bg-slate-950 p-2.5 text-xs text-white focus:outline-none focus:border-rose-500 placeholder-slate-600"
              />
              {rejectError && (
                <p className="text-xs text-rose-400 font-medium">{rejectError}</p>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsRejectModalOpen(false)}
                disabled={statusMutation.isPending}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={() => handleUpdateStatus("REJECTED", rejectReason)}
                disabled={statusMutation.isPending || !rejectReason.trim()}
                className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold"
              >
                {statusMutation.isPending ? "Declining..." : "Decline Lot"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default FarmerOrderDetailPage;
