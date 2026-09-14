import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  Wallet,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  Search,
  ArrowRight,
  ShieldCheck,
  Calendar,
  X,
  RefreshCw,
  Receipt,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EarningStatusBadge } from "@/components/earnings/EarningStatusBadge";
import {
  useFarmerEarnings,
  useFarmerEarningsSummary,
  useFarmerEarningDetail,
} from "@/hooks/useEarnings";

const STATUS_FILTERS: { id: string; label: string }[] = [
  { id: "ALL", label: "All Records" },
  { id: "AVAILABLE", label: "Available" },
  { id: "PENDING_SETTLEMENT", label: "Pending Settlement" },
  { id: "PAID", label: "Paid / Disbursed" },
  { id: "EXPECTED", label: "Expected" },
  { id: "CANCELLED", label: "Cancelled" },
];

export const FarmerEarningsPage: React.FC = () => {
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedEarningId, setSelectedEarningId] = useState<string | null>(null);

  // Authoritative real API hooks
  const {
    data: summary,
    isLoading: isSummaryLoading,
    isError: isSummaryError,
    refetch: refetchSummary,
  } = useFarmerEarningsSummary();

  const {
    data: earningsData,
    isLoading: isListLoading,
    isError: isListError,
    refetch: refetchList,
  } = useFarmerEarnings({
    status: selectedStatus === "ALL" ? undefined : selectedStatus,
    product: searchTerm.trim() ? searchTerm.trim() : undefined,
  });

  // Modal detail hook
  const { data: detailData, isLoading: isDetailLoading } = useFarmerEarningDetail(
    selectedEarningId || ""
  );

  const hasPageError = isSummaryError || isListError;

  const handleRetry = () => {
    refetchSummary();
    refetchList();
  };

  // Filter items in memory if search query was typed for order number
  const items = (earningsData?.items || []).filter((item) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      item.product_name.toLowerCase().includes(term) ||
      item.order_number.toLowerCase().includes(term)
    );
  });

  return (
    <div className="container mx-auto px-4 sm:px-8 py-8 sm:py-12 max-w-6xl space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <Wallet className="w-7 h-7 text-teal-400" />
            <span>My Earnings & Payouts</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Real-time verified wholesale earnings, transparent commission breakdowns, and bank payout records.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link to="/farmer/orders">
            <Button variant="outline" size="sm" className="text-xs gap-1.5 border-slate-700 text-slate-300 hover:text-white">
              <Receipt className="w-3.5 h-3.5 text-amber-400" />
              <span>Farm Orders</span>
            </Button>
          </Link>
          <Link to="/farmer/produce">
            <Button variant="harvest" size="sm" className="text-xs gap-1.5">
              <span>Manage Produce</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Global Error State */}
      {hasPageError && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-950/20 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            <div>
              <h4 className="text-sm font-semibold text-rose-200">Unable to load verified earnings</h4>
              <p className="text-xs text-rose-400/90 mt-0.5">
                Could not connect to the financial ledger service. Please check your network or try again.
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRetry}
            className="text-xs gap-1.5 border-rose-500/40 text-rose-300 hover:bg-rose-500/10 shrink-0"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry</span>
          </Button>
        </div>
      )}

      {/* Financial Summary Cards */}
      <div
        data-tour-id="earnings-summary-card"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {/* Card 1: Total Net Earnings */}
        <Card className="glass-card border-border/60 bg-gradient-to-br from-slate-900/90 to-emerald-950/20 shadow-md">
          <CardContent className="p-5 space-y-2">
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
              <span>Total Net Earnings</span>
              <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            {isSummaryLoading ? (
              <div className="h-8 w-32 bg-slate-800 rounded animate-pulse" />
            ) : (
              <div className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono tracking-tight">
                ₹{Number(summary?.total_net || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            )}
            <p className="text-[11px] text-slate-400">
              Net take-home after zero middleman charges
            </p>
          </CardContent>
        </Card>

        {/* Card 2: Available for Payout */}
        <Card className="glass-card border-border/60 bg-gradient-to-br from-slate-900/90 to-teal-950/20 shadow-md">
          <CardContent className="p-5 space-y-2">
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
              <span>Available Balance</span>
              <div className="p-1.5 rounded-lg bg-teal-500/10 text-teal-300">
                <Wallet className="w-4 h-4" />
              </div>
            </div>
            {isSummaryLoading ? (
              <div className="h-8 w-32 bg-slate-800 rounded animate-pulse" />
            ) : (
              <div className="text-2xl sm:text-3xl font-black text-teal-300 font-mono tracking-tight">
                ₹{Number(summary?.available_balance || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            )}
            <p className="text-[11px] text-slate-400">
              Verified & ready for bank disbursement
            </p>
          </CardContent>
        </Card>

        {/* Card 3: Pending Settlement */}
        <Card className="glass-card border-border/60 bg-gradient-to-br from-slate-900/90 to-amber-950/20 shadow-md">
          <CardContent className="p-5 space-y-2">
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
              <span>Pending Settlement</span>
              <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            {isSummaryLoading ? (
              <div className="h-8 w-32 bg-slate-800 rounded animate-pulse" />
            ) : (
              <div className="text-2xl sm:text-3xl font-black text-amber-400 font-mono tracking-tight">
                ₹{Number(summary?.pending_settlement || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            )}
            <p className="text-[11px] text-slate-400">
              In-transit or undergoing batch reconciliation
            </p>
          </CardContent>
        </Card>

        {/* Card 4: Total Paid Out */}
        <Card className="glass-card border-border/60 bg-gradient-to-br from-slate-900/90 to-cyan-950/20 shadow-md">
          <CardContent className="p-5 space-y-2">
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
              <span>Total Disbursed</span>
              <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            {isSummaryLoading ? (
              <div className="h-8 w-32 bg-slate-800 rounded animate-pulse" />
            ) : (
              <div className="text-2xl sm:text-3xl font-black text-cyan-300 font-mono tracking-tight">
                ₹{Number(summary?.total_paid || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            )}
            <p className="text-[11px] text-slate-400">
              Completed bank transfers to your account
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Direct Mandi Value Proposition Banner */}
      <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-300 shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white">Direct Farmer-to-Consumer Advantage</h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                0% Broker Cut
              </span>
            </div>
            <p className="text-xs text-slate-300 max-w-2xl">
              Traditional APMC mandi traders deduct 10%–18% in commissions, weighing cuts, and handling charges.
              By selling directly through Mandi Direct, your estimated extra margin earned is:
            </p>
          </div>
        </div>

        <div className="text-left md:text-right shrink-0 bg-slate-900/60 p-3 rounded-xl border border-emerald-500/20 min-w-[180px]">
          <span className="text-[10px] uppercase font-mono text-slate-400 block">
            Estimated Middlemen Savings
          </span>
          <span className="text-xl font-black text-emerald-400 font-mono">
            +₹{Number(summary?.estimated_additional_earnings || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span className="text-[10px] text-emerald-300/80 block mt-0.5">
            15% higher real realization
          </span>
        </div>
      </div>

      {/* Additional Stats Strip */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/50">
            <span className="text-[11px] text-slate-400 block">Gross Sales Value</span>
            <span className="text-base font-bold text-white font-mono">
              ₹{Number(summary.total_gross || summary.total_sales || 0).toLocaleString("en-IN")}
            </span>
          </div>
          <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/50">
            <span className="text-[11px] text-slate-400 block">Total Deductions</span>
            <span className="text-base font-bold text-emerald-400 font-mono">
              ₹{Number(summary.total_deductions || 0).toLocaleString("en-IN")} (0.00%)
            </span>
          </div>
          <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/50">
            <span className="text-[11px] text-slate-400 block">Delivered Orders</span>
            <span className="text-base font-bold text-white font-mono">
              {summary.delivered_orders} / {summary.total_orders}
            </span>
          </div>
          <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/50">
            <span className="text-[11px] text-slate-400 block">Total Volume Sold</span>
            <span className="text-base font-bold text-white font-mono">
              {Number(summary.total_quantity_sold || summary.produce_sold_qty || 0).toLocaleString("en-IN")} Units
            </span>
          </div>
        </div>
      )}

      {/* Search & Filter Controls */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by produce lot or order number (e.g. Tomato, ORD-...)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-900/80 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRetry}
              className="text-xs h-9 border-slate-800 text-slate-300 hover:text-white"
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1" />
              <span>Refresh Ledger</span>
            </Button>
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex space-x-1.5 overflow-x-auto pb-1 border-b border-slate-800">
          {STATUS_FILTERS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedStatus(tab.id)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                selectedStatus === tab.id
                  ? "bg-teal-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Earnings Records List */}
      {isListLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-slate-900/60 rounded-xl border border-slate-800 animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/40 p-12 text-center space-y-4 max-w-md mx-auto">
          <Receipt className="w-10 h-10 text-slate-600 mx-auto" />
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white">No earnings records found</h3>
            <p className="text-xs text-slate-400">
              {selectedStatus === "ALL"
                ? "Earnings are automatically ledgered once wholesale purchase orders reach delivery."
                : `No earning records currently match '${selectedStatus}' status.`}
            </p>
          </div>
          <div className="flex items-center justify-center gap-2 pt-2">
            <Link to="/farmer/orders">
              <Button size="sm" variant="outline" className="text-xs border-slate-700">
                Check Order Status
              </Button>
            </Link>
            <Link to="/farmer/produce">
              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs">
                List Farm Produce
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((earning) => (
            <Card
              key={earning.id}
              className="glass-card border-border/60 hover:border-teal-500/40 transition-all group overflow-hidden"
            >
              <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold text-teal-400">
                      #{earning.order_number}
                    </span>
                    <EarningStatusBadge status={earning.status} />
                    <span className="text-xs font-semibold text-white">
                      {earning.product_name}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                    <span>
                      Qty:{" "}
                      <strong className="text-slate-200">
                        {Number(earning.quantity).toLocaleString()} {earning.quantity_unit}
                      </strong>
                    </span>
                    <span>•</span>
                    <span>
                      Rate:{" "}
                      <strong className="text-slate-200">
                        ₹{Number(earning.unit_price).toFixed(2)} / {earning.quantity_unit}
                      </strong>
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-500" />
                      <span>
                        {new Date(earning.earned_at || earning.created_at).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </span>
                  </div>

                  {/* Deduction breakdown snippet */}
                  <div className="text-[11px] text-slate-500">
                    Gross: ₹{Number(earning.gross_amount).toFixed(2)} | Fees & Deductions: ₹
                    {(
                      Number(earning.platform_fee || 0) +
                      Number(earning.logistics_fee || 0) +
                      Number(earning.other_deductions || 0)
                    ).toFixed(2)}
                  </div>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-3 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-800 shrink-0">
                  <div className="text-left sm:text-right">
                    <span className="text-[10px] uppercase font-mono text-slate-400 block">
                      Net Payout Amount
                    </span>
                    <span className="text-xl font-black text-emerald-400 font-mono">
                      ₹{Number(earning.net_amount).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedEarningId(earning.id)}
                      className="text-xs h-8 gap-1.5 border-slate-700 text-slate-300 hover:bg-teal-600 hover:text-white hover:border-teal-600 transition-all font-semibold"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View Breakdown</span>
                    </Button>
                    <Link to={`/farmer/orders/${earning.order_id}`}>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs h-8 text-slate-400 hover:text-white"
                        title="Go to associated order"
                      >
                        <Receipt className="w-3.5 h-3.5" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Itemized Earning Detail Modal */}
      {selectedEarningId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="space-y-0.5">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-teal-400" />
                  <span>Financial Breakdown</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Ledger Record ID: <span className="font-mono text-slate-300">{selectedEarningId}</span>
                </p>
              </div>
              <button
                onClick={() => setSelectedEarningId(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {isDetailLoading ? (
              <div className="space-y-3 py-6">
                <div className="h-4 bg-slate-800 rounded animate-pulse w-3/4" />
                <div className="h-4 bg-slate-800 rounded animate-pulse w-1/2" />
                <div className="h-4 bg-slate-800 rounded animate-pulse w-2/3" />
              </div>
            ) : detailData ? (
              <div className="space-y-4">
                {/* Meta details */}
                <div className="bg-slate-950/60 rounded-xl p-3.5 border border-slate-800 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Order Reference:</span>
                    <Link
                      to={`/farmer/orders/${detailData.order_id}`}
                      className="font-mono text-teal-400 hover:underline font-bold"
                    >
                      #{detailData.order_number}
                    </Link>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Status:</span>
                    <EarningStatusBadge status={detailData.status} />
                  </div>
                  {detailData.buyer_name && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Wholesale Buyer:</span>
                      <span className="text-white font-medium">{detailData.buyer_name}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Produce Lot:</span>
                    <span className="text-white font-medium">{detailData.product_name}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Delivered Quantity:</span>
                    <span className="text-white font-mono">
                      {Number(detailData.quantity).toLocaleString()} {detailData.quantity_unit}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Agreed Unit Rate:</span>
                    <span className="text-white font-mono">
                      ₹{Number(detailData.unit_price).toFixed(2)} / {detailData.quantity_unit}
                    </span>
                  </div>
                </div>

                {/* Accounting breakdown */}
                <div className="rounded-xl border border-slate-800 p-4 space-y-2.5 bg-slate-900/60">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Settlement Statement
                  </h4>
                  <div className="flex justify-between text-xs text-slate-300">
                    <span>Gross Produce Subtotal</span>
                    <span className="font-mono text-white">
                      ₹{Number(detailData.gross_amount).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <span>Platform Service Fee</span>
                      <span className="text-[10px] text-emerald-400 font-bold">(0% Free)</span>
                    </span>
                    <span className="font-mono text-slate-300">
                      -₹{Number(detailData.platform_fee || 0).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>Logistics Deduction</span>
                    <span className="font-mono text-slate-300">
                      -₹{Number(detailData.logistics_fee || 0).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>Taxes & Other Deductions</span>
                    <span className="font-mono text-slate-300">
                      -₹{Number(detailData.other_deductions || 0).toFixed(2)}
                    </span>
                  </div>
                  <div className="border-t border-slate-800 pt-2 flex justify-between text-sm font-bold">
                    <span className="text-white">Net Disbursable Amount</span>
                    <span className="text-emerald-400 font-mono text-base">
                      ₹{Number(detailData.net_amount).toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Timeline info */}
                <div className="text-[11px] text-slate-400 space-y-1">
                  <div>
                    Order Placed:{" "}
                    {new Date(detailData.created_at).toLocaleString("en-IN")}
                  </div>
                  {detailData.delivery_date && (
                    <div>
                      Delivery Completed:{" "}
                      {new Date(detailData.delivery_date).toLocaleString("en-IN")}
                    </div>
                  )}
                  {detailData.settlement_date && (
                    <div>
                      Settled to Available:{" "}
                      {new Date(detailData.settlement_date).toLocaleString("en-IN")}
                    </div>
                  )}
                  {detailData.paid_date && (
                    <div className="text-cyan-400">
                      Bank Transfer Disbursed:{" "}
                      {new Date(detailData.paid_date).toLocaleString("en-IN")}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-6 text-xs text-rose-400">
                Failed to load earning details.
              </div>
            )}

            <div className="flex items-center justify-end pt-2 border-t border-slate-800">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedEarningId(null)}
                className="text-xs"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FarmerEarningsPage;
