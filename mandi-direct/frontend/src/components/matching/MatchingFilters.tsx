import React from "react";
import { Search, SlidersHorizontal, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MatchingFilters as FilterValues } from "@/types/matching";

interface MatchingFiltersProps {
  filters: FilterValues;
  onFilterChange: (newFilters: Partial<FilterValues>) => void;
  onReset: () => void;
  mode?: "buyer" | "farmer";
  farmerProduceList?: { id: string; name: string }[];
}

export const MatchingFilters: React.FC<MatchingFiltersProps> = ({
  filters,
  onFilterChange,
  onReset,
  mode = "buyer",
  farmerProduceList,
}) => {
  return (
    <div className="bg-card/70 border border-border/70 rounded-xl p-4 sm:p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b border-border/40 pb-3">
        <div className="flex items-center gap-2 text-white font-semibold text-sm">
          <SlidersHorizontal className="w-4 h-4 text-emerald-400" />
          <span>Match Filters & Sorting</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="text-xs h-7 gap-1 text-slate-400 hover:text-white"
          onClick={onReset}
        >
          <RotateCcw className="w-3 h-3" />
          <span>Reset</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {/* If farmer mode, show produce lot selector */}
        {mode === "farmer" && farmerProduceList && (
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Farmer Produce Lot
            </label>
            <select
              value={filters.produce_id || "ALL"}
              onChange={(e) =>
                onFilterChange({ produce_id: e.target.value === "ALL" ? undefined : e.target.value, page: 1 })
              }
              className="w-full h-9 rounded-md bg-secondary/40 border border-border/80 px-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="ALL">All Eligible Produce</option>
              {farmerProduceList.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* If buyer mode, show category selector */}
        {mode === "buyer" && (
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Category
            </label>
            <select
              value={filters.category || "ALL"}
              onChange={(e) =>
                onFilterChange({ category: e.target.value === "ALL" ? undefined : e.target.value, page: 1 })
              }
              className="w-full h-9 rounded-md bg-secondary/40 border border-border/80 px-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="ALL">All Categories</option>
              <option value="VEGETABLE">Vegetable</option>
              <option value="FRUIT">Fruit</option>
              <option value="GRAIN">Grain</option>
              <option value="PULSE">Pulse</option>
              <option value="SPICE">Spice</option>
              <option value="OILSEED">Oilseed</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
        )}

        {/* Product Keyword / Search */}
        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Product Name
          </label>
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-3" />
            <input
              type="text"
              placeholder="e.g. Tomato, Onion..."
              value={filters.product_name || ""}
              onChange={(e) => onFilterChange({ product_name: e.target.value || undefined, page: 1 })}
              className="w-full h-9 rounded-md bg-secondary/40 border border-border/80 pl-8 pr-3 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* District Filter */}
        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            District
          </label>
          <input
            type="text"
            placeholder="e.g. Krishna, Kolar..."
            value={filters.district || ""}
            onChange={(e) => onFilterChange({ district: e.target.value || undefined, page: 1 })}
            className="w-full h-9 rounded-md bg-secondary/40 border border-border/80 px-3 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        {/* State Filter */}
        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            State
          </label>
          <input
            type="text"
            placeholder="e.g. Andhra Pradesh..."
            value={filters.state || ""}
            onChange={(e) => onFilterChange({ state: e.target.value || undefined, page: 1 })}
            className="w-full h-9 rounded-md bg-secondary/40 border border-border/80 px-3 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        {/* Match Level */}
        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Match Level
          </label>
          <select
            value={filters.match_level || "ALL"}
            onChange={(e) =>
              onFilterChange({ match_level: e.target.value === "ALL" ? undefined : e.target.value, page: 1 })
            }
            className="w-full h-9 rounded-md bg-secondary/40 border border-border/80 px-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="ALL">All Match Levels</option>
            <option value="VERY_HIGH">Very High (80%+)</option>
            <option value="HIGH">High (60%–79%)</option>
            <option value="MODERATE">Moderate (40%–59%)</option>
            <option value="LOW">Low (20%–39%)</option>
            <option value="VERY_LOW">Very Low (0%–19%)</option>
          </select>
        </div>

        {/* Minimum Match Score */}
        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Min Score: {filters.min_score ? `${filters.min_score}%` : "Any"}
          </label>
          <input
            type="range"
            min="0"
            max="90"
            step="10"
            value={filters.min_score || 0}
            onChange={(e) => {
              const val = Number(e.target.value);
              onFilterChange({ min_score: val > 0 ? val : undefined, page: 1 });
            }}
            className="w-full accent-emerald-500 h-2 bg-secondary rounded cursor-pointer mt-2"
          />
        </div>

        {/* Sort Order */}
        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Sort Results By
          </label>
          <select
            value={filters.sort || "highest_match"}
            onChange={(e) => onFilterChange({ sort: e.target.value, page: 1 })}
            className="w-full h-9 rounded-md bg-secondary/40 border border-border/80 px-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="highest_match">Highest Match Score</option>
            {mode === "buyer" && <option value="newest">Newest Listed</option>}
            {mode === "buyer" && <option value="price_asc">Price: Low to High</option>}
            {mode === "buyer" && <option value="price_desc">Price: High to Low</option>}
            {mode === "buyer" && <option value="quantity_desc">Highest Quantity</option>}
            {mode === "farmer" && <option value="product">Product Name</option>}
            {mode === "farmer" && <option value="location">Buyer Location</option>}
          </select>
        </div>
      </div>
    </div>
  );
};
