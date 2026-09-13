import React, { useState } from "react";
import { usePriceHistory } from "@/hooks/usePriceIntelligence";
import { PriceHistoryChart } from "@/components/price-intelligence/PriceHistoryChart";
import { PriceTrendBadge } from "@/components/price-intelligence/PriceTrendBadge";
import { History, Filter, ArrowLeft, Calendar, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";

export const FarmerPriceHistoryPage: React.FC = () => {
  const [productName, setProductName] = useState("Tomato");
  const [variety, setVariety] = useState("Hybrid");
  const [qualityGrade, setQualityGrade] = useState("GRADE_A");
  const [daysBack, setDaysBack] = useState(30);

  const { data: historyData, isLoading, refetch, isRefetching } = usePriceHistory(
    productName,
    variety,
    qualityGrade,
    daysBack
  );

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl space-y-6">
      {/* Navigation & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            to="/farmer/price-intelligence"
            className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground mb-2 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Price Intelligence
          </Link>
          <h1 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
            <History className="h-6 w-6 text-emerald-500" />
            Historical Price Intelligence Log
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Historical price observations and market trends over custom time windows.
          </p>
        </div>

        <button
          type="button"
          onClick={() => refetch()}
          disabled={isRefetching}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border text-xs font-semibold text-foreground hover:bg-muted transition-colors self-start sm:self-auto"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isRefetching ? "animate-spin" : ""}`} />
          Refresh Data
        </button>
      </div>

      {/* Filter Controls */}
      <div className="p-5 rounded-2xl border border-border bg-card shadow-2xs">
        <h2 className="font-extrabold text-sm text-foreground flex items-center gap-2 mb-3">
          <Filter className="h-4 w-4 text-emerald-500" />
          Filter History Query
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div>
            <label className="font-semibold text-foreground block mb-1">Produce *</label>
            <input
              type="text"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              placeholder="e.g. Tomato"
              className="w-full px-3 py-2 rounded-xl border border-input bg-background text-foreground text-sm font-medium"
            />
          </div>

          <div>
            <label className="font-semibold text-foreground block mb-1">Variety</label>
            <input
              type="text"
              value={variety}
              onChange={(e) => setVariety(e.target.value)}
              placeholder="e.g. Hybrid"
              className="w-full px-3 py-2 rounded-xl border border-input bg-background text-foreground text-sm"
            />
          </div>

          <div>
            <label className="font-semibold text-foreground block mb-1">Quality Grade</label>
            <select
              value={qualityGrade}
              onChange={(e) => setQualityGrade(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-input bg-background text-foreground text-sm"
            >
              <option value="PREMIUM">PREMIUM</option>
              <option value="GRADE_A">GRADE_A</option>
              <option value="GRADE_B">GRADE_B</option>
              <option value="GRADE_C">GRADE_C</option>
              <option value="UNGRADED">UNGRADED</option>
            </select>
          </div>

          <div>
            <label className="font-semibold text-foreground block mb-1">Time Window</label>
            <select
              value={daysBack}
              onChange={(e) => setDaysBack(parseInt(e.target.value))}
              className="w-full px-3 py-2 rounded-xl border border-input bg-background text-foreground text-sm font-semibold"
            >
              <option value={7}>Last 7 Days</option>
              <option value={30}>Last 30 Days</option>
              <option value={90}>Last 90 Days</option>
              <option value={180}>Last 180 Days</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Chart */}
      {isLoading ? (
        <div className="p-12 text-center border border-border rounded-2xl bg-card animate-pulse">
          <div className="h-6 w-48 bg-muted rounded mx-auto mb-2" />
          <div className="h-4 w-32 bg-muted rounded mx-auto" />
        </div>
      ) : historyData ? (
        <div className="space-y-6">
          <PriceHistoryChart historyData={historyData} height={260} />

          {/* Daily Table Log */}
          {historyData.history.length > 0 && (
            <div className="p-5 rounded-2xl border border-border bg-card shadow-2xs">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-border">
                <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-emerald-500" />
                  Daily Observation Breakdown
                </h3>
                <PriceTrendBadge trend={historyData.trend} />
              </div>

              <div className="overflow-x-auto rounded-xl border border-border">
                <table className="w-full text-left text-xs">
                  <thead className="bg-muted/50 border-b border-border text-muted-foreground uppercase text-[11px] font-semibold">
                    <tr>
                      <th className="py-2.5 px-4">Date</th>
                      <th className="py-2.5 px-4">Avg Price (INR/KG)</th>
                      <th className="py-2.5 px-4">Min Price</th>
                      <th className="py-2.5 px-4">Max Price</th>
                      <th className="py-2.5 px-4">Observations</th>
                      <th className="py-2.5 px-4">Sources</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {historyData.history.map((pt, idx) => (
                      <tr key={idx} className="hover:bg-muted/30">
                        <td className="py-2.5 px-4 font-semibold text-foreground">{pt.observation_date}</td>
                        <td className="py-2.5 px-4 font-bold text-emerald-600 dark:text-emerald-400">
                          ₹{pt.avg_price_per_kg}/kg
                        </td>
                        <td className="py-2.5 px-4 text-muted-foreground">₹{pt.min_price_per_kg}/kg</td>
                        <td className="py-2.5 px-4 text-muted-foreground">₹{pt.max_price_per_kg}/kg</td>
                        <td className="py-2.5 px-4 font-medium text-foreground">{pt.observation_count}</td>
                        <td className="py-2.5 px-4 text-muted-foreground text-[11px]">
                          {pt.source_types.join(", ")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
};
