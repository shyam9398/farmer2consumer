import React from "react";
import { ProductDemand } from "@/lib/demandApi";
import { DemandLevelBadge } from "./DemandLevelBadge";
import { DemandTrendBadge } from "./DemandTrendBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldCheck, ShoppingBag, Users, Zap, Box } from "lucide-react";

interface DemandScoreCardProps {
  demand: ProductDemand;
  className?: string;
}

export const DemandScoreCard: React.FC<DemandScoreCardProps> = ({ demand, className = "" }) => {
  return (
    <Card className={`border border-slate-200 shadow-sm bg-gradient-to-br from-white to-slate-50/50 ${className}`}>
      <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-xl font-bold text-slate-800 flex items-center gap-2">
            {demand.product_name}
            <span className="text-xs font-normal px-2 py-0.5 rounded bg-slate-100 text-slate-600">
              {demand.category}
            </span>
          </CardTitle>
          <p className="text-xs text-slate-500 mt-0.5">{demand.matching_scope}</p>
        </div>
        <div className="flex items-center gap-2">
          <DemandLevelBadge level={demand.demand_level} />
          <DemandTrendBadge trend={demand.trend} growthPct={demand.demand_growth_percentage} />
        </div>
      </CardHeader>

      <CardContent className="pt-4 space-y-4">
        {/* Main Score Display */}
        <div className="flex items-center justify-between p-4 rounded-xl bg-emerald-50/50 border border-emerald-100">
          <div>
            <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">Demand Score</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-4xl font-extrabold text-emerald-900">{demand.demand_score}</span>
              <span className="text-sm font-medium text-emerald-700">/ 100</span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs font-medium text-slate-500">Confidence</span>
            <div className="flex items-center gap-1 text-xs font-semibold text-slate-700 mt-1 justify-end">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              {demand.confidence}
            </div>
          </div>
        </div>

        {/* Primary Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <div className="p-3 bg-white rounded-lg border border-slate-100 shadow-2xs">
            <div className="flex items-center justify-center gap-1.5 text-slate-500 mb-1">
              <ShoppingBag className="w-3.5 h-3.5 text-blue-500" />
              <span className="text-xs font-medium">Orders</span>
            </div>
            <span className="text-lg font-bold text-slate-800">{demand.order_count}</span>
          </div>

          <div className="p-3 bg-white rounded-lg border border-slate-100 shadow-2xs">
            <div className="flex items-center justify-center gap-1.5 text-slate-500 mb-1">
              <Users className="w-3.5 h-3.5 text-purple-500" />
              <span className="text-xs font-medium">Unique Buyers</span>
            </div>
            <span className="text-lg font-bold text-slate-800">{demand.unique_buyers}</span>
          </div>

          <div className="p-3 bg-white rounded-lg border border-slate-100 shadow-2xs">
            <div className="flex items-center justify-center gap-1.5 text-slate-500 mb-1">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-xs font-medium">Sales Velocity</span>
            </div>
            <span className="text-lg font-bold text-slate-800">
              {demand.sales_velocity_per_day} <span className="text-xs font-normal text-slate-500">{demand.quantity_unit}/day</span>
            </span>
          </div>

          <div className="p-3 bg-white rounded-lg border border-slate-100 shadow-2xs">
            <div className="flex items-center justify-center gap-1.5 text-slate-500 mb-1">
              <Box className="w-3.5 h-3.5 text-emerald-500" />
              <span className="text-xs font-medium">Available Supply</span>
            </div>
            <span className="text-lg font-bold text-slate-800">
              {demand.available_supply} <span className="text-xs font-normal text-slate-500">{demand.quantity_unit}</span>
            </span>
          </div>
        </div>

        {/* Explanation Banner */}
        <div className="p-3 rounded-lg bg-slate-100/80 border border-slate-200 text-xs text-slate-700 leading-relaxed">
          <strong className="font-semibold text-slate-900">Insight: </strong>
          {demand.explanation}
        </div>
      </CardContent>
    </Card>
  );
};
