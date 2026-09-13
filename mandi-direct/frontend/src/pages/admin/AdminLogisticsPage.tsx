import React, { useState } from "react";
import {
  Truck,
  Calendar,
  MapPin,
  Clock,
  CheckCircle2,
  Building,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AdminNav } from "@/components/admin/AdminNav";
import { OrderStatusBadge } from "@/components/order/OrderStatusBadge";
import {
  useLogisticsDashboard,
  useSchedulePickup,
  useCompletePickup,
  useStartDelivery,
  useCompleteDelivery,
  useActiveCollectionPoints,
} from "@/hooks/useLogistics";
import { LogisticsOrderSummary } from "@/types/logistics";

export const AdminLogisticsPage: React.FC = () => {
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [districtFilter, setDistrictFilter] = useState("");
  const [collectionPointFilter, setCollectionPointFilter] = useState("ALL");

  // Modals state
  const [activeOrder, setActiveOrder] = useState<LogisticsOrderSummary | null>(null);
  const [modalType, setModalType] = useState<"SCHEDULE" | "COMPLETE_PICKUP" | "START_DELIVERY" | "COMPLETE_DELIVERY" | null>(null);

  // Form states
  const [scheduleData, setScheduleData] = useState({
    pickup_scheduled_at: "",
    collection_point_id: "",
    assigned_agent_name: "",
    assigned_agent_phone: "",
    vehicle_type: "Mini Truck (Tata Ace)",
    vehicle_number: "",
    pickup_notes: "",
  });
  const [pickupNotes, setPickupNotes] = useState("");
  const [deliveryData, setDeliveryData] = useState({
    estimated_delivery_at: "",
    notes: "",
  });
  const [confirmationData, setConfirmationData] = useState({
    recipient_name: "",
    confirmation_type: "MANUAL",
    notes: "",
  });
  const [actionError, setActionError] = useState("");

  const { data: dashboard, isLoading } = useLogisticsDashboard({
    status: statusFilter,
    district: districtFilter || undefined,
    collection_point_id: collectionPointFilter,
  });

  const { data: activeHubs } = useActiveCollectionPoints();

  const scheduleMutation = useSchedulePickup();
  const completePickupMutation = useCompletePickup();
  const startDeliveryMutation = useStartDelivery();
  const completeDeliveryMutation = useCompleteDelivery();

  const handleOpenSchedule = (order: LogisticsOrderSummary) => {
    setActiveOrder(order);
    const now = new Date();
    now.setHours(now.getHours() + 2);
    const defaultTime = now.toISOString().slice(0, 16);

    setScheduleData({
      pickup_scheduled_at: defaultTime,
      collection_point_id: order.logistics?.collection_point_id || (activeHubs?.items[0]?.id || ""),
      assigned_agent_name: order.logistics?.assigned_agent_name || "Mandi Express Logistics",
      assigned_agent_phone: order.logistics?.assigned_agent_phone || "+919876543210",
      vehicle_type: order.logistics?.vehicle_type || "Cold Chain Mini-Truck (Tata Ace)",
      vehicle_number: order.logistics?.vehicle_number || "TS08EA5432",
      pickup_notes: "",
    });
    setActionError("");
    setModalType("SCHEDULE");
  };

  const handleOpenCompletePickup = (order: LogisticsOrderSummary) => {
    setActiveOrder(order);
    setPickupNotes("Produce batch aggregated and verified at collection hub.");
    setActionError("");
    setModalType("COMPLETE_PICKUP");
  };

  const handleOpenStartDelivery = (order: LogisticsOrderSummary) => {
    setActiveOrder(order);
    const now = new Date();
    now.setHours(now.getHours() + 4);
    setDeliveryData({
      estimated_delivery_at: now.toISOString().slice(0, 16),
      notes: "En route to buyer commercial destination.",
    });
    setActionError("");
    setModalType("START_DELIVERY");
  };

  const handleOpenCompleteDelivery = (order: LogisticsOrderSummary) => {
    setActiveOrder(order);
    setConfirmationData({
      recipient_name: order.buyer_name,
      confirmation_type: "MANUAL",
      notes: "Received produce crates intact with quality verification.",
    });
    setActionError("");
    setModalType("COMPLETE_DELIVERY");
  };

  const handleCloseModal = () => {
    setModalType(null);
    setActiveOrder(null);
    setActionError("");
  };

  const submitSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeOrder || !scheduleData.pickup_scheduled_at) return;
    try {
      await scheduleMutation.mutateAsync({
        orderId: activeOrder.id,
        data: {
          pickup_scheduled_at: new Date(scheduleData.pickup_scheduled_at).toISOString(),
          collection_point_id: scheduleData.collection_point_id || undefined,
          assigned_agent_name: scheduleData.assigned_agent_name || undefined,
          assigned_agent_phone: scheduleData.assigned_agent_phone || undefined,
          vehicle_type: scheduleData.vehicle_type || undefined,
          vehicle_number: scheduleData.vehicle_number || undefined,
          pickup_notes: scheduleData.pickup_notes || undefined,
        },
      });
      handleCloseModal();
    } catch (err: any) {
      setActionError(err?.response?.data?.detail || "Failed to schedule pickup.");
    }
  };

  const submitCompletePickup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeOrder) return;
    try {
      await completePickupMutation.mutateAsync({
        orderId: activeOrder.id,
        notes: pickupNotes,
      });
      handleCloseModal();
    } catch (err: any) {
      setActionError(err?.response?.data?.detail || "Failed to complete pickup.");
    }
  };

  const submitStartDelivery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeOrder) return;
    try {
      await startDeliveryMutation.mutateAsync({
        orderId: activeOrder.id,
        data: {
          estimated_delivery_at: deliveryData.estimated_delivery_at
            ? new Date(deliveryData.estimated_delivery_at).toISOString()
            : undefined,
          notes: deliveryData.notes || undefined,
        },
      });
      handleCloseModal();
    } catch (err: any) {
      setActionError(err?.response?.data?.detail || "Failed to start delivery.");
    }
  };

  const submitCompleteDelivery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeOrder || !confirmationData.recipient_name.trim()) {
      setActionError("Recipient name is required for delivery confirmation.");
      return;
    }
    try {
      await completeDeliveryMutation.mutateAsync({
        orderId: activeOrder.id,
        data: {
          recipient_name: confirmationData.recipient_name.trim(),
          confirmation_type: confirmationData.confirmation_type,
          notes: confirmationData.notes || undefined,
        },
      });
      handleCloseModal();
    } catch (err: any) {
      setActionError(err?.response?.data?.detail || "Failed to confirm delivery.");
    }
  };

  return (
    <div className="container mx-auto px-4 sm:px-8 py-8 space-y-8 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <Truck className="w-7 h-7 text-emerald-400" />
            <span>Logistics & Fulfillment Command</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Coordinate aggregation hub collection, fleet dispatch, and institutional delivery confirmations.
          </p>
        </div>
      </div>

      <AdminNav />

      {/* Stats Cards */}
      {dashboard?.stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
            <span className="text-[10px] font-semibold uppercase text-amber-400">Ready for Pickup</span>
            <span className="text-2xl font-black text-amber-400 font-mono block mt-1">
              {dashboard.stats.ready_for_pickup}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
            <span className="text-[10px] font-semibold uppercase text-cyan-400">Picked Up</span>
            <span className="text-2xl font-black text-cyan-400 font-mono block mt-1">
              {dashboard.stats.picked_up}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
            <span className="text-[10px] font-semibold uppercase text-blue-400">Out for Delivery</span>
            <span className="text-2xl font-black text-blue-400 font-mono block mt-1">
              {dashboard.stats.out_for_delivery}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
            <span className="text-[10px] font-semibold uppercase text-emerald-400">Delivered Today</span>
            <span className="text-2xl font-black text-emerald-400 font-mono block mt-1">
              {dashboard.stats.delivered_today}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
            <span className="text-[10px] font-semibold uppercase text-purple-400">Active In-Transit</span>
            <span className="text-2xl font-black text-purple-400 font-mono block mt-1">
              {dashboard.stats.total_active_deliveries}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
            <span className="text-[10px] font-semibold uppercase text-slate-400">Today's Pickups</span>
            <span className="text-2xl font-black text-white font-mono block mt-1">
              {dashboard.stats.today_scheduled_pickups}
            </span>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-slate-900/80 border border-slate-800 rounded-xl text-xs text-slate-300 px-3 py-2 focus:outline-none focus:border-emerald-500"
        >
          <option value="ALL">All Statuses</option>
          <option value="PENDING">Pending Farmer</option>
          <option value="ACCEPTED">Accepted</option>
          <option value="PREPARING">Harvesting/Preparing</option>
          <option value="READY_FOR_PICKUP">Ready for Pickup</option>
          <option value="PICKED_UP">Picked Up</option>
          <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
          <option value="DELIVERED">Delivered</option>
        </select>

        {activeHubs && (
          <select
            value={collectionPointFilter}
            onChange={(e) => setCollectionPointFilter(e.target.value)}
            className="bg-slate-900/80 border border-slate-800 rounded-xl text-xs text-slate-300 px-3 py-2 focus:outline-none focus:border-emerald-500"
          >
            <option value="ALL">All Aggregation Hubs</option>
            {activeHubs.items.map((hub) => (
              <option key={hub.id} value={hub.id}>
                {hub.name} ({hub.district})
              </option>
            ))}
          </select>
        )}

        <input
          type="text"
          placeholder="Filter by district (e.g. Hyderabad, Medak)"
          value={districtFilter}
          onChange={(e) => setDistrictFilter(e.target.value)}
          className="flex-1 px-3.5 py-2 bg-slate-900/80 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
        />
      </div>

      {/* Orders List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-44 bg-slate-900/60 rounded-xl border border-slate-800 animate-pulse" />
          ))}
        </div>
      ) : !dashboard || dashboard.orders.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/40 p-12 text-center space-y-3">
          <Truck className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-white">No active logistics orders matching filter</h3>
          <p className="text-xs text-slate-400">
            Orders will appear here as soon as farmers mark lots ready for pickup or when buyer checkouts complete.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {dashboard.orders.map((ord) => {
            const isReady = ord.status === "READY_FOR_PICKUP";
            const isPickedUp = ord.status === "PICKED_UP";
            const isOutForDelivery = ord.status === "OUT_FOR_DELIVERY";
            const isDelivered = ord.status === "DELIVERED";

            return (
              <Card
                key={ord.id}
                className="glass-card border-border/60 hover:border-emerald-500/30 transition-all overflow-hidden"
              >
                <CardContent className="p-5 space-y-4">
                  {/* Top Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-sm font-bold text-emerald-400">#{ord.order_number}</span>
                      <OrderStatusBadge status={ord.status as any} />
                      <span className="text-xs text-slate-400">
                        {new Date(ord.created_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400">Total Value:</span>
                      <span className="text-base font-bold text-white font-mono">₹{ord.total_amount.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* 3-Col Order Logistics Breakdown */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                    {/* Col 1: Farmers & Produce Breakdown (Multi-Farmer Isolation Support) */}
                    <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                      <span className="font-bold text-white block uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                        <Building className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Source Farmers ({ord.farmers.length})</span>
                      </span>

                      <div className="space-y-2 divide-y divide-slate-800/80">
                        {ord.farmers.map((farmer, fIdx) => (
                          <div key={fIdx} className="pt-1.5 first:pt-0 space-y-0.5">
                            <p className="font-semibold text-emerald-300">
                              {farmer.farmer_name} {farmer.farm_name ? `(${farmer.farm_name})` : ""}
                            </p>
                            <p className="text-slate-400 text-[11px]">
                              {farmer.village ? `${farmer.village}, ` : ""}{farmer.district || "Telangana"} {farmer.phone ? `· ${farmer.phone}` : ""}
                            </p>
                            <div className="flex flex-wrap gap-1 pt-1">
                              {farmer.products.map((p, pIdx) => (
                                <span key={pIdx} className="px-1.5 py-0.2 rounded bg-slate-800 text-[10px] text-slate-300">
                                  {p}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Col 2: Collection Hub & Scheduled Dispatch */}
                    <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                      <span className="font-bold text-white block uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                        <Truck className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Aggregation & Dispatch</span>
                      </span>

                      <div className="space-y-1.5 text-slate-300">
                        {ord.logistics?.collection_point ? (
                          <>
                            <p className="font-semibold text-white">{ord.logistics.collection_point.name}</p>
                            <p className="text-slate-400 text-[11px]">{ord.logistics.collection_point.address}</p>
                            <p className="text-slate-400 text-[11px]">
                              Contact: {ord.logistics.collection_point.contact_name} ({ord.logistics.collection_point.contact_phone})
                            </p>
                          </>
                        ) : (
                          <p className="text-slate-500 italic">No aggregation hub configured yet.</p>
                        )}

                        {ord.logistics?.pickup_scheduled_at && (
                          <p className="text-amber-400 font-semibold pt-1 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>Pickup: {new Date(ord.logistics.pickup_scheduled_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</span>
                          </p>
                        )}

                        {ord.logistics?.assigned_agent_name && (
                          <p className="text-slate-300 text-[11px]">
                            Fleet Agent: {ord.logistics.assigned_agent_name} ({ord.logistics.vehicle_number || "N/A"})
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Col 3: Destination Buyer & Handover Status */}
                    <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                      <span className="font-bold text-white block uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Buyer Destination</span>
                      </span>

                      <div className="space-y-1 text-slate-300">
                        <p className="font-semibold text-white">{ord.buyer_name}</p>
                        {ord.buyer_phone && <p className="text-slate-400 text-[11px]">{ord.buyer_phone}</p>}
                        <p className="text-slate-400 text-[11px]">{ord.delivery_city}, {ord.delivery_state} — {ord.delivery_pincode}</p>

                        {ord.logistics?.estimated_delivery_at && (
                          <p className="text-emerald-400 font-medium pt-1">
                            Est. Handover: {new Date(ord.logistics.estimated_delivery_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                          </p>
                        )}

                        {ord.logistics?.delivery_confirmation && (
                          <div className="pt-1.5 border-t border-slate-800 text-emerald-300 flex items-center gap-1 font-semibold">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Confirmed by {ord.logistics.delivery_confirmation.recipient_name}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Logistics Action Buttons Bar */}
                  <div className="pt-2 flex flex-wrap items-center justify-end gap-2 border-t border-slate-800">
                    {/* Schedule Pickup (Available when ACCEPTED, PREPARING, or READY_FOR_PICKUP) */}
                    {(ord.status === "ACCEPTED" || ord.status === "PREPARING" || isReady) && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenSchedule(ord)}
                        className="text-xs h-8 border-slate-700 hover:border-emerald-500"
                      >
                        <Calendar className="w-3.5 h-3.5 mr-1 text-emerald-400" />
                        <span>Schedule Pickup</span>
                      </Button>
                    )}

                    {/* Complete Pickup */}
                    {isReady && (
                      <Button
                        size="sm"
                        onClick={() => handleOpenCompletePickup(ord)}
                        className="bg-cyan-600 hover:bg-cyan-700 text-white text-xs h-8 font-semibold"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                        <span>Complete Pickup (Mark Picked Up)</span>
                      </Button>
                    )}

                    {/* Start Delivery */}
                    {isPickedUp && (
                      <Button
                        size="sm"
                        onClick={() => handleOpenStartDelivery(ord)}
                        className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-8 font-semibold"
                      >
                        <Truck className="w-3.5 h-3.5 mr-1" />
                        <span>Start Delivery (Dispatch)</span>
                      </Button>
                    )}

                    {/* Complete Delivery */}
                    {isOutForDelivery && (
                      <Button
                        size="sm"
                        onClick={() => handleOpenCompleteDelivery(ord)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8 font-semibold"
                      >
                        <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                        <span>Confirm Delivery & Handover</span>
                      </Button>
                    )}

                    {isDelivered && (
                      <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold px-3 py-1 rounded bg-emerald-500/10 border border-emerald-500/20">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Fulfillment Completed</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Schedule Pickup Modal */}
      {modalType === "SCHEDULE" && activeOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-400" />
                <span>Schedule Logistics Pickup · Order #{activeOrder.order_number}</span>
              </h3>
              <button type="button" onClick={handleCloseModal} className="text-slate-400 hover:text-white">✕</button>
            </div>

            {actionError && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                {actionError}
              </div>
            )}

            <form onSubmit={submitSchedule} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Scheduled Pickup Time *</label>
                <input
                  type="datetime-local"
                  required
                  value={scheduleData.pickup_scheduled_at}
                  onChange={(e) => setScheduleData({ ...scheduleData, pickup_scheduled_at: e.target.value })}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 p-2.5 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Produce Collection Point / Hub</label>
                <select
                  value={scheduleData.collection_point_id}
                  onChange={(e) => setScheduleData({ ...scheduleData, collection_point_id: e.target.value })}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 p-2.5 text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="">Select Aggregation Hub</option>
                  {activeHubs?.items.map((hub) => (
                    <option key={hub.id} value={hub.id}>
                      {hub.name} — {hub.district} ({hub.contact_name}: {hub.contact_phone})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Assigned Agent / Driver</label>
                  <input
                    type="text"
                    value={scheduleData.assigned_agent_name}
                    onChange={(e) => setScheduleData({ ...scheduleData, assigned_agent_name: e.target.value })}
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 p-2.5 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Agent Contact Phone</label>
                  <input
                    type="tel"
                    value={scheduleData.assigned_agent_phone}
                    onChange={(e) => setScheduleData({ ...scheduleData, assigned_agent_phone: e.target.value })}
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 p-2.5 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Vehicle Type</label>
                  <input
                    type="text"
                    value={scheduleData.vehicle_type}
                    onChange={(e) => setScheduleData({ ...scheduleData, vehicle_type: e.target.value })}
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 p-2.5 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Vehicle Number</label>
                  <input
                    type="text"
                    value={scheduleData.vehicle_number}
                    onChange={(e) => setScheduleData({ ...scheduleData, vehicle_number: e.target.value })}
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 p-2.5 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <Button type="button" variant="outline" size="sm" onClick={handleCloseModal} className="text-xs">Cancel</Button>
                <Button type="submit" size="sm" disabled={scheduleMutation.isPending} className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold">
                  {scheduleMutation.isPending ? "Scheduling..." : "Confirm Schedule"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Complete Pickup Modal */}
      {modalType === "COMPLETE_PICKUP" && activeOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                <span>Confirm Produce Pickup</span>
              </h3>
              <button type="button" onClick={handleCloseModal} className="text-slate-400 hover:text-white">✕</button>
            </div>

            {actionError && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                {actionError}
              </div>
            )}

            <p className="text-xs text-slate-300">
              Confirming pickup will transition Order <span className="font-mono font-bold text-white">#{activeOrder.order_number}</span> to <span className="text-cyan-400 font-semibold">PICKED_UP</span> status and record collection timestamp.
            </p>

            <form onSubmit={submitCompletePickup} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Pickup Notes / Inspection</label>
                <textarea
                  rows={2}
                  value={pickupNotes}
                  onChange={(e) => setPickupNotes(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 p-2.5 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <Button type="button" variant="outline" size="sm" onClick={handleCloseModal} className="text-xs">Cancel</Button>
                <Button type="submit" size="sm" disabled={completePickupMutation.isPending} className="bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-semibold">
                  {completePickupMutation.isPending ? "Updating..." : "Mark Picked Up"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Start Delivery Modal */}
      {modalType === "START_DELIVERY" && activeOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Truck className="w-4 h-4 text-blue-400" />
                <span>Start Delivery (Out for Delivery)</span>
              </h3>
              <button type="button" onClick={handleCloseModal} className="text-slate-400 hover:text-white">✕</button>
            </div>

            {actionError && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                {actionError}
              </div>
            )}

            <form onSubmit={submitStartDelivery} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Estimated Handover Time</label>
                <input
                  type="datetime-local"
                  value={deliveryData.estimated_delivery_at}
                  onChange={(e) => setDeliveryData({ ...deliveryData, estimated_delivery_at: e.target.value })}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 p-2.5 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Dispatch Notes</label>
                <textarea
                  rows={2}
                  value={deliveryData.notes}
                  onChange={(e) => setDeliveryData({ ...deliveryData, notes: e.target.value })}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 p-2.5 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <Button type="button" variant="outline" size="sm" onClick={handleCloseModal} className="text-xs">Cancel</Button>
                <Button type="submit" size="sm" disabled={startDeliveryMutation.isPending} className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold">
                  {startDeliveryMutation.isPending ? "Dispatching..." : "Dispatch Out for Delivery"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Complete Delivery Modal */}
      {modalType === "COMPLETE_DELIVERY" && activeOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Confirm Final Delivery Handover</span>
              </h3>
              <button type="button" onClick={handleCloseModal} className="text-slate-400 hover:text-white">✕</button>
            </div>

            {actionError && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                {actionError}
              </div>
            )}

            <form onSubmit={submitCompleteDelivery} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Recipient / Receiving Manager Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Kumar (Store Manager)"
                  value={confirmationData.recipient_name}
                  onChange={(e) => setConfirmationData({ ...confirmationData, recipient_name: e.target.value })}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 p-2.5 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Handover Notes / Verification Proof</label>
                <textarea
                  rows={2}
                  placeholder="e.g. 150 KG crates verified and accepted by buyer."
                  value={confirmationData.notes}
                  onChange={(e) => setConfirmationData({ ...confirmationData, notes: e.target.value })}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 p-2.5 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <Button type="button" variant="outline" size="sm" onClick={handleCloseModal} className="text-xs">Cancel</Button>
                <Button type="submit" size="sm" disabled={completeDeliveryMutation.isPending} className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold">
                  {completeDeliveryMutation.isPending ? "Confirming..." : "Confirm Delivery (DELIVERED)"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default AdminLogisticsPage;
