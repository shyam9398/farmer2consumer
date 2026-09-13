import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  useDemandSummary,
  useProductDemand,
  useRegionalDemand,
  useDemandRecommendations,
} from "@/lib/demandApi";
import { DemandScoreCard } from "@/components/demand/DemandScoreCard";
import { PriceDemandCombinedCard } from "@/components/demand/PriceDemandCombinedCard";
import { ProductDemandRanking } from "@/components/demand/ProductDemandRanking";
import { RegionalDemandCard } from "@/components/demand/RegionalDemandCard";
import { usePriceDemandCombinedInsight } from "@/lib/demandApi";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  TrendingUp,
  BarChart3,
  Calendar,
  Sparkles,
  MapPin,
  Loader2,
  RefreshCw,
} from "lucide-react";

export const FarmerDemandIntelligencePage: React.FC = () => {
  const [periodDays, setPeriodDays] = useState<number>(30);
  const [selectedProduct, setSelectedProduct] = useState<string>("Tomato");

  const { data: summary, refetch: refetchSummary } = useDemandSummary(periodDays);
  const { data: productDemand } = useProductDemand(selectedProduct, periodDays);
  const { data: combinedInsight } = usePriceDemandCombinedInsight(selectedProduct, periodDays);
  const { data: regionalData } = useRegionalDemand(selectedProduct, periodDays);
  const { data: recommendations } = useDemandRecommendations(periodDays);

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div>
            <div className="flex items-center gap-2 text-emerald-600 font-semibold text-xs uppercase tracking-wider mb-1">
              <TrendingUp className="w-4 h-4" />
              Decision Support Engine
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Demand Intelligence
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Real-time marketplace buyer demand analytics, sales velocity, and regional trends.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Time Window Switcher */}
            <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs">
              {[7, 30, 90].map((d) => (
                <button
                  key={d}
                  onClick={() => setPeriodDays(d)}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                    periodDays === d
                      ? "bg-white text-slate-900 shadow-xs"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  {d} Days
                </button>
              ))}
            </div>

            <Link to="/farmer/demand-intelligence/history">
              <Button variant="outline" size="sm" className="gap-1.5">
                <Calendar className="w-4 h-4" />
                Demand History
              </Button>
            </Link>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => refetchSummary()}
              className="text-slate-500 hover:text-slate-800"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Overall Marketplace Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="border border-slate-200">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <span className="text-xs font-medium text-slate-500">Total Market Orders ({periodDays}d)</span>
                <p className="text-2xl font-bold text-slate-900 mt-0.5">
                  {summary ? summary.total_orders : "0"}
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
                <span className="text-xs font-medium text-slate-500">Quantity Sold</span>
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
                <span className="text-xs font-medium text-slate-500">Unique Active Buyers</span>
                <p className="text-2xl font-bold text-slate-900 mt-0.5">
                  {summary ? summary.total_unique_buyers : "0"}
                </p>
              </div>
              <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
                <Sparkles className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Selected Product Analytics Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Selected Product Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Product Selector */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              {["Tomato", "Onion", "Chilli", "Potato", "Rice"].map((p) => (
                <button
                  key={p}
                  onClick={() => setSelectedProduct(p)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border whitespace-nowrap ${
                    selectedProduct === p
                      ? "bg-slate-900 text-white border-slate-900 shadow-2xs"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>

            {productDemand ? (
              <DemandScoreCard demand={productDemand} />
            ) : (
              <div className="p-8 text-center text-slate-400 bg-white rounded-xl border border-slate-200">
                <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                Loading product demand analysis...
              </div>
            )}

            {/* Price + Demand Combined Intelligence */}
            {combinedInsight && <PriceDemandCombinedCard insight={combinedInsight} />}

            {/* Product Demand Ranking Table */}
            <div>
              <h3 className="text-base font-bold text-slate-900 mb-3 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-emerald-600" />
                Product Demand Rankings
              </h3>
              {summary ? (
                <ProductDemandRanking
                  products={summary.top_demanded_products}
                  onSelectProduct={(pName) => setSelectedProduct(pName)}
                />
              ) : (
                <div className="p-6 text-center text-slate-400 bg-white rounded-xl border">Loading rankings...</div>
              )}
            </div>
          </div>

          {/* Sidebar: Recommendations & Regional Demand */}
          <div className="space-y-6">
            {/* Demand Recommendations for Farmers */}
            <Card className="border border-slate-200 bg-white shadow-2xs">
              <CardHeader className="pb-3 border-b border-slate-100">
                <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  Top Crop Demand Opportunities
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-3">
                {recommendations && recommendations.recommendations.length > 0 ? (
                  recommendations.recommendations.map((rec) => (
                    <div
                      key={rec.product_name}
                      onClick={() => setSelectedProduct(rec.product_name)}
                      className="p-3 rounded-xl bg-slate-50 border border-slate-200 hover:border-emerald-300 transition-all cursor-pointer space-y-1"
                    >
                      <div className="flex items-center justify-between text-xs font-bold text-slate-900">
                        <span>{rec.product_name}</span>
                        <span className="text-emerald-700">Score: {rec.demand_score}/100</span>
                      </div>
                      <p className="text-xs text-slate-600 leading-snug">{rec.recommendation_reason}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500">No active high-demand recommendations.</p>
                )}
              </CardContent>
            </Card>

            {/* Regional Demand Distribution */}
            <Card className="border border-slate-200 bg-white shadow-2xs">
              <CardHeader className="pb-3 border-b border-slate-100">
                <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-emerald-600" />
                  Regional Demand ({selectedProduct})
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                {regionalData ? (
                  <RegionalDemandCard regions={regionalData.regions} />
                ) : (
                  <p className="text-xs text-slate-400">Loading regional metrics...</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};
