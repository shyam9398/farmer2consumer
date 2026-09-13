import React from "react";
import { ExpectedPriceComparisonState } from "@/types/priceIntelligence";
import { AlertCircle, CheckCircle2, TrendingUp, Info } from "lucide-react";

interface PriceComparisonCardProps {
  comparisonState: ExpectedPriceComparisonState;
  message: string;
  expectedPrice?: number;
  priceUnit?: string;
  onUseSuggestedPrice?: () => void;
  suggestedTargetPrice?: number;
}

export const PriceComparisonCard: React.FC<PriceComparisonCardProps> = ({
  comparisonState,
  message,
  priceUnit = "PER_KG",
  onUseSuggestedPrice,
  suggestedTargetPrice,
}) => {
  if (comparisonState === "NOT_SPECIFIED") {
    return (
      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex items-start gap-3">
        <Info className="h-5 w-5 text-slate-500 shrink-0 mt-0.5" />
        <div className="text-sm text-slate-600 dark:text-slate-400">
          Enter an expected price above to compare against recent market observations.
        </div>
      </div>
    );
  }

  const unitLabel = priceUnit.replace("PER_", "").toLowerCase();

  switch (comparisonState) {
    case "BELOW":
      return (
        <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/10 text-amber-900 dark:text-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5 sm:mt-0" />
            <div>
              <p className="font-semibold text-sm">Expected Price Below Observed Range</p>
              <p className="text-xs text-amber-800 dark:text-amber-300/90 mt-0.5">{message}</p>
            </div>
          </div>
          {onUseSuggestedPrice && suggestedTargetPrice !== undefined && (
            <button
              type="button"
              onClick={onUseSuggestedPrice}
              className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white transition-colors shadow-sm"
            >
              Use Suggested (₹{suggestedTargetPrice}/{unitLabel})
            </button>
          )}
        </div>
      );

    case "ABOVE":
      return (
        <div className="p-4 rounded-xl border border-blue-500/20 bg-blue-500/10 text-blue-900 dark:text-blue-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5 sm:mt-0" />
            <div>
              <p className="font-semibold text-sm">Expected Price Above Observed Range</p>
              <p className="text-xs text-blue-800 dark:text-blue-300/90 mt-0.5">{message}</p>
            </div>
          </div>
          {onUseSuggestedPrice && suggestedTargetPrice !== undefined && (
            <button
              type="button"
              onClick={onUseSuggestedPrice}
              className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-sm"
            >
              Use Suggested (₹{suggestedTargetPrice}/{unitLabel})
            </button>
          )}
        </div>
      );

    case "WITHIN":
      return (
        <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-900 dark:text-emerald-200 flex items-start gap-3">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-sm">Expected Price Within Fair Range</p>
            <p className="text-xs text-emerald-800 dark:text-emerald-300/90 mt-0.5">{message}</p>
          </div>
        </div>
      );
  }
};
