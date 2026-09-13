import React from "react";
import { RegionalDemandItem } from "@/lib/demandApi";
import { DemandLevelBadge } from "./DemandLevelBadge";
import { MapPin, ShoppingBag, Users } from "lucide-react";

interface RegionalDemandCardProps {
  regions: RegionalDemandItem[];
  className?: string;
}

export const RegionalDemandCard: React.FC<RegionalDemandCardProps> = ({ regions, className = "" }) => {
  if (!regions || regions.length === 0) {
    return (
      <div className={`p-6 text-center text-slate-500 bg-slate-50 rounded-xl border border-slate-200 text-sm ${className}`}>
        No regional demand activity recorded yet for the selected period.
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {regions.map((reg, idx) => (
        <div
          key={`${reg.state}-${reg.district || idx}`}
          className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs hover:border-slate-300 transition-all flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-slate-100 text-slate-600">
              <MapPin className="w-4 h-4 text-emerald-600" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-800">
                {reg.district ? `${reg.district}, ${reg.state}` : reg.state}
              </h4>
              <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                <span className="flex items-center gap-1">
                  <ShoppingBag className="w-3 h-3 text-blue-500" />
                  {reg.order_count} orders
                </span>
                <span className="flex items-center gap-1">
                  <Users className="w-3 h-3 text-purple-500" />
                  {reg.unique_buyers} buyers
                </span>
                <span>{reg.quantity_sold} KG sold</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Score</span>
              <span className="text-sm font-extrabold text-slate-800">{reg.demand_score}/100</span>
            </div>
            <DemandLevelBadge level={reg.demand_level} />
          </div>
        </div>
      ))}
    </div>
  );
};
