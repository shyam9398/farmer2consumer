import React from "react";
import { PriceTrend } from "@/types/priceIntelligence";
import { TrendingUp, TrendingDown, Minus, Activity, HelpCircle } from "lucide-react";

interface PriceTrendBadgeProps {
  trend: PriceTrend;
  showLabel?: boolean;
  className?: string;
}

export const PriceTrendBadge: React.FC<PriceTrendBadgeProps> = ({
  trend,
  showLabel = true,
  className = "",
}) => {
  switch (trend) {
    case "RISING":
      return (
        <span
          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 ${className}`}
        >
          <TrendingUp className="h-3.5 w-3.5" />
          {showLabel && "Rising"}
        </span>
      );
    case "FALLING":
      return (
        <span
          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 ${className}`}
        >
          <TrendingDown className="h-3.5 w-3.5" />
          {showLabel && "Falling"}
        </span>
      );
    case "STABLE":
      return (
        <span
          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 ${className}`}
        >
          <Minus className="h-3.5 w-3.5" />
          {showLabel && "Stable"}
        </span>
      );
    case "VOLATILE":
      return (
        <span
          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 ${className}`}
        >
          <Activity className="h-3.5 w-3.5" />
          {showLabel && "Volatile"}
        </span>
      );
    default:
      return (
        <span
          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20 ${className}`}
        >
          <HelpCircle className="h-3.5 w-3.5" />
          {showLabel && "Insufficient Data"}
        </span>
      );
  }
};
