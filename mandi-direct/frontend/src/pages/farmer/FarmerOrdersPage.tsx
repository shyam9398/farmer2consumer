import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  Package,
  Calendar,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  MapPin,
  User,
  Search,
  ArrowUpDown,
  Building,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { OrderStatusBadge } from "@/components/order/OrderStatusBadge";
import { useFarmerOrders, useFarmerOrderStats } from "@/hooks/useOrders";

const STATUS_TABS = [
  { id: "ALL", label: "All Orders" },
  { id: "PENDING", label: "Pending Review" },
  { id: "ACCEPTED", label: "Accepted" },
  { id: "PREPARING", label: "Harvesting/Preparing" },
  { id: "READY_FOR_PICKUP", label: "Ready for Pickup" },
  { id: "PICKED_UP", label: "Picked Up" },
  { id: "OUT_FOR_DELIVERY", label: "Out for Delivery" },
  { id: "DELIVERED", label: "Delivered" },
  { id: "REJECTED", label: "Rejected" },
  { id: "CANCELLED", label: "Cancelled" },
];

export const FarmerOrdersPage: React.FC = () => {
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("newest");

  const { data: stats } = useFarmerOrderStats();
  const { data: orders, isLoading, error } = useFarmerOrders({
    status: selectedStatus,
    search: searchTerm,
    sort_by: sortBy,
  });

  const getActionBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse">
            <AlertCircle className="w-3 h-3" />
            Action Required: Accept or Reject
          </span>
        );
      case "ACCEPTED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Clock className="w-3 h-3" />
            Action: Mark Preparing
          </span>
        );
      case "PREPARING":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <Clock className="w-3 h-3" />
            Action: Mark Ready for Pickup
          </span>
        );
      case "READY_FOR_PICKUP":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3 h-3" />
            Awaiting Logistics Pickup
          </span>
        );
      case "PICKED_UP":
      case "OUT_FOR_DELIVERY":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Clock className="w-3 h-3" />
            In Transit
          </span>
        );
      case "DELIVERED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3 h-3" />
            Completed
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto px-4 sm:px-8 py-8 sm:py-12 max-w-6xl space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <Package className="w-7 h-7 text-emerald-400" />
            <span>Farm Purchase Orders</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Direct wholesale purchase requests for your registered farm produce lots.
          </p>
        </div>

        <Link to="/farmer/produce">
          <Button variant="outline" size="sm" className="text-xs gap-1.5 self-start sm:self-auto">
            <span>Manage My Produce</span>
          </Button>
        </Link>
      </div>

      {/* Live Action Counters */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div
            onClick={() => setSelectedStatus("PENDING")}
            className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
              selectedStatus === "PENDING"
                ? "bg-amber-500/10 border-amber-500/40 shadow-sm"
                : "bg-slate-900/40 border-slate-800 hover:border-slate-700"
            }`}
          >
            <div className="text-[11px] font-semibold text-slate-400">Pending Review</div>
            <div className="text-xl font-black text-amber-400 font-mono mt-0.5">{stats.pending}</div>
          </div>
          <div
            onClick={() => setSelectedStatus("ACCEPTED")}
            className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
              selectedStatus === "ACCEPTED"
                ? "bg-blue-500/10 border-blue-500/40 shadow-sm"
                : "bg-slate-900/40 border-slate-800 hover:border-slate-700"
            }`}
          >
            <div className="text-[11px] font-semibold text-slate-400">Accepted</div>
            <div className="text-xl font-black text-blue-400 font-mono mt-0.5">{stats.accepted}</div>
          </div>
          <div
            onClick={() => setSelectedStatus("PREPARING")}
            className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
              selectedStatus === "PREPARING"
                ? "bg-purple-500/10 border-purple-500/40 shadow-sm"
                : "bg-slate-900/40 border-slate-800 hover:border-slate-700"
            }`}
          >
            <div className="text-[11px] font-semibold text-slate-400">Harvesting</div>
            <div className="text-xl font-black text-purple-400 font-mono mt-0.5">{stats.preparing}</div>
          </div>
          <div
            onClick={() => setSelectedStatus("READY_FOR_PICKUP")}
            className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
              selectedStatus === "READY_FOR_PICKUP"
                ? "bg-emerald-500/10 border-emerald-500/40 shadow-sm"
                : "bg-slate-900/40 border-slate-800 hover:border-slate-700"
            }`}
          >
            <div className="text-[11px] font-semibold text-slate-400">Ready for Pickup</div>
            <div className="text-xl font-black text-emerald-400 font-mono mt-0.5">{stats.ready_for_pickup}</div>
          </div>
          <div
            onClick={() => setSelectedStatus("DELIVERED")}
            className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
              selectedStatus === "DELIVERED"
                ? "bg-emerald-500/10 border-emerald-500/40 shadow-sm"
                : "bg-slate-900/40 border-slate-800 hover:border-slate-700"
            }`}
          >
            <div className="text-[11px] font-semibold text-slate-400">Delivered</div>
            <div className="text-xl font-black text-emerald-300 font-mono mt-0.5">{stats.delivered}</div>
          </div>
        </div>
      )}

      {/* Search and Sort controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by order number or crop name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-900/80 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <ArrowUpDown className="w-4 h-4 text-slate-400" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-slate-900/80 border border-slate-800 rounded-xl text-xs text-slate-300 px-3 py-2 focus:outline-none focus:border-emerald-500"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="status">Group by Status</option>
          </select>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex space-x-1.5 overflow-x-auto pb-1 border-b border-slate-800">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSelectedStatus(tab.id)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              selectedStatus === tab.id
                ? "bg-emerald-600 text-white shadow-sm"
                : "text-slate-400 hover:text-white hover:bg-slate-800/60"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Orders List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 bg-slate-900/60 rounded-xl border border-slate-800 animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-8 text-center space-y-3">
          <p className="text-xs text-rose-400">Failed to load farm orders.</p>
          <Button variant="outline" size="sm" onClick={() => window.location.reload()} className="text-xs">
            Retry
          </Button>
        </div>
      ) : !orders || orders.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/40 p-12 text-center space-y-4 max-w-md mx-auto">
          <Package className="w-10 h-10 text-slate-600 mx-auto" />
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white">No incoming orders</h3>
            <p className="text-xs text-slate-400">
              {selectedStatus === "ALL"
                ? "No wholesale buyer purchase orders have been received yet."
                : `No incoming orders currently in '${selectedStatus}' status.`}
            </p>
          </div>
          <Link to="/farmer/produce">
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs">
              Check Listed Produce Lots
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Card
              key={order.id}
              className="glass-card border-border/60 hover:border-emerald-500/40 transition-all group overflow-hidden"
            >
              <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold text-emerald-400">
                      #{order.order_number}
                    </span>
                    <OrderStatusBadge status={order.status} />
                    {getActionBadge(order.status)}
                  </div>

                  {/* Products breakdown */}
                  {order.product_names && order.product_names.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {order.product_names.map((prod, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-200 text-xs font-medium"
                        >
                          {prod}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-sm text-white font-semibold">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>Buyer: {order.buyer_name}</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-emerald-500" />
                      <span>{order.delivery_district}, {order.delivery_state}</span>
                    </span>
                    {order.collection_point_name && (
                      <>
                        <span>•</span>
                        <span className="flex items-center gap-1 text-cyan-400 font-medium">
                          <Building className="w-3 h-3" />
                          <span>Hub: {order.collection_point_name}</span>
                        </span>
                      </>
                    )}
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-500" />
                      <span>{new Date(order.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                    </span>
                    <span>•</span>
                    <span>{order.items_count} crop lot{order.items_count > 1 ? "s" : ""}</span>
                  </div>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-3 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-800 shrink-0">
                  <div className="text-left sm:text-right">
                    <span className="text-[10px] uppercase font-mono text-slate-400 block">
                      Your Produce Subtotal
                    </span>
                    <span className="text-xl font-black text-emerald-400 font-mono">
                      ₹{order.farmer_subtotal.toLocaleString()}
                    </span>
                  </div>

                  <Link to={`/farmer/orders/${order.id}`}>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs h-8 gap-1.5 border-slate-700 hover:bg-emerald-600 hover:text-white hover:border-emerald-600 transition-all font-semibold"
                    >
                      <span>Review & Process</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
export default FarmerOrdersPage;
