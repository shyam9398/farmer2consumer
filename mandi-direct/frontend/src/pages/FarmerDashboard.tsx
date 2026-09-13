import React from "react";
import { Link } from "react-router-dom";
import {
  Sprout,
  TrendingUp,
  DollarSign,
  ArrowRight,
  Package,
  Bell,
  AlertTriangle,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { useFarmerSummary, useFarmerProfile } from "@/hooks/useFarmer";
import { useProduceStats } from "@/hooks/useProduce";
import { useFarmerOrderStats, useFarmerOrders, useUpdateFarmerOrderStatus } from "@/hooks/useOrders";
import { useFarmerEarningsSummary } from "@/hooks/useEarnings";
import { useDemandSummary } from "@/lib/demandApi";
import { VerificationBadge } from "@/components/farmer/VerificationBadge";
import { FarmerOrderSummary } from "@/types/order";

export const FarmerDashboard: React.FC = () => {
  const { profile: userProfile } = useAuth();
  const { t } = useLanguage();

  const { data: summary } = useFarmerSummary();
  const { data: farmerProfile } = useFarmerProfile();
  const { data: produceStats } = useProduceStats();
  const { data: orderStats } = useFarmerOrderStats();
  const { data: pendingOrders } = useFarmerOrders({ status: "PENDING" });
  const { data: earningsSummary } = useFarmerEarningsSummary();
  const { data: demandSummary } = useDemandSummary(30, 5);
  const statusMutation = useUpdateFarmerOrderStatus();

  const farmerName =
    summary?.farmer_name || farmerProfile?.full_name || userProfile?.full_name || "Kisan";
  const verificationStatus =
    summary?.verification_status || farmerProfile?.verification_status || "PENDING";
  const verificationNotes =
    summary?.verification_notes || farmerProfile?.verification_notes || null;
  const completionPct = summary?.profile_completion_pct ?? farmerProfile?.profile_completion_pct ?? 0;
  const isComplete = summary?.is_profile_complete ?? farmerProfile?.is_profile_complete ?? false;

  const handleAcceptOrder = async (orderId: string) => {
    try {
      await statusMutation.mutateAsync({
        orderId,
        status: "ACCEPTED",
        reason: "Accepted from farmer dashboard",
      });
    } catch (err) {
      console.error("Failed to accept order:", err);
    }
  };

  const pendingCount = orderStats?.pending ?? (pendingOrders ? pendingOrders.length : 0);
  const totalListed = produceStats?.total_listings ?? 0;
  const totalEarnings = earningsSummary?.total_net
    ? `₹${Number(earningsSummary.total_net).toLocaleString('en-IN')}`
    : "₹0";

  return (
    <div className="container mx-auto px-4 sm:px-8 py-8 space-y-8 max-w-6xl">
      {/* Top Banner & Farmer Greeting */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/60 pb-6">
        <div>
          <div className="flex items-center gap-2.5 mb-2">
            <Badge variant="success" className="font-mono text-xs">
              MANDI DIRECT
            </Badge>
            <VerificationBadge
              status={verificationStatus}
              notes={verificationNotes}
              showNotesInline={false}
            />
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white flex items-center gap-3">
            <span>{t.farmerDashboard.greeting}</span>
          </h1>
          <p className="text-sm text-slate-300 mt-1">
            {t.farmerDashboard.subtitle} ({farmerName})
          </p>
        </div>

        {/* Farmer Profile quick link */}
        <div className="flex items-center gap-2">
          <Link to="/farmer/profile">
            <Button variant="outline" size="sm" className="text-xs">
              {t.nav.profile}
            </Button>
          </Link>
        </div>
      </div>

      {/* Profile Incomplete Banner */}
      {!isComplete && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0" />
            <div>
              <p className="text-xs font-bold text-amber-300">
                Profile Registration: {completionPct}%
              </p>
              <p className="text-xs text-slate-300">
                Complete your address details to verify your account and speed up order pickups.
              </p>
            </div>
          </div>
          <Link to="/farmer/profile" className="shrink-0">
            <Button size="sm" variant="harvest" className="text-xs h-8">
              <span>Complete Profile</span>
              <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </Link>
        </div>
      )}

      {/* PRIMARY TOUCH ZONE: 5 Large Touch Buttons */}
      <section className="space-y-3">
        <h2 className="text-base font-bold text-white tracking-wide flex items-center gap-2">
          <span>{t.farmerDashboard.quickActions}</span>
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          {/* Button 1: + Upload Crop */}
          <Link
            to="/farmer/produce/new"
            data-tour-id="upload-crop"
            className="group p-5 rounded-2xl bg-gradient-to-br from-emerald-600/20 via-emerald-600/10 to-transparent border-2 border-emerald-500/40 hover:border-emerald-400 hover:bg-emerald-600/25 transition-all duration-200 flex flex-col justify-between items-start min-h-[130px] shadow-lg shadow-emerald-950/30"
          >
            <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 group-hover:scale-110 transition-transform">
              <Sprout className="h-6 w-6" />
            </div>
            <div>
              <p className="font-extrabold text-base text-white group-hover:text-emerald-300">
                {t.farmerDashboard.btnUploadCrop}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">Sell fresh harvest</p>
            </div>
          </Link>

          {/* Button 2: My Orders */}
          <Link
            to="/farmer/orders"
            data-tour-id="orders-action"
            className="group relative p-5 rounded-2xl bg-gradient-to-br from-amber-600/20 via-amber-600/10 to-transparent border-2 border-amber-500/40 hover:border-amber-400 hover:bg-amber-600/25 transition-all duration-200 flex flex-col justify-between items-start min-h-[130px] shadow-lg shadow-amber-950/30"
          >
            {pendingCount > 0 && (
              <span className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 font-bold text-xs">
                {pendingCount} new
              </span>
            )}
            <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 group-hover:scale-110 transition-transform">
              <Package className="h-6 w-6" />
            </div>
            <div>
              <p className="font-extrabold text-base text-white group-hover:text-amber-300">
                {t.farmerDashboard.btnMyOrders}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">Buyer purchases</p>
            </div>
          </Link>

          {/* Button 3: My Earnings */}
          <Link
            to="/farmer/earnings"
            data-tour-id="earnings-action"
            className="group p-5 rounded-2xl bg-gradient-to-br from-teal-600/20 via-teal-600/10 to-transparent border-2 border-teal-500/40 hover:border-teal-400 hover:bg-teal-600/25 transition-all duration-200 flex flex-col justify-between items-start min-h-[130px] shadow-lg shadow-teal-950/30"
          >
            <div className="p-2.5 rounded-xl bg-teal-500/20 text-teal-400 group-hover:scale-110 transition-transform">
              <DollarSign className="h-6 w-6" />
            </div>
            <div>
              <p className="font-extrabold text-base text-white group-hover:text-teal-300">
                {t.farmerDashboard.btnMyEarnings}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">Payouts & balance</p>
            </div>
          </Link>

          {/* Button 4: Market Price */}
          <Link
            to="/farmer/market-prices"
            data-tour-id="market-price-action"
            className="group p-5 rounded-2xl bg-gradient-to-br from-blue-600/20 via-blue-600/10 to-transparent border-2 border-blue-500/40 hover:border-blue-400 hover:bg-blue-600/25 transition-all duration-200 flex flex-col justify-between items-start min-h-[130px] shadow-lg shadow-blue-950/30"
          >
            <div className="p-2.5 rounded-xl bg-blue-500/20 text-blue-400 group-hover:scale-110 transition-transform">
              <TrendingUp className="h-6 w-6" />
            </div>
            <div>
              <p className="font-extrabold text-base text-white group-hover:text-blue-300">
                {t.farmerDashboard.btnMarketPrice}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">APMC Mandi rates</p>
            </div>
          </Link>

          {/* Button 5: Notifications */}
          <Link
            to="/notifications"
            data-tour-id="notifications-action"
            className="group p-5 rounded-2xl bg-gradient-to-br from-purple-600/20 via-purple-600/10 to-transparent border-2 border-purple-500/40 hover:border-purple-400 hover:bg-purple-600/25 transition-all duration-200 flex flex-col justify-between items-start min-h-[130px] shadow-lg shadow-purple-950/30 col-span-2 sm:col-span-1"
          >
            <div className="p-2.5 rounded-xl bg-purple-500/20 text-purple-400 group-hover:scale-110 transition-transform">
              <Bell className="h-6 w-6" />
            </div>
            <div>
              <p className="font-extrabold text-base text-white group-hover:text-purple-300">
                {t.farmerDashboard.btnNotifications}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">Alerts & messages</p>
            </div>
          </Link>
        </div>
      </section>

      {/* 5 CLEAR METRICS CARDS */}
      <section className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* Metric 1: Total Produce */}
        <div className="p-4 rounded-2xl bg-secondary/30 border border-border/60 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              {t.farmerDashboard.metrics.totalProduce}
            </span>
            <Sprout className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-3">
            <p className="text-2xl font-extrabold text-white font-mono">{totalListed}</p>
            <p className="text-[11px] text-slate-400">{t.farmerDashboard.metrics.totalProduceSubtitle}</p>
          </div>
        </div>

        {/* Metric 2: New Orders */}
        <div className="p-4 rounded-2xl bg-secondary/30 border border-border/60 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider">
              {t.farmerDashboard.metrics.newOrders}
            </span>
            <Package className="h-4 w-4 text-amber-400" />
          </div>
          <div className="mt-3">
            <p className="text-2xl font-extrabold text-amber-400 font-mono">{pendingCount}</p>
            <p className="text-[11px] text-slate-400">{t.farmerDashboard.metrics.newOrdersSubtitle}</p>
          </div>
        </div>

        {/* Metric 3: Total Earnings */}
        <div className="p-4 rounded-2xl bg-secondary/30 border border-border/60 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-teal-400 uppercase tracking-wider">
              {t.farmerDashboard.metrics.totalEarnings}
            </span>
            <DollarSign className="h-4 w-4 text-teal-400" />
          </div>
          <div className="mt-3">
            <p className="text-2xl font-extrabold text-teal-400 font-mono truncate">{totalEarnings}</p>
            <p className="text-[11px] text-slate-400">{t.farmerDashboard.metrics.totalEarningsSubtitle}</p>
          </div>
        </div>

        {/* Metric 4: Market Price */}
        <div className="p-4 rounded-2xl bg-secondary/30 border border-border/60 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-blue-400 uppercase tracking-wider">
              {t.farmerDashboard.metrics.marketPrice}
            </span>
            <TrendingUp className="h-4 w-4 text-blue-400" />
          </div>
          <div className="mt-3">
            <p className="text-lg font-bold text-white">Live Benchmark</p>
            <p className="text-[11px] text-slate-400">{t.farmerDashboard.metrics.marketPriceSubtitle}</p>
          </div>
        </div>

        {/* Metric 5: Demand Alerts */}
        <div className="p-4 rounded-2xl bg-secondary/30 border border-border/60 flex flex-col justify-between col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-purple-400 uppercase tracking-wider">
              {t.farmerDashboard.metrics.demandAlerts}
            </span>
            <TrendingUp className="h-4 w-4 text-purple-400" />
          </div>
          <div className="mt-3">
            <p className="text-2xl font-extrabold text-purple-400 font-mono">
              {demandSummary?.top_demanded_products?.length || 0}
            </p>
            <p className="text-[11px] text-slate-400">{t.farmerDashboard.metrics.demandAlertsSubtitle}</p>
          </div>
        </div>
      </section>

      {/* RECENT ORDERS LIST */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Package className="h-5 w-5 text-amber-400" />
            <span>{t.farmerDashboard.recentOrdersTitle}</span>
          </h2>
          <Link to="/farmer/orders">
            <Button variant="ghost" size="sm" className="text-xs text-amber-400 hover:text-amber-300">
              {t.farmerDashboard.viewAllOrders}
              <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </Link>
        </div>

        {(!pendingOrders || pendingOrders.length === 0) ? (
          <div className="p-8 rounded-2xl border border-dashed border-border/80 bg-secondary/10 text-center space-y-2">
            <Package className="h-10 w-10 text-slate-500 mx-auto" />
            <p className="text-sm text-slate-300 font-medium">
              {t.farmerDashboard.noOrders}
            </p>
            <Link to="/farmer/produce/new">
              <Button variant="harvest" size="sm" className="mt-2 text-xs">
                {t.farmerDashboard.btnUploadCrop}
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingOrders.slice(0, 4).map((order: FarmerOrderSummary) => (
              <div
                key={order.id}
                className="p-5 rounded-2xl bg-secondary/25 border border-border/70 hover:border-amber-500/40 transition-colors space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-slate-400">
                    Order #{order.order_number || order.id.slice(0, 8)}
                  </span>
                  <Badge variant="warning" className="text-[10px]">
                    {order.status}
                  </Badge>
                </div>

                <div>
                  <p className="text-base font-bold text-white">
                    ₹{order.farmer_subtotal}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {order.items_count} crop lots requested
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-border/40">
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {new Date(order.created_at).toLocaleDateString()}
                  </span>
                  <div className="flex items-center gap-2">
                    <Link to={`/farmer/orders/${order.id}`}>
                      <Button variant="outline" size="sm" className="text-xs h-7">
                        Details
                      </Button>
                    </Link>
                    <Button
                      variant="harvest"
                      size="sm"
                      className="text-xs h-7"
                      onClick={() => handleAcceptOrder(order.id)}
                    >
                      Accept
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* DEMAND INTELLIGENCE HIGHLIGHTS */}
      {demandSummary && demandSummary.top_demanded_products && demandSummary.top_demanded_products.length > 0 && (
        <section className="p-6 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-emerald-400" />
                <span>High Buyer Demand in Your Region</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Commodities buyers are actively searching for right now
              </p>
            </div>
            <Link to="/farmer/demand-intelligence">
              <Button variant="ghost" size="sm" className="text-xs text-emerald-400">
                View Intelligence
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {demandSummary.top_demanded_products.map((crop, idx) => (
              <div key={idx} className="p-3 rounded-xl bg-slate-900/60 border border-emerald-500/20 text-center">
                <p className="text-xs font-bold text-white truncate">{crop.product_name}</p>
                <p className="text-[10px] text-emerald-400 font-semibold mt-0.5">
                  Score: {crop.demand_score}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default FarmerDashboard;
