import React, { useState, useEffect } from "react";
import {
  Truck,
  Plus,
  Navigation,
  MapPin,
  RefreshCw,
  Radio,
  CheckCircle2,
  PackageCheck,
  ThermometerSnowflake,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiClient } from "@/lib/axios";
import { DeliveryTrackingMap } from "@/components/logistics/DeliveryTrackingMap";

interface Vehicle {
  id: string;
  vehicle_number: string;
  vehicle_type: string;
  capacity_kg: number;
  driver_name?: string | null;
  driver_phone?: string | null;
  is_refrigerated: boolean;
  status: "AVAILABLE" | "ASSIGNED" | "ON_DELIVERY" | "INACTIVE";
  current_latitude?: number | null;
  current_longitude?: number | null;
  last_gps_updated_at?: string | null;
}

interface LogisticsBooking {
  order_id: string;
  order_number: string;
  booking_status: string;
  created_at: string;
  assigned_vehicle_id?: string | null;
  vehicle_number?: string | null;
  driver_name?: string | null;
  driver_phone?: string | null;
  current_latitude?: number | null;
  current_longitude?: number | null;
  estimated_delivery_at?: string | null;
  collection_point?: {
    id: string;
    name: string;
    district?: string;
    state?: string;
    latitude?: number;
    longitude?: number;
  } | null;
  delivery_address: {
    full_name?: string;
    address_line1?: string;
    district?: string;
    state?: string;
    pincode?: string;
  };
  total_weight_kg: number;
  items_count: number;
}

export const LogisticsPortal: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"fleet" | "bookings" | "tracking">("bookings");
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [bookings, setBookings] = useState<LogisticsBooking[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Selected booking for live tracking / update
  const [selectedBooking, setSelectedBooking] = useState<LogisticsBooking | null>(null);

  // Add Vehicle Modal State
  const [isAddVehicleOpen, setIsAddVehicleOpen] = useState(false);
  const [newVehicle, setNewVehicle] = useState({
    vehicle_number: "",
    vehicle_type: "TEMPO_407",
    capacity_kg: 2500,
    driver_name: "",
    driver_phone: "",
    is_refrigerated: false,
  });
  const [isAddingVehicle, setIsAddingVehicle] = useState(false);

  // Assign Vehicle Modal
  const [assigningBooking, setAssigningBooking] = useState<LogisticsBooking | null>(null);
  const [selectedVehicleId, setSelectedVehicleId] = useState("");
  const [isAssigning, setIsAssigning] = useState(false);

  // Status / GPS updates
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const fetchFleetAndBookings = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [vRes, bRes] = await Promise.all([
        apiClient.get<{ vehicles: Vehicle[] }>("/logistics/vehicles"),
        apiClient.get<{ bookings: LogisticsBooking[] }>("/logistics/bookings"),
      ]);
      setVehicles(vRes.data.vehicles || []);
      const bList = bRes.data.bookings || [];
      setBookings(bList);
      if (bList.length > 0 && !selectedBooking) {
        setSelectedBooking(bList[0]);
      }
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Failed to load logistics data.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFleetAndBookings();
  }, []);

  const handleCreateVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVehicle.vehicle_number) return;
    setIsAddingVehicle(true);
    try {
      await apiClient.post("/logistics/vehicles", newVehicle);
      setIsAddVehicleOpen(false);
      setNewVehicle({
        vehicle_number: "",
        vehicle_type: "TEMPO_407",
        capacity_kg: 2500,
        driver_name: "",
        driver_phone: "",
        is_refrigerated: false,
      });
      await fetchFleetAndBookings();
    } catch (err: any) {
      alert(err?.response?.data?.detail || "Failed to add vehicle.");
    } finally {
      setIsAddingVehicle(false);
    }
  };

  const handleAcceptAndAssign = async () => {
    if (!assigningBooking || !selectedVehicleId) return;
    setIsAssigning(true);
    try {
      await apiClient.post(`/logistics/bookings/${assigningBooking.order_id}/accept`, {
        vehicle_id: selectedVehicleId,
      });
      setAssigningBooking(null);
      setSelectedVehicleId("");
      await fetchFleetAndBookings();
    } catch (err: any) {
      alert(err?.response?.data?.detail || "Failed to assign vehicle.");
    } finally {
      setIsAssigning(false);
    }
  };

  const handleUpdateMilestone = async (orderId: string, status: string) => {
    setIsUpdatingStatus(true);
    try {
      await apiClient.post(`/logistics/bookings/${orderId}/status`, { status });
      await fetchFleetAndBookings();
      if (selectedBooking && selectedBooking.order_id === orderId) {
        setSelectedBooking((prev) => (prev ? { ...prev, booking_status: status } : null));
      }
    } catch (err: any) {
      alert(err?.response?.data?.detail || "Failed to update milestone.");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleBroadcastGPS = async (orderId: string) => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          await apiClient.post(`/logistics/bookings/${orderId}/location`, {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          });
          await fetchFleetAndBookings();
          alert("GPS Coordinates broadcasted successfully!");
        } catch (err: any) {
          alert(err?.response?.data?.detail || "Failed to update GPS coordinates.");
        }
      },
      (geoErr) => {
        alert("Location access denied or timed out: " + geoErr.message);
      },
      { timeout: 8000 }
    );
  };

  const activeDeliveries = bookings.filter((b) =>
    ["ASSIGNED", "AT_COLLECTION", "PRODUCT_LOADED", "OUT_FOR_DELIVERY", "ARRIVED_AT_DELIVERY"].includes(
      b.booking_status
    )
  );

  return (
    <div className="container mx-auto px-4 sm:px-8 py-8 space-y-8 max-w-6xl">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/60 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Badge variant="outline" className="text-xs text-purple-400 border-purple-500/30">
              LOGISTICS FLEET COMMAND
            </Badge>
          </div>
          <h1 className="text-3xl font-black text-white flex items-center gap-2.5">
            <Truck className="h-8 w-8 text-purple-400" />
            <span>Freight & Farm Gate Fleet Operations</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Dispatch trucks to FPO collection hubs, stream OpenStreetMap live GPS, and manage multi-ton farm shipments.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchFleetAndBookings}
            disabled={isLoading}
            className="text-xs gap-1.5"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin text-purple-400" : ""}`} />
            <span>Refresh</span>
          </Button>
          <Button
            size="sm"
            onClick={() => setIsAddVehicleOpen(true)}
            className="bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs gap-1.5"
          >
            <Plus className="h-4 w-4" />
            <span>Register Vehicle</span>
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab("bookings")}
          className={`px-4 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all ${
            activeTab === "bookings"
              ? "bg-purple-600 text-white shadow-lg shadow-purple-600/20"
              : "text-slate-400 hover:text-white"
          }`}
        >
          Buyer Bookings ({bookings.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("tracking")}
          className={`px-4 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all ${
            activeTab === "tracking"
              ? "bg-purple-600 text-white shadow-lg shadow-purple-600/20"
              : "text-slate-400 hover:text-white"
          }`}
        >
          Live Tracking & Milestones ({activeDeliveries.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("fleet")}
          className={`px-4 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all ${
            activeTab === "fleet"
              ? "bg-purple-600 text-white shadow-lg shadow-purple-600/20"
              : "text-slate-400 hover:text-white"
          }`}
        >
          Fleet Vehicles ({vehicles.length})
        </button>
      </div>

      {/* TAB 1: BUYER BOOKINGS */}
      {activeTab === "bookings" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase font-mono tracking-wider">
              Pending & Active Buyer Dispatch Requests
            </h3>
            <span className="text-xs text-slate-400">{bookings.length} Total Bookings</span>
          </div>

          {bookings.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-slate-900/60 border border-slate-800 text-slate-400 space-y-2">
              <Truck className="h-8 w-8 mx-auto text-slate-600" />
              <p className="text-sm font-medium text-slate-300">No buyer logistics bookings yet.</p>
              <p className="text-xs text-slate-500">
                When buyers order harvest produce, bookings will populate here for fleet assignment.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {bookings.map((booking) => (
                <Card
                  key={booking.order_id}
                  className="glass-card border-slate-800 hover:border-purple-500/40 transition-all flex flex-col justify-between"
                >
                  <CardContent className="p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-black text-white text-sm">
                        Order #{booking.order_number}
                      </span>
                      <Badge
                        variant="outline"
                        className={`text-[10px] font-bold ${
                          booking.booking_status === "DELIVERED"
                            ? "text-emerald-400 border-emerald-500/30"
                            : booking.booking_status === "PENDING_CONFIRMATION"
                            ? "text-amber-400 border-amber-500/30"
                            : "text-purple-400 border-purple-500/30"
                        }`}
                      >
                        {booking.booking_status.replace(/_/g, " ")}
                      </Badge>
                    </div>

                    <div className="space-y-1.5 text-xs text-slate-300">
                      <p className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-purple-400 shrink-0" />
                        <span>
                          From: {booking.collection_point?.name || "Farmer Gate Pickup"} (
                          {booking.collection_point?.district || "Andhra Pradesh"})
                        </span>
                      </p>
                      <p className="flex items-center gap-1.5">
                        <Navigation className="h-3.5 w-3.5 text-blue-400 shrink-0" />
                        <span>
                          To: {booking.delivery_address.district}, {booking.delivery_address.state}
                        </span>
                      </p>
                      <p className="flex items-center gap-1.5 text-slate-400 pt-1">
                        <PackageCheck className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                        <span>
                          {booking.items_count} Lots • Total Weight: {booking.total_weight_kg.toLocaleString()} kg
                        </span>
                      </p>
                    </div>

                    {booking.vehicle_number ? (
                      <div className="p-2.5 rounded-xl bg-purple-950/30 border border-purple-500/20 text-xs">
                        <span className="text-[10px] text-slate-400 block uppercase">Assigned Truck</span>
                        <span className="font-bold text-white font-mono">{booking.vehicle_number}</span>
                        {booking.driver_name && (
                          <span className="text-slate-400 block text-[11px]">
                            Driver: {booking.driver_name} ({booking.driver_phone || "N/A"})
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="p-2.5 rounded-xl bg-amber-950/20 border border-amber-500/20 text-xs text-amber-300">
                        No vehicle assigned yet.
                      </div>
                    )}

                    <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedBooking(booking);
                          setActiveTab("tracking");
                        }}
                        className="text-xs text-purple-300 hover:text-white"
                      >
                        Live Tracking
                      </Button>

                      {!booking.assigned_vehicle_id && booking.booking_status !== "DELIVERED" && (
                        <Button
                          size="sm"
                          onClick={() => {
                            setAssigningBooking(booking);
                            setSelectedVehicleId(vehicles.find((v) => v.status === "AVAILABLE")?.id || "");
                          }}
                          className="bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold"
                        >
                          Accept & Assign
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: LIVE TRACKING & MILESTONES */}
      {activeTab === "tracking" && (
        <div className="space-y-6">
          {selectedBooking ? (
            <div className="space-y-6">
              {/* Active Selection Selector */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                <div>
                  <span className="text-xs text-slate-400 uppercase font-mono block">Tracking Shipment</span>
                  <h3 className="text-base font-bold text-white font-mono">
                    Order #{selectedBooking.order_number} — Status: {selectedBooking.booking_status}
                  </h3>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    className="bg-slate-950 border border-slate-700 text-xs text-white rounded-xl px-3 py-2"
                    value={selectedBooking.order_id}
                    onChange={(e) => {
                      const found = bookings.find((b) => b.order_id === e.target.value);
                      if (found) setSelectedBooking(found);
                    }}
                  >
                    {bookings.map((b) => (
                      <option key={b.order_id} value={b.order_id}>
                        Order #{b.order_number} ({b.booking_status})
                      </option>
                    ))}
                  </select>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleBroadcastGPS(selectedBooking.order_id)}
                    className="text-xs text-emerald-400 border-emerald-500/40 gap-1"
                  >
                    <Radio className="h-3.5 w-3.5 animate-pulse" />
                    <span>Broadcast GPS</span>
                  </Button>
                </div>
              </div>

              {/* Free Leaflet + OpenStreetMap Live Map */}
              <DeliveryTrackingMap
                vehicleLat={selectedBooking.current_latitude || selectedBooking.collection_point?.latitude || 16.5062}
                vehicleLon={selectedBooking.current_longitude || selectedBooking.collection_point?.longitude || 80.6480}
                vehicleNumber={selectedBooking.vehicle_number}
                originLat={selectedBooking.collection_point?.latitude || 16.3067}
                originLon={selectedBooking.collection_point?.longitude || 80.4365}
                originLabel={selectedBooking.collection_point?.name || "Collection Hub"}
                destLat={16.5062}
                destLon={80.6480}
                destLabel={`${selectedBooking.delivery_address.district}, ${selectedBooking.delivery_address.state}`}
                status={selectedBooking.booking_status}
              />

              {/* Milestone Progress Action Buttons */}
              <Card className="glass-card border-slate-800">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    <span>Advance Delivery Milestones</span>
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-400">
                    Advancing each milestone updates the order status and sends automated notifications to buyer and farmer.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    <Button
                      variant={selectedBooking.booking_status === "AT_COLLECTION" ? "default" : "outline"}
                      disabled={isUpdatingStatus}
                      onClick={() => handleUpdateMilestone(selectedBooking.order_id, "AT_COLLECTION")}
                      className="text-xs h-10"
                    >
                      At Hub
                    </Button>
                    <Button
                      variant={selectedBooking.booking_status === "PRODUCT_LOADED" ? "default" : "outline"}
                      disabled={isUpdatingStatus}
                      onClick={() => handleUpdateMilestone(selectedBooking.order_id, "PRODUCT_LOADED")}
                      className="text-xs h-10"
                    >
                      Produce Loaded
                    </Button>
                    <Button
                      variant={selectedBooking.booking_status === "OUT_FOR_DELIVERY" ? "default" : "outline"}
                      disabled={isUpdatingStatus}
                      onClick={() => handleUpdateMilestone(selectedBooking.order_id, "OUT_FOR_DELIVERY")}
                      className="text-xs h-10"
                    >
                      Out for Delivery
                    </Button>
                    <Button
                      variant={selectedBooking.booking_status === "ARRIVED_AT_DELIVERY" ? "default" : "outline"}
                      disabled={isUpdatingStatus}
                      onClick={() => handleUpdateMilestone(selectedBooking.order_id, "ARRIVED_AT_DELIVERY")}
                      className="text-xs h-10"
                    >
                      Arrived Buyer
                    </Button>
                    <Button
                      variant={selectedBooking.booking_status === "DELIVERED" ? "harvest" : "outline"}
                      disabled={isUpdatingStatus}
                      onClick={() => handleUpdateMilestone(selectedBooking.order_id, "DELIVERED")}
                      className="text-xs h-10 bg-emerald-600 hover:bg-emerald-500 text-white"
                    >
                      Mark Delivered
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="p-12 text-center rounded-2xl bg-slate-900/60 border border-slate-800 text-slate-400">
              Select a booking from the Bookings tab to view live tracking and update milestones.
            </div>
          )}
        </div>
      )}

      {/* TAB 3: FLEET VEHICLES */}
      {activeTab === "fleet" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase font-mono tracking-wider">
              Registered Commercial Vehicles
            </h3>
            <span className="text-xs text-slate-400">{vehicles.length} Vehicles in Fleet</span>
          </div>

          {vehicles.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-slate-900/60 border border-slate-800 text-slate-400 space-y-3">
              <Truck className="h-8 w-8 mx-auto text-slate-600" />
              <p className="text-sm font-medium text-slate-300">No vehicles registered in your fleet yet.</p>
              <Button
                size="sm"
                onClick={() => setIsAddVehicleOpen(true)}
                className="bg-purple-600 hover:bg-purple-500 text-white text-xs"
              >
                Register First Vehicle
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {vehicles.map((v) => (
                <Card key={v.id} className="glass-card border-slate-800">
                  <CardContent className="p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-base font-black text-white font-mono">{v.vehicle_number}</span>
                      <Badge
                        variant="outline"
                        className={`text-[10px] ${
                          v.status === "AVAILABLE"
                            ? "text-emerald-400 border-emerald-500/40"
                            : v.status === "ON_DELIVERY"
                            ? "text-purple-400 border-purple-500/40"
                            : "text-slate-400 border-slate-600"
                        }`}
                      >
                        {v.status}
                      </Badge>
                    </div>

                    <div className="space-y-1 text-xs text-slate-300">
                      <p className="flex items-center justify-between">
                        <span className="text-slate-500">Type:</span>
                        <span className="font-semibold text-white">{v.vehicle_type}</span>
                      </p>
                      <p className="flex items-center justify-between">
                        <span className="text-slate-500">Capacity:</span>
                        <span className="font-semibold text-white">{v.capacity_kg.toLocaleString()} kg</span>
                      </p>
                      <p className="flex items-center justify-between">
                        <span className="text-slate-500">Cold Chain:</span>
                        <span className="flex items-center gap-1 font-semibold text-white">
                          {v.is_refrigerated ? (
                            <>
                              <ThermometerSnowflake className="h-3 w-3 text-teal-400" /> Reefer Truck
                            </>
                          ) : (
                            "Standard Ambient"
                          )}
                        </span>
                      </p>
                      {v.driver_name && (
                        <p className="flex items-center justify-between pt-1 border-t border-slate-800">
                          <span className="text-slate-500">Driver:</span>
                          <span className="text-white">
                            {v.driver_name} {v.driver_phone && `(${v.driver_phone})`}
                          </span>
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Register Vehicle Modal */}
      {isAddVehicleOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-purple-500/40 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Truck className="h-5 w-5 text-purple-400" />
                <span>Register Fleet Vehicle</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsAddVehicleOpen(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateVehicle} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <Label htmlFor="v_num" className="text-slate-300">
                  Vehicle Registration Number *
                </Label>
                <Input
                  id="v_num"
                  placeholder="e.g. AP29TB4492"
                  value={newVehicle.vehicle_number}
                  onChange={(e) => setNewVehicle({ ...newVehicle, vehicle_number: e.target.value })}
                  required
                  className="bg-slate-950 border-slate-700 uppercase"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="v_type" className="text-slate-300">
                    Vehicle Type
                  </Label>
                  <select
                    id="v_type"
                    value={newVehicle.vehicle_type}
                    onChange={(e) => setNewVehicle({ ...newVehicle, vehicle_type: e.target.value })}
                    className="w-full h-9 rounded-md bg-slate-950 border border-slate-700 px-2 text-xs text-white"
                  >
                    <option value="TEMPO_407">Tempo / Small Truck</option>
                    <option value="REEFER_TRUCK">Refrigerated Truck (Cold Chain)</option>
                    <option value="HEAVY_TRUCK">Heavy Multi-Axle Truck</option>
                    <option value="TRACTOR_TROLLEY">Tractor Trolley</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="v_cap" className="text-slate-300">
                    Payload Capacity (KG)
                  </Label>
                  <Input
                    id="v_cap"
                    type="number"
                    value={newVehicle.capacity_kg}
                    onChange={(e) =>
                      setNewVehicle({ ...newVehicle, capacity_kg: Number(e.target.value) || 2000 })
                    }
                    className="bg-slate-950 border-slate-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="d_name" className="text-slate-300">
                    Driver Name
                  </Label>
                  <Input
                    id="d_name"
                    placeholder="e.g. Raju Kumar"
                    value={newVehicle.driver_name}
                    onChange={(e) => setNewVehicle({ ...newVehicle, driver_name: e.target.value })}
                    className="bg-slate-950 border-slate-700"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="d_phone" className="text-slate-300">
                    Driver Phone
                  </Label>
                  <Input
                    id="d_phone"
                    placeholder="e.g. 9876543210"
                    value={newVehicle.driver_phone}
                    onChange={(e) => setNewVehicle({ ...newVehicle, driver_phone: e.target.value })}
                    className="bg-slate-950 border-slate-700"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="v_reefer"
                  checked={newVehicle.is_refrigerated}
                  onChange={(e) => setNewVehicle({ ...newVehicle, is_refrigerated: e.target.checked })}
                  className="rounded border-slate-700 bg-slate-950 text-purple-600"
                />
                <Label htmlFor="v_reefer" className="text-slate-300 cursor-pointer">
                  Equipped with Temperature Control (&lt; 4°C Cold Chain)
                </Label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsAddVehicleOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isAddingVehicle}
                  size="sm"
                  className="bg-purple-600 hover:bg-purple-500 text-white font-semibold"
                >
                  {isAddingVehicle ? "Registering..." : "Register Vehicle"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Vehicle Modal */}
      {assigningBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-purple-500/40 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Truck className="h-5 w-5 text-purple-400" />
                <span>Assign Vehicle to Order #{assigningBooking.order_number}</span>
              </h3>
              <button
                type="button"
                onClick={() => setAssigningBooking(null)}
                className="text-slate-400 hover:text-white text-sm"
              >
                &times;
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-slate-300">
                Select an available fleet vehicle to pick up shipment from{" "}
                <strong className="text-white">{assigningBooking.collection_point?.name || "Farm"}</strong> and
                deliver to <strong className="text-white">{assigningBooking.delivery_address.district}</strong>.
              </p>

              <div className="space-y-1">
                <Label className="text-slate-300">Available Fleet Vehicles</Label>
                <select
                  value={selectedVehicleId}
                  onChange={(e) => setSelectedVehicleId(e.target.value)}
                  className="w-full h-10 rounded-md bg-slate-950 border border-slate-700 px-2 text-xs text-white"
                >
                  <option value="">Select a vehicle...</option>
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.vehicle_number} ({v.vehicle_type} - {v.capacity_kg}kg - {v.status})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setAssigningBooking(null)}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  disabled={!selectedVehicleId || isAssigning}
                  onClick={handleAcceptAndAssign}
                  className="bg-purple-600 hover:bg-purple-500 text-white font-semibold"
                >
                  {isAssigning ? "Assigning..." : "Confirm & Dispatch"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
