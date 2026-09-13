import React from "react";
import { ProductDemand } from "@/lib/demandApi";
import { DemandLevelBadge } from "./DemandLevelBadge";
import { DemandTrendBadge } from "./DemandTrendBadge";

interface ProductDemandRankingProps {
  products: ProductDemand[];
  onSelectProduct?: (productName: string) => void;
  className?: string;
}

export const ProductDemandRanking: React.FC<ProductDemandRankingProps> = ({
  products,
  onSelectProduct,
  className = "",
}) => {
  if (!products || products.length === 0) {
    return (
      <div className="p-8 text-center text-slate-500 bg-slate-50 rounded-xl border border-slate-200 text-sm">
        No product demand rankings available for this period.
      </div>
    );
  }

  return (
    <div className={`overflow-hidden rounded-xl border border-slate-200 shadow-2xs bg-white ${className}`}>
      <table className="w-full text-left text-sm border-collapse">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <th className="py-3 px-4 w-12 text-center">#</th>
            <th className="py-3 px-4">Product</th>
            <th className="py-3 px-4 text-center">Score</th>
            <th className="py-3 px-4 text-center">Demand Level</th>
            <th className="py-3 px-4 text-center">Trend</th>
            <th className="py-3 px-4 text-right">Qty Sold</th>
            <th className="py-3 px-4 text-right">Orders</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {products.map((p, idx) => (
            <tr
              key={p.product_name}
              onClick={() => onSelectProduct?.(p.product_name)}
              className={`hover:bg-slate-50/80 transition-colors ${
                onSelectProduct ? "cursor-pointer" : ""
              }`}
            >
              <td className="py-3 px-4 text-center font-bold text-slate-400">
                {idx + 1}
              </td>
              <td className="py-3 px-4 font-semibold text-slate-800">
                {p.product_name}
                <span className="text-[11px] font-normal text-slate-400 block">{p.category}</span>
              </td>
              <td className="py-3 px-4 text-center font-extrabold text-emerald-800">
                {p.demand_score}/100
              </td>
              <td className="py-3 px-4 text-center">
                <DemandLevelBadge level={p.demand_level} />
              </td>
              <td className="py-3 px-4 text-center">
                <DemandTrendBadge trend={p.trend} growthPct={p.demand_growth_percentage} />
              </td>
              <td className="py-3 px-4 text-right font-medium text-slate-700">
                {p.recent_quantity_sold} {p.quantity_unit}
              </td>
              <td className="py-3 px-4 text-right font-medium text-slate-700">
                {p.order_count}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
