import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  Package,
  Calendar,
  ArrowRight,
  ShoppingBag,
  ImageOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { OrderStatusBadge } from "@/components/order/OrderStatusBadge";
import { useBuyerOrders } from "@/hooks/useOrders";

const STATUS_TABS = [
  { id: "ALL", label: "All Orders" },
  { id: "PENDING", label: "Pending" },
  { id: "ACCEPTED", label: "Accepted" },
  { id: "PREPARING", label: "Preparing" },
  { id: "DELIVERED", label: "Delivered" },
  { id: "CANCELLED", label: "Cancelled" },
];

export const BuyerOrdersPage: React.FC = () => {
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const { data: orders, isLoading, error } = useBuyerOrders(selectedStatus);

  return (
    <div className="container mx-auto px-4 sm:px-8 py-8 sm:py-12 max-w-5xl space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <Package className="w-7 h-7 text-emerald-400" />
            <span>My Purchase Orders</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Track wholesale produce orders, delivery timelines, and farmer confirmation status.
          </p>
        </div>

        <Link to="/marketplace">
          <Button variant="outline" size="sm" className="text-xs gap-1.5 self-start sm:self-auto">
            <ShoppingBag className="w-3.5 h-3.5 text-emerald-400" />
            <span>Browse More Produce</span>
          </Button>
        </Link>
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

      {/* Orders List / Loading / Empty */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 bg-slate-900/60 rounded-xl border border-slate-800 animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-8 text-center space-y-3">
          <p className="text-xs text-rose-400">Failed to load your purchase orders.</p>
          <Button variant="outline" size="sm" onClick={() => window.location.reload()} className="text-xs">
            Retry
          </Button>
        </div>
      ) : !orders || orders.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/40 p-12 text-center space-y-4 max-w-md mx-auto">
          <Package className="w-10 h-10 text-slate-600 mx-auto" />
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white">No orders found</h3>
            <p className="text-xs text-slate-400">
              {selectedStatus === "ALL"
                ? "You haven't placed any wholesale orders yet."
                : `No orders matching status '${selectedStatus}'.`}
            </p>
          </div>
          <Link to="/marketplace">
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1.5">
              <span>Go to Marketplace</span>
              <ArrowRight className="w-3.5 h-3.5" />
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
                {/* Left info */}
                <div className="flex items-start gap-4 flex-1">
                  <div className="w-16 h-16 rounded-lg bg-slate-950 overflow-hidden shrink-0 border border-slate-800 flex items-center justify-center">
                    {order.first_product_image ? (
                      <img
                        src={order.first_product_image}
                        alt={order.first_product_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <ImageOff className="w-5 h-5 text-slate-600" />
                    )}
                  </div>

                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-emerald-400">
                        #{order.order_number}
                      </span>
                      <OrderStatusBadge status={order.status} />
                    </div>

                    <h3 className="font-bold text-white text-sm sm:text-base group-hover:text-emerald-400 transition-colors">
                      {order.first_product_name}
                      {order.items_count > 1 && (
                        <span className="text-slate-400 font-normal text-xs ml-1.5">
                          (+{order.items_count - 1} more item{order.items_count > 2 ? "s" : ""})
                        </span>
                      )}
                    </h3>

                    <div className="flex items-center gap-3 text-[11px] text-slate-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-500" />
                        <span>{new Date(order.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                      </span>
                      <span>•</span>
                      <span>{order.items_count} produce lot{order.items_count > 1 ? "s" : ""}</span>
                    </div>
                  </div>
                </div>

                {/* Right price and action */}
                <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-3 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-800 shrink-0">
                  <div className="text-left sm:text-right">
                    <span className="text-[10px] uppercase font-mono text-slate-400 block">
                      Total Amount
                    </span>
                    <span className="text-xl font-black text-white font-mono">
                      ₹{order.total_amount.toLocaleString()}
                    </span>
                  </div>

                  <Link to={`/buyer/orders/${order.id}`}>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs h-8 gap-1.5 border-slate-700 hover:bg-emerald-600 hover:text-white hover:border-emerald-600 transition-all font-semibold"
                    >
                      <span>View Order</span>
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
