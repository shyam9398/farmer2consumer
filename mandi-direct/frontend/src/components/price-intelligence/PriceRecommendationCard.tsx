import React from "react";
import { PriceRecommendationResponse } from "@/types/priceIntelligence";
import { PriceTrendBadge } from "./PriceTrendBadge";
import { PriceConfidenceBadge } from "./PriceConfidenceBadge";
import { PriceDataSourceBadge } from "./PriceDataSourceBadge";
import { PriceComparisonCard } from "./PriceComparisonCard";
import { Sparkles, Info, ArrowRight } from "lucide-react";

interface PriceRecommendationCardProps {
  recommendation: PriceRecommendationResponse;
  onUseSuggestedPrice?: (price: number) => void;
  className?: string;
}

export const PriceRecommendationCard: React.FC<PriceRecommendationCardProps> = ({
  recommendation,
  onUseSuggestedPrice,
  className = "",
}) => {
  const unitLabel = recommendation.display_unit.replace("PER_", "").toLowerCase();

  return (
    <div
      className={`rounded-2xl border border-emerald-500/20 bg-gradient-to-b from-emerald-500/5 via-background to-background p-6 shadow-sm ${className}`}
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-emerald-500/10">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-foreground">
              Market Price Intelligence — {recommendation.product_name}
            </h3>
            <p className="text-xs text-muted-foreground">
              {recommendation.variety ? `${recommendation.variety} • ` : ""}
              {recommendation.quality_grade ? `${recommendation.quality_grade} • ` : ""}
              {recommendation.observation_count} observations analyzed
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <PriceTrendBadge trend={recommendation.trend} />
          <PriceConfidenceBadge confidence={recommendation.confidence} />
        </div>
      </div>

      {/* Main Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-6">
        {/* Reference Price */}
        <div className="p-4 rounded-xl bg-background border border-border shadow-2xs">
          <p className="text-xs font-medium text-muted-foreground">Market Reference</p>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-extrabold text-foreground">
              ₹{recommendation.display_reference_price}
            </span>
            <span className="text-xs text-muted-foreground">/{unitLabel}</span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">Time-decay weighted average</p>
        </div>

        {/* Estimated Fair Range */}
        <div className="p-4 rounded-xl bg-background border border-border shadow-2xs">
          <p className="text-xs font-medium text-muted-foreground">Estimated Fair Range</p>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
              ₹{recommendation.display_min_price} – ₹{recommendation.display_max_price}
            </span>
            <span className="text-xs text-muted-foreground">/{unitLabel}</span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">Observed market variance</p>
        </div>

        {/* Suggested Target */}
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 shadow-2xs relative">
          <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">Suggested Target</p>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-extrabold text-emerald-700 dark:text-emerald-300">
              ₹{recommendation.display_target_price}
            </span>
            <span className="text-xs text-emerald-800 dark:text-emerald-400">/{unitLabel}</span>
          </div>
          {onUseSuggestedPrice && (
            <button
              type="button"
              onClick={() => onUseSuggestedPrice(recommendation.display_target_price)}
              className="mt-2 w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors shadow-xs"
            >
              Use Suggested Price
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Expected Price Comparison Alert */}
      {recommendation.expected_price_comparison && (
        <div className="mb-5">
          <PriceComparisonCard
            comparisonState={recommendation.expected_price_comparison}
            message={recommendation.comparison_message}
            suggestedTargetPrice={recommendation.display_target_price}
            priceUnit={recommendation.display_unit}
            onUseSuggestedPrice={
              onUseSuggestedPrice
                ? () => onUseSuggestedPrice(recommendation.display_target_price)
                : undefined
            }
          />
        </div>
      )}

      {/* Explanation & Sources */}
      <div className="space-y-3 p-4 rounded-xl bg-muted/40 border border-border/50">
        <div>
          <h4 className="text-xs font-bold text-foreground uppercase tracking-wider mb-1">
            Calculation Methodology & Explanation
          </h4>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {recommendation.explanation}
          </p>
        </div>

        {recommendation.data_sources && recommendation.data_sources.length > 0 && (
          <div>
            <span className="text-[11px] font-semibold text-muted-foreground mr-2">Verified Sources:</span>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {recommendation.data_sources.map((src, idx) => (
                <PriceDataSourceBadge key={idx} sourceType="EXTERNAL_API" sourceName={src} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Explicit Disclaimer */}
      <div className="mt-4 flex items-center gap-2 text-[11px] text-muted-foreground italic">
        <Info className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        <span>{recommendation.disclaimer}</span>
      </div>
    </div>
  );
};
