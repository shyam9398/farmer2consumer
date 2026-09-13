import React from "react";
import { Link } from "react-router-dom";
import { usePriceIntelligenceSummary } from "@/hooks/usePriceIntelligence";
import { PriceTrendBadge } from "./PriceTrendBadge";
import { Sparkles, ArrowRight, HelpCircle } from "lucide-react";

interface PriceIntelligenceCardProps {
  productName?: string;
  variety?: string;
  qualityGrade?: string;
  className?: string;
}

export const PriceIntelligenceCard: React.FC<PriceIntelligenceCardProps> = ({
  productName = "Tomato",
  variety,
  qualityGrade,
  className = "",
}) => {
  const { data, isLoading } = usePriceIntelligenceSummary(productName, variety, qualityGrade);

  if (isLoading) {
    return (
      <div className={`p-5 rounded-2xl border border-border bg-card animate-pulse ${className}`}>
        <div className="h-5 w-40 bg-muted rounded mb-3" />
        <div className="h-8 w-24 bg-muted rounded mb-2" />
        <div className="h-4 w-32 bg-muted rounded" />
      </div>
    );
  }

  if (!data || data.observation_count === 0) {
    return (
      <div className={`p-5 rounded-2xl border border-border bg-card shadow-2xs ${className}`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-emerald-500" />
            <span className="font-bold text-sm text-foreground">PRICE INTELLIGENCE</span>
          </div>
          <span className="text-xs text-muted-foreground">{productName}</span>
        </div>
        <div className="py-2 flex items-center gap-2 text-xs text-muted-foreground">
          <HelpCircle className="h-4 w-4 text-amber-500 shrink-0" />
          <span>Not enough market data available yet.</span>
        </div>
        <Link
          to="/farmer/price-intelligence"
          className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
        >
          View Price Intelligence
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    );
  }

  return (
    <div className={`p-5 rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 via-card to-card shadow-2xs ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-emerald-500" />
          <span className="font-bold text-xs uppercase tracking-wider text-muted-foreground">PRICE INTELLIGENCE</span>
        </div>
        <PriceTrendBadge trend={data.trend} />
      </div>

      <h4 className="font-extrabold text-base text-foreground mb-3">{data.product_name}</h4>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="p-2.5 rounded-xl bg-background/80 border border-border">
          <span className="text-[11px] font-medium text-muted-foreground block">Market Reference</span>
          <span className="text-lg font-bold text-foreground">
            ₹{data.avg_price ? data.avg_price : "N/A"}/kg
          </span>
        </div>

        <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
          <span className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-300 block">Suggested Target</span>
          <span className="text-lg font-bold text-emerald-700 dark:text-emerald-300">
            ₹{data.weighted_avg_price ? data.weighted_avg_price : data.avg_price || "N/A"}/kg
          </span>
        </div>
      </div>

      <Link
        to="/farmer/price-intelligence"
        className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors shadow-xs"
      >
        View Price Intelligence
        <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
};
