import React, { useState, useEffect } from "react";
import { Filter, RotateCcw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MarketplaceFilters as FilterParams } from "@/types/marketplace";
import { useLanguage } from "@/context/LanguageContext";
import { VoiceSearchInput } from "@/components/common/VoiceSearchInput";

interface MarketplaceFiltersProps {
  filters: FilterParams;
  onFilterChange: (updated: FilterParams) => void;
  onReset: () => void;
  totalResults: number;
}

export const MarketplaceFilters: React.FC<MarketplaceFiltersProps> = ({
  filters,
  onFilterChange,
  onReset,
  totalResults,
}) => {
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState(filters.search || "");
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const categories = [
    { label: t.marketplace.allCategories, value: "ALL" },
    { label: t.marketplace.categoryVegetables, value: "VEGETABLE" },
    { label: t.marketplace.categoryFruits, value: "FRUIT" },
    { label: t.marketplace.categoryGrains, value: "GRAIN" },
    { label: t.marketplace.categoryPulses, value: "PULSE" },
    { label: t.marketplace.categorySpices, value: "SPICE" },
    { label: t.marketplace.categoryOilseeds, value: "OILSEED" },
    { label: t.marketplace.categoryOther, value: "OTHER" },
  ];

  // Debounced search trigger (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm !== (filters.search || "")) {
        onFilterChange({ ...filters, search: searchTerm || undefined, page: 1 });
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const activeCategory = filters.category || "ALL";

  const handleCategorySelect = (cat: string) => {
    onFilterChange({
      ...filters,
      category: cat === "ALL" ? undefined : cat,
      page: 1,
    });
  };

  const handlePriceChange = (field: "min_price" | "max_price", val: string) => {
    const num = val ? parseFloat(val) : undefined;
    onFilterChange({
      ...filters,
      [field]: num && !isNaN(num) ? num : undefined,
      page: 1,
    });
  };

  const handleLocationChange = (field: "district" | "state", val: string) => {
    onFilterChange({
      ...filters,
      [field]: val.trim() ? val.trim() : undefined,
      page: 1,
    });
  };

  const hasActiveFilters = Boolean(
    filters.search ||
      filters.category ||
      filters.district ||
      filters.state ||
      filters.min_price ||
      filters.max_price
  );

  return (
    <div className="space-y-4">
      {/* Primary Search & Mobile Filter Toggle with Voice Search */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
        <div className="flex-1">
          <VoiceSearchInput
            value={searchTerm}
            onChange={(val) => setSearchTerm(val)}
            placeholder={t.marketplace.searchPlaceholder}
          />
        </div>

        {/* Mobile Filter Toggle */}
        <Button
          variant="outline"
          onClick={() => setIsMobileOpen(true)}
          className="lg:hidden h-11 gap-2 border-border/60 font-medium shrink-0"
        >
          <Filter className="h-4 w-4 text-emerald-400" />
          <span>{t.marketplace.filters}</span>
          {hasActiveFilters && (
            <Badge variant="success" className="ml-1 text-[10px] px-1.5 py-0">
              {t.marketplace.activeFilters}
            </Badge>
          )}
        </Button>
      </div>

      {/* Category Pills (Horizontal Scroller) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {categories.map((cat) => {
          const isSelected = activeCategory === cat.value;
          return (
            <button
              key={cat.value}
              type="button"
              onClick={() => handleCategorySelect(cat.value)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                isSelected
                  ? "bg-emerald-500 text-white shadow-sm shadow-emerald-500/25"
                  : "bg-secondary/40 text-slate-300 hover:text-white hover:bg-secondary/70 border border-border/40"
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Desktop Detailed Filter Bar (Grade filter removed as requested) */}
      <div className="hidden lg:grid grid-cols-4 gap-3.5 p-3.5 rounded-2xl bg-secondary/20 border border-border/40 items-center text-xs">
        {/* District Filter */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-300 mb-1">
            {t.marketplace.districtLabel}
          </label>
          <Input
            value={filters.district || ""}
            onChange={(e) => handleLocationChange("district", e.target.value)}
            placeholder={t.marketplace.districtPlaceholder}
            className="h-9 text-xs bg-secondary/60 border-border/60"
          />
        </div>

        {/* Min Price */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-300 mb-1">
            {t.marketplace.minPriceLabel}
          </label>
          <Input
            type="number"
            min="0"
            value={filters.min_price || ""}
            onChange={(e) => handlePriceChange("min_price", e.target.value)}
            placeholder={t.marketplace.minPricePlaceholder}
            className="h-9 text-xs bg-secondary/60 border-border/60"
          />
        </div>

        {/* Max Price */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-300 mb-1">
            {t.marketplace.maxPriceLabel}
          </label>
          <Input
            type="number"
            min="0"
            value={filters.max_price || ""}
            onChange={(e) => handlePriceChange("max_price", e.target.value)}
            placeholder={t.marketplace.maxPricePlaceholder}
            className="h-9 text-xs bg-secondary/60 border-border/60"
          />
        </div>

        {/* Clear Filters Action */}
        <div className="flex items-end justify-end">
          {hasActiveFilters ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={onReset}
              className="text-xs h-9 text-slate-300 hover:text-destructive hover:bg-destructive/10 gap-1.5"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>{t.marketplace.resetFilters}</span>
            </Button>
          ) : (
            <span className="text-[11px] text-slate-400 text-right font-medium">
              {totalResults} {t.marketplace.verifiedLots}
            </span>
          )}
        </div>
      </div>

      {/* Mobile Filters Drawer / Sheet Modal */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-background/80 backdrop-blur-sm lg:hidden">
          <div className="w-full max-w-sm h-full bg-slate-900 border-l border-border/60 p-6 flex flex-col justify-between overflow-y-auto">
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-border/40 pb-4">
                <div className="flex items-center gap-2">
                  <Filter className="h-5 w-5 text-emerald-400" />
                  <h3 className="font-heading text-lg font-bold text-white">{t.marketplace.filters}</h3>
                </div>
                <button
                  onClick={() => setIsMobileOpen(false)}
                  className="rounded-full p-1.5 text-slate-400 hover:text-white hover:bg-secondary/40"
                >
                  <span className="sr-only">Close</span>
                  ✕
                </button>
              </div>

              {/* Category */}
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  {t.addProduce.category}
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {categories.map((cat) => (
                    <button
                      key={cat.value}
                      onClick={() => handleCategorySelect(cat.value)}
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        activeCategory === cat.value
                          ? "bg-emerald-500 text-white"
                          : "bg-secondary/40 text-slate-300 border border-border/40"
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* District */}
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  {t.marketplace.districtLabel}
                </label>
                <Input
                  value={filters.district || ""}
                  onChange={(e) => handleLocationChange("district", e.target.value)}
                  placeholder={t.marketplace.districtPlaceholder}
                  className="bg-secondary/40 border-border/60 text-xs"
                />
              </div>

              {/* Price Range */}
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  {t.marketplace.minPriceLabel} / {t.marketplace.maxPriceLabel}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    type="number"
                    min="0"
                    value={filters.min_price || ""}
                    onChange={(e) => handlePriceChange("min_price", e.target.value)}
                    placeholder={t.marketplace.minPricePlaceholder}
                    className="bg-secondary/40 border-border/60 text-xs"
                  />
                  <Input
                    type="number"
                    min="0"
                    value={filters.max_price || ""}
                    onChange={(e) => handlePriceChange("max_price", e.target.value)}
                    placeholder={t.marketplace.maxPricePlaceholder}
                    className="bg-secondary/40 border-border/60 text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-6 border-t border-border/40 flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  onReset();
                  setIsMobileOpen(false);
                }}
                className="flex-1 text-xs"
              >
                {t.marketplace.resetFilters}
              </Button>
              <Button
                variant="harvest"
                onClick={() => setIsMobileOpen(false)}
                className="flex-1 text-xs"
              >
                {t.marketplace.applyFilters}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MarketplaceFilters;
