import React from "react";
import { cn } from "@/lib/utils";

interface MatchScoreBadgeProps {
  score: number;
  size?: "sm" | "md" | "lg";
  className?: string;
  showLabel?: boolean;
}

export const MatchScoreBadge: React.FC<MatchScoreBadgeProps> = ({
  score,
  size = "md",
  className,
  showLabel = true,
}) => {
  const rounded = Math.round(score);

  const getColorClass = (val: number) => {
    if (val >= 80) return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
    if (val >= 60) return "bg-teal-500/15 text-teal-400 border-teal-500/30";
    if (val >= 40) return "bg-amber-500/15 text-amber-400 border-amber-500/30";
    if (val >= 20) return "bg-orange-500/15 text-orange-400 border-orange-500/30";
    return "bg-slate-500/15 text-slate-400 border-slate-500/30";
  };

  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs font-semibold",
    md: "px-2.5 py-1 text-xs font-bold",
    lg: "px-3.5 py-1.5 text-sm font-extrabold",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border shadow-sm transition-all",
        getColorClass(rounded),
        sizeClasses[size],
        className
      )}
    >
      <span className="font-mono">{rounded}%</span>
      {showLabel && <span className="opacity-90">Match</span>}
    </div>
  );
};
