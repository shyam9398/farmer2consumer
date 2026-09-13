import React, { useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  Truck,
  MapPin,
  Phone,
  CheckCircle2,
  RefreshCw,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useBuyerOrder } from "@/hooks/useOrders";
import { DeliveryTrackingMap } from "@/components/logistics/DeliveryTrackingMap";

export const BuyerOrderTrackingPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const { data: order, isLoading, error, refetch, isFetching } = useBuyerOrder(orderId);

  // Poll for location updates every 15 seconds when active
  useEffect(() => {
    const interval = setInterval(() => {
      refetch();
    }, 15000);
    return () => clearInterval(interval);
  }, [refetch]);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-5xl space-y-6">
        <div className="h-8 w-48 bg-slate-800 rounded animate-pulse" />
        <div className="h-[400px] bg-slate-900/60 rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="container mx-auto px-4 py-16 text-center space-y-4 max-w-md">
        <h2 className="text-xl font-bold text-white">Order not found</h2>
        <p className="text-xs text-slate-400">Could not retrieve tracking details for this order.</p>
        <Link to="/buyer/orders">
          <Button variant="outline" size="sm">
            Back to Orders
          </Button>
        </Link>
      </div>
    );
  }

  const logistics = order.logistics;
  const address = order.delivery_address_snapshot;

  // Approximate default coordinates for AP/India if not geocoded
  const destLat = 16.5062;
  const destLon = 80.6480;

  const collectionHubLat = logistics?.collection_point?.latitude || 16.3067;
  const collectionHubLon = logistics?.collection_point?.longitude || 80.4365;

  const currentLat = logistics?.current_latitude || collectionHubLat;
  const currentLon = logistics?.current_longitude || collectionHubLon;

  const trackingSteps = [
    { key: "BOOKED", label: "Logistics Booked", done: Boolean(logistics) },
    {
      key: "ASSIGNED",
      label: "Vehicle Assigned",
      done: Boolean(logistics?.assigned_vehicle_id || logistics?.vehicle_number),
    },
    {
      key: "IN_TRANSIT",
      label: "Out for Delivery",
      done: ["OUT_FOR_DELIVERY", "ARRIVED_AT_DELIVERY", "DELIVERED"].includes(
        logistics?.booking_status || order.status
      ),
    },
    {
      key: "DELIVERED",
      label: "Delivered",
      done: order.status === "DELIVERED" || logistics?.booking_status === "DELIVERED",
    },
  ];

  return (
    <div className="container mx-auto px-4 sm:px-8 py-8 max-w-5xl space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-4">
        <div className="flex items-center gap-3">
          <Link
            to={`/buyer/orders/${order.id}`}
            className="p-2 rounded-xl bg-slate-800/80 text-slate-300 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-white font-mono">
                Tracking Order #{order.order_number}
              </h1>
              <Badge variant="outline" className="text-emerald-400 border-emerald-500/40">
                LIVE GPS
              </Badge>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Real-time route & delivery updates powered by OpenStreetMap
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isFetching}
          className="text-xs gap-1.5 shrink-0"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin text-emerald-400" : ""}`} />
          <span>Refresh GPS</span>
        </Button>
      </div>

      {/* Interactive Map */}
      <DeliveryTrackingMap
        vehicleLat={currentLat}
        vehicleLon={currentLon}
        vehicleNumber={logistics?.vehicle_number}
        originLat={collectionHubLat}
        originLon={collectionHubLon}
        originLabel={logistics?.collection_point?.name || "Aggregation Hub"}
        destLat={destLat}
        destLon={destLon}
        destLabel={`${address.district}, ${address.state}`}
        status={logistics?.booking_status || order.status}
      />

      {/* Tracking Milestones */}
      <Card className="glass-card border-slate-800">
        <CardContent className="p-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {trackingSteps.map((step, idx) => (
              <div key={step.key} className="flex flex-col items-center text-center space-y-2">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-colors ${
                    step.done
                      ? "bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/30"
                      : "bg-slate-800 text-slate-400 border border-slate-700"
                  }`}
                >
                  {step.done ? <CheckCircle2 className="h-5 w-5" /> : idx + 1}
                </div>
                <span
                  className={`text-xs font-semibold ${
                    step.done ? "text-emerald-400" : "text-slate-500"
                  }`}
                >
                  {step.label}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Two Column Details: Vehicle & Destination */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Vehicle & Logistics Partner */}
        <Card className="glass-card border-slate-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
              <Truck className="h-4 w-4 text-emerald-400" />
              <span>Assigned Fleet Vehicle</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-500 block uppercase font-mono">
                  Vehicle Registration
                </span>
                <span className="text-sm font-bold text-white font-mono">
                  {logistics?.vehicle_number || "Direct Logistics Transport"}
                </span>
              </div>
              <Badge variant="secondary" className="text-xs">
                {logistics?.vehicle_type || "Commercial Truck"}
              </Badge>
            </div>

            {logistics?.assigned_agent_name && (
              <div className="space-y-1">
                <span className="text-slate-400 block">Driver / Fleet Agent:</span>
                <p className="font-semibold text-white text-sm">{logistics.assigned_agent_name}</p>
                {logistics.assigned_agent_phone && (
                  <p className="text-slate-300 flex items-center gap-1">
                    <Phone className="h-3 w-3 text-slate-500" />
                    <span>{logistics.assigned_agent_phone}</span>
                  </p>
                )}
              </div>
            )}

            {logistics?.estimated_delivery_at && (
              <div className="pt-2 border-t border-slate-800 flex items-center gap-2 text-slate-300">
                <Clock className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>
                  Estimated Arrival:{" "}
                  <strong className="text-white">
                    {new Date(logistics.estimated_delivery_at).toLocaleString("en-IN", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </strong>
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Delivery Address & Order Contents */}
        <Card className="glass-card border-slate-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
              <MapPin className="h-4 w-4 text-emerald-400" />
              <span>Destination & Order Contents</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <div>
              <span className="text-slate-400 block">Deliver to:</span>
              <p className="font-bold text-white">{address.full_name}</p>
              <p className="text-slate-300">{address.address_line1}</p>
              <p className="text-slate-400 font-medium">
                {address.district}, {address.state} — {address.pincode}
              </p>
            </div>

            <div className="pt-2 border-t border-slate-800 space-y-1.5">
              <span className="text-slate-400 block font-medium">Items in this shipment:</span>
              {order.items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between text-slate-300 bg-slate-950/40 p-2 rounded-lg"
                >
                  <span className="font-medium text-white">{item.product_name}</span>
                  <span className="text-emerald-400 font-mono">
                    {item.quantity} {item.quantity_unit}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
