import React from "react";
import { PriceSourceType } from "@/types/priceIntelligence";
import { ShoppingBag, Landmark, Globe, FileSpreadsheet, Layers } from "lucide-react";

interface PriceDataSourceBadgeProps {
  sourceType: PriceSourceType | string;
  sourceName?: string;
  className?: string;
}

export const PriceDataSourceBadge: React.FC<PriceDataSourceBadgeProps> = ({
  sourceType,
  sourceName,
  className = "",
}) => {
  const renderContent = () => {
    switch (sourceType) {
      case "MANDI_DIRECT_TRANSACTION":
        return {
          icon: <ShoppingBag className="h-3.5 w-3.5 text-emerald-500" />,
          label: sourceName || "Mandi Direct Orders",
          bg: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
        };
      case "GOVERNMENT_DATA":
        return {
          icon: <Landmark className="h-3.5 w-3.5 text-blue-500" />,
          label: sourceName || "Government Portal",
          bg: "bg-blue-500/10 text-blue-600 border-blue-500/20",
        };
      case "EXTERNAL_API":
        return {
          icon: <Globe className="h-3.5 w-3.5 text-purple-500" />,
          label: sourceName || "External Mandi API",
          bg: "bg-purple-500/10 text-purple-600 border-purple-500/20",
        };
      case "ADMIN_IMPORT":
        return {
          icon: <FileSpreadsheet className="h-3.5 w-3.5 text-amber-500" />,
          label: sourceName || "Verified Admin Import",
          bg: "bg-amber-500/10 text-amber-600 border-amber-500/20",
        };
      default:
        return {
          icon: <Layers className="h-3.5 w-3.5 text-slate-500" />,
          label: sourceName || "Market Reference",
          bg: "bg-slate-500/10 text-slate-600 border-slate-500/20",
        };
    }
  };

  const item = renderContent();

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border ${item.bg} ${className}`}
    >
      {item.icon}
      {item.label}
    </span>
  );
};
