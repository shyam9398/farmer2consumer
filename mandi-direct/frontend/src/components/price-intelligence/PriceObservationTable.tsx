import React from "react";
import { PriceObservation } from "@/types/priceIntelligence";
import { PriceDataSourceBadge } from "./PriceDataSourceBadge";
import { Edit2, Trash2, Calendar, MapPin } from "lucide-react";

interface PriceObservationTableProps {
  observations: PriceObservation[];
  onEdit: (obs: PriceObservation) => void;
  onDelete: (id: string) => void;
  isDeleting?: boolean;
}

export const PriceObservationTable: React.FC<PriceObservationTableProps> = ({
  observations,
  onEdit,
  onDelete,
  isDeleting = false,
}) => {
  if (observations.length === 0) {
    return (
      <div className="p-8 text-center border border-dashed rounded-xl border-border bg-muted/20">
        <p className="font-semibold text-sm text-foreground">No Price Observations Found</p>
        <p className="text-xs text-muted-foreground mt-1">
          No records match the active filter criteria. Try clearing search filters or add a new observation.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-background shadow-2xs">
      <table className="w-full text-left text-xs">
        <thead className="bg-muted/50 border-b border-border text-muted-foreground uppercase tracking-wider text-[11px] font-semibold">
          <tr>
            <th className="py-3 px-4">Product & Category</th>
            <th className="py-3 px-4">Observed Price</th>
            <th className="py-3 px-4">Normalized (INR/KG)</th>
            <th className="py-3 px-4">Location / Mandi</th>
            <th className="py-3 px-4">Source Type</th>
            <th className="py-3 px-4">Date</th>
            <th className="py-3 px-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {observations.map((obs) => (
            <tr key={obs.id} className="hover:bg-muted/30 transition-colors">
              <td className="py-3 px-4 font-medium text-foreground">
                <div className="font-semibold text-sm text-foreground">{obs.product_name}</div>
                <div className="text-[11px] text-muted-foreground">
                  {obs.category}
                  {obs.variety ? ` • ${obs.variety}` : ""}
                  {obs.quality_grade ? ` • ${obs.quality_grade}` : ""}
                </div>
              </td>
              <td className="py-3 px-4 font-bold text-foreground">
                ₹{obs.price} <span className="text-[11px] text-muted-foreground font-normal">/{obs.price_unit.replace("PER_", "").toLowerCase()}</span>
              </td>
              <td className="py-3 px-4 font-semibold text-emerald-600 dark:text-emerald-400">
                ₹{obs.price_per_kg}/kg
              </td>
              <td className="py-3 px-4 text-muted-foreground">
                <div className="flex items-center gap-1 text-xs text-foreground">
                  <MapPin className="h-3 w-3 text-muted-foreground" />
                  {obs.market_name || "General Mandi"}
                </div>
                <div className="text-[11px]">
                  {obs.district ? `${obs.district}, ` : ""}
                  {obs.state || ""}
                </div>
              </td>
              <td className="py-3 px-4">
                <PriceDataSourceBadge sourceType={obs.source_type} sourceName={obs.source_name} />
              </td>
              <td className="py-3 px-4 text-muted-foreground whitespace-nowrap">
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3 text-muted-foreground" />
                  {obs.observation_date}
                </div>
              </td>
              <td className="py-3 px-4 text-right whitespace-nowrap">
                <button
                  type="button"
                  onClick={() => onEdit(obs)}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors mr-1"
                  title="Edit Observation"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(obs.id)}
                  disabled={isDeleting}
                  className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-500/10 transition-colors"
                  title="Delete Observation"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
