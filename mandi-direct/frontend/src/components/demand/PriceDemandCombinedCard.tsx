import React from "react";
import { PriceDemandCombinedInsight } from "@/lib/demandApi";
import { DemandLevelBadge } from "./DemandLevelBadge";
import { DemandTrendBadge } from "./DemandTrendBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, DollarSign, Lightbulb } from "lucide-react";

interface PriceDemandCombinedCardProps {
  insight: PriceDemandCombinedInsight;
  className?: string;
}

export const PriceDemandCombinedCard: React.FC<PriceDemandCombinedCardProps> = ({
  insight,
  className = "",
}) => {
  return (
    <Card className={`border border-emerald-200 bg-gradient-to-br from-white via-emerald-50/20 to-teal-50/30 shadow-sm ${className}`}>
      <CardHeader className="pb-3 border-b border-emerald-100 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-emerald-600 text-white">
            <Lightbulb className="w-5 h-5" />
          </div>
          <div>
            <CardTitle className="text-lg font-bold text-slate-900">
              Price + Demand Intelligence
            </CardTitle>
            <p className="text-xs text-slate-500">
              Combined decision support for <span className="font-semibold text-slate-700">{insight.product_name}</span>
            </p>
          </div>
        </div>
        <DemandLevelBadge level={insight.demand_level} />
      </CardHeader>

      <CardContent className="pt-4 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Price Intelligence Box */}
          <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-1.5">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
              <span className="flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                PRICE INTELLIGENCE
              </span>
              {insight.price_trend && (
                <span className="text-emerald-700 font-bold text-[11px] uppercase tracking-wide">
                  {insight.price_trend}
                </span>
              )}
            </div>
            <div className="flex items-baseline justify-between pt-1">
              <div>
                <span className="text-xs text-slate-500">Reference:</span>
                <p className="text-xl font-extrabold text-slate-900">
                  {insight.reference_price ? `₹${insight.reference_price.toFixed(2)}` : "N/A"}
                  <span className="text-xs font-normal text-slate-500">/kg</span>
                </p>
              </div>
              {insight.target_price && (
                <div className="text-right">
                  <span className="text-xs text-slate-500">Suggested Target:</span>
                  <p className="text-base font-bold text-emerald-700">₹{insight.target_price.toFixed(2)}/kg</p>
                </div>
              )}
            </div>
          </div>

          {/* Demand Intelligence Box */}
          <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-1.5">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
              <span className="flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
                DEMAND INTELLIGENCE
              </span>
              <DemandTrendBadge trend={insight.demand_trend} />
            </div>
            <div className="flex items-baseline justify-between pt-1">
              <div>
                <span className="text-xs text-slate-500">Demand Score:</span>
                <p className="text-xl font-extrabold text-slate-900">
                  {insight.demand_score}
                  <span className="text-xs font-normal text-slate-500">/100</span>
                </p>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-500">Supply Status:</span>
                <p className="text-xs font-bold text-slate-800 capitalize mt-1">
                  {insight.supply_demand_status.toLowerCase().replace("_", " ")}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Combined Guidance Statement */}
        <div className="p-3 rounded-lg bg-emerald-100/60 border border-emerald-200 text-xs text-emerald-900 leading-relaxed flex items-start gap-2">
          <Lightbulb className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
          <div>
            <strong className="font-semibold text-emerald-950">Farmer Guidance: </strong>
            {insight.combined_insight}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
