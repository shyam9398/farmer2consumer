import React from "react";
import { RegionalPriceResponse } from "@/types/priceIntelligence";
import { MapPin, Building2, ShoppingBag, AlertCircle } from "lucide-react";

interface RegionalPriceComparisonProps {
  regionalData: RegionalPriceResponse;
  className?: string;
}

export const RegionalPriceComparison: React.FC<RegionalPriceComparisonProps> = ({
  regionalData,
  className = "",
}) => {
  if (!regionalData.has_sufficient_data) {
    return (
      <div className={`p-4 rounded-xl border border-amber-500/20 bg-amber-500/10 text-amber-900 dark:text-amber-200 flex items-start gap-3 ${className}`}>
        <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <div>
          <h4 className="font-semibold text-sm">Regional Comparison Unavailable</h4>
          <p className="text-xs text-amber-800 dark:text-amber-300/90 mt-0.5">
            {regionalData.overall_range_text}
          </p>
        </div>
      </div>
    );
  }

  const items = [
    {
      title: "Local District Reference",
      icon: <MapPin className="h-4 w-4 text-emerald-500" />,
      data: regionalData.district_reference,
    },
    {
      title: "State Wholesale Reference",
      icon: <Building2 className="h-4 w-4 text-blue-500" />,
      data: regionalData.state_reference,
    },
    {
      title: "Mandi Direct Transactions",
      icon: <ShoppingBag className="h-4 w-4 text-purple-500" />,
      data: regionalData.mandi_direct_reference,
    },
  ];

  return (
    <div className={`p-5 rounded-2xl border border-border bg-background shadow-2xs ${className}`}>
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-border">
        <div>
          <h4 className="font-bold text-sm text-foreground">Regional Price Benchmark</h4>
          <p className="text-xs text-muted-foreground">
            Price range for {regionalData.product_name}: {regionalData.overall_range_text}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {items.map((col, idx) => (
          <div key={idx} className="p-4 rounded-xl bg-muted/30 border border-border">
            <div className="flex items-center gap-2 mb-2">
              {col.icon}
              <span className="font-semibold text-xs text-foreground">{col.title}</span>
            </div>

            {col.data && col.data.observation_count > 0 ? (
              <div>
                <div className="flex items-baseline gap-1">
                  <span className="text-xl font-bold text-foreground">
                    ₹{col.data.avg_price_per_kg}
                  </span>
                  <span className="text-xs text-muted-foreground">/kg (avg)</span>
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Range: ₹{col.data.min_price_per_kg}–₹{col.data.max_price_per_kg}/kg
                </p>
                <span className="inline-block mt-2 px-2 py-0.5 rounded text-[10px] font-medium bg-background text-muted-foreground border border-border">
                  {col.data.status_message}
                </span>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground italic py-2">
                Regional comparison unavailable due to insufficient data.
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
