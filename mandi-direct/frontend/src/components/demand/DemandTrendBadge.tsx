import React from "react";
import { DemandTrend } from "@/lib/demandApi";
import { TrendingUp, TrendingDown, Minus, Activity, HelpCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface DemandTrendBadgeProps {
  trend: DemandTrend;
  growthPct?: number | null;
  className?: string;
}

export const DemandTrendBadge: React.FC<DemandTrendBadgeProps> = ({
  trend,
  growthPct,
  className = "",
}) => {
  const formatGrowth = growthPct !== undefined && growthPct !== null ? ` (${growthPct > 0 ? '+' : ''}${growthPct.toFixed(1)}%)` : '';

  switch (trend) {
    case "RISING":
      return (
        <Badge className={`bg-emerald-100 text-emerald-800 border-emerald-300 flex items-center gap-1 font-medium ${className}`}>
          <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
          <span>Rising{formatGrowth}</span>
        </Badge>
      );
    case "FALLING":
      return (
        <Badge className={`bg-rose-100 text-rose-800 border-rose-300 flex items-center gap-1 font-medium ${className}`}>
          <TrendingDown className="w-3.5 h-3.5 text-rose-600" />
          <span>Falling{formatGrowth}</span>
        </Badge>
      );
    case "STABLE":
      return (
        <Badge className={`bg-blue-100 text-blue-800 border-blue-300 flex items-center gap-1 font-medium ${className}`}>
          <Minus className="w-3.5 h-3.5 text-blue-600" />
          <span>Stable</span>
        </Badge>
      );
    case "VOLATILE":
      return (
        <Badge className={`bg-amber-100 text-amber-800 border-amber-300 flex items-center gap-1 font-medium ${className}`}>
          <Activity className="w-3.5 h-3.5 text-amber-600" />
          <span>Volatile</span>
        </Badge>
      );
    case "INSUFFICIENT_DATA":
    default:
      return (
        <Badge variant="outline" className={`border-slate-300 text-slate-500 flex items-center gap-1 ${className}`}>
          <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
          <span>Insufficient Data</span>
        </Badge>
      );
  }
};
