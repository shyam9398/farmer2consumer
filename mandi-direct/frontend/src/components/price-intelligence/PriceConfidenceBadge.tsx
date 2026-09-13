import React from "react";
import { ConfidenceLevel } from "@/types/priceIntelligence";
import { ShieldCheck, ShieldAlert, Shield } from "lucide-react";

interface PriceConfidenceBadgeProps {
  confidence: ConfidenceLevel;
  className?: string;
}

export const PriceConfidenceBadge: React.FC<PriceConfidenceBadgeProps> = ({
  confidence,
  className = "",
}) => {
  switch (confidence) {
    case "HIGH":
      return (
        <span
          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 ${className}`}
        >
          <ShieldCheck className="h-3.5 w-3.5" />
          High Confidence
        </span>
      );
    case "MEDIUM":
      return (
        <span
          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 ${className}`}
        >
          <Shield className="h-3.5 w-3.5" />
          Medium Confidence
        </span>
      );
    default:
      return (
        <span
          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20 ${className}`}
        >
          <ShieldAlert className="h-3.5 w-3.5" />
          Low Confidence
        </span>
      );
  }
};
