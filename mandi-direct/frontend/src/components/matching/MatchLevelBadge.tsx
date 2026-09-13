import React from "react";
import { MatchLevel } from "@/types/matching";
import { cn } from "@/lib/utils";

interface MatchLevelBadgeProps {
  level: MatchLevel;
  className?: string;
}

export const MatchLevelBadge: React.FC<MatchLevelBadgeProps> = ({ level, className }) => {
  const configMap: Record<MatchLevel, { label: string; className: string }> = {
    VERY_HIGH: {
      label: "Very High Match",
      className: "bg-emerald-500/15 text-emerald-300 border-emerald-500/40",
    },
    HIGH: {
      label: "High Match",
      className: "bg-teal-500/15 text-teal-300 border-teal-500/40",
    },
    MODERATE: {
      label: "Moderate Match",
      className: "bg-amber-500/15 text-amber-300 border-amber-500/40",
    },
    LOW: {
      label: "Low Match",
      className: "bg-orange-500/15 text-orange-300 border-orange-500/40",
    },
    VERY_LOW: {
      label: "Very Low Match",
      className: "bg-slate-500/15 text-slate-300 border-slate-500/40",
    },
    INSUFFICIENT_DATA: {
      label: "Insufficient Data",
      className: "bg-zinc-500/15 text-zinc-300 border-zinc-500/40",
    },
  };

  const current = configMap[level] || configMap.VERY_LOW;

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider font-mono",
        current.className,
        className
      )}
    >
      {current.label}
    </span>
  );
};
