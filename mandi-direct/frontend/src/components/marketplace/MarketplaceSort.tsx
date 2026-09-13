import React from "react";
import { ArrowUpDown } from "lucide-react";

interface MarketplaceSortProps {
  value?: string;
  onChange: (sortKey: string) => void;
}

const SORT_OPTIONS = [
  { label: "Recommended", value: "recommended" },
  { label: "Price: Low to High", value: "price_asc" },
  { label: "Price: High to Low", value: "price_desc" },
  { label: "Newest First", value: "newest" },
  { label: "Harvest Date", value: "harvest_date" },
  { label: "Quantity: High to Low", value: "quantity_desc" },
];

export const MarketplaceSort: React.FC<MarketplaceSortProps> = ({ value = "recommended", onChange }) => {
  return (
    <div className="flex items-center gap-2 text-xs">
      <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
      <span className="text-slate-400 font-medium whitespace-nowrap">Sort by:</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 rounded-lg bg-secondary/30 border border-border/60 text-slate-200 px-3 text-xs focus:outline-none focus:border-emerald-500 font-medium cursor-pointer"
      >
        {SORT_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-slate-900 text-slate-200">
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
};
