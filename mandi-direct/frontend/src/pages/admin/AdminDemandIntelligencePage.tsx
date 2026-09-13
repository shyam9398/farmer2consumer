import React, { useState } from "react";
import { useAdminDemandSummary, useAdminDemandRegional } from "@/lib/demandApi";
import { ProductDemandRanking } from "@/components/demand/ProductDemandRanking";
import { RegionalDemandCard } from "@/components/demand/RegionalDemandCard";
import { Card, CardContent } from "@/components/ui/card";
import { BarChart3, TrendingUp, Users, MapPin, ShieldCheck, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export const AdminDemandIntelligencePage: React.FC = () => {
  const [periodDays, setPeriodDays] = useState<number>(30);
  const { data: summary, isLoading, refetch } = useAdminDemandSummary(periodDays);
  const { data: regionalData } = useAdminDemandRegional(undefined, periodDays);

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Admin Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 text-white p-6 rounded-2xl shadow-sm">
          <div>
            <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs uppercase tracking-wider mb-1">
              <ShieldCheck className="w-4 h-4" />
              Admin Governance Console
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              National Demand Intelligence
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1">
              Aggregate demand analytics, order volume trends, and regional supply-demand metrics across India.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center p-1 bg-slate-800 rounded-xl border border-slate-700 text-xs">
              {[7, 30, 90].map((d) => (
                <button
                  key={d}
                  onClick={() => setPeriodDays(d)}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                    periodDays === d ? "bg-emerald-600 text-white shadow-xs" : "text-slate-400 hover:text-white"
                  }`}
                >
                  {d} Days
                </button>
              ))}
            </div>

            <Button variant="outline" size="icon" onClick={() => refetch()} className="border-slate-700 text-slate-300 hover:bg-slate-800">
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* National Aggregated Summary Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="border border-slate-200">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <span className="text-xs font-medium text-slate-500">National Orders ({periodDays}d)</span>
                <p className="text-2xl font-bold text-slate-900 mt-0.5">
                  {summary ? summary.total_orders.toLocaleString() : "0"}
                </p>
              </div>
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                <BarChart3 className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="border border-slate-200">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <span className="text-xs font-medium text-slate-500">National Volume Sold</span>
                <p className="text-2xl font-bold text-slate-900 mt-0.5">
                  {summary ? `${summary.total_quantity_sold.toLocaleString()} KG` : "0 KG"}
                </p>
              </div>
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                <TrendingUp className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="border border-slate-200">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <span className="text-xs font-medium text-slate-500">Registered Active Buyers</span>
                <p className="text-2xl font-bold text-slate-900 mt-0.5">
                  {summary ? summary.total_unique_buyers.toLocaleString() : "0"}
                </p>
              </div>
              <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
                <Users className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-emerald-600" />
              Top Demanded Commodities Across Mandis
            </h3>
            {isLoading ? (
              <div className="p-8 text-center text-slate-400 bg-white rounded-xl border">Loading national demand...</div>
            ) : summary ? (
              <ProductDemandRanking products={summary.top_demanded_products} />
            ) : (
              <div className="p-6 text-center text-slate-400">No demand data available.</div>
            )}
          </div>

          <div>
            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-emerald-600" />
              Statewide Demand Concentration
            </h3>
            {regionalData ? (
              <RegionalDemandCard regions={regionalData.regions} />
            ) : (
              <div className="p-6 text-center text-slate-400">Loading regional metrics...</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
