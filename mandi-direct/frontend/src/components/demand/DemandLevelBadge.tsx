import React from "react";
import { DemandLevel } from "@/lib/demandApi";
import { Badge } from "@/components/ui/badge";

interface DemandLevelBadgeProps {
  level: DemandLevel;
  className?: string;
}

export const DemandLevelBadge: React.FC<DemandLevelBadgeProps> = ({ level, className = "" }) => {
  switch (level) {
    case "VERY_HIGH":
      return (
        <Badge className={`bg-emerald-600 hover:bg-emerald-700 text-white font-medium ${className}`}>
          Very High Demand
        </Badge>
      );
    case "HIGH":
      return (
        <Badge className={`bg-emerald-500 hover:bg-emerald-600 text-white font-medium ${className}`}>
          High Demand
        </Badge>
      );
    case "MODERATE":
      return (
        <Badge className={`bg-amber-500 hover:bg-amber-600 text-white font-medium ${className}`}>
          Moderate Demand
        </Badge>
      );
    case "LOW":
      return (
        <Badge className={`bg-slate-500 hover:bg-slate-600 text-white font-medium ${className}`}>
          Low Demand
        </Badge>
      );
    case "VERY_LOW":
      return (
        <Badge className={`bg-rose-500 hover:bg-rose-600 text-white font-medium ${className}`}>
          Very Low Demand
        </Badge>
      );
    case "INSUFFICIENT_DATA":
    default:
      return (
        <Badge variant="outline" className={`border-slate-300 text-slate-500 ${className}`}>
          Insufficient Data
        </Badge>
      );
  }
};
