import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  Sparkles,
  Sliders,
  RefreshCw,
  AlertCircle,
  Package,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useBuyerProductMatches } from "@/hooks/useMatching";
import { ProductMatchCard } from "@/components/matching/ProductMatchCard";
import { MatchingFilters } from "@/components/matching/MatchingFilters";
import { MatchingFilters as FilterValues } from "@/types/matching";
import { Button } from "@/components/ui/button";

export const BuyerMatchingPage: React.FC = () => {
  const [filters, setFilters] = useState<FilterValues>({
    sort: "highest_match",
    page: 1,
    page_size: 10,
  });

  const { data, isLoading, error, refetch } = useBuyerProductMatches(filters);

  const handleFilterChange = (newFilters: Partial<FilterValues>) => {
    setFilters((prev) => ({
      ...prev,
      ...newFilters,
    }));
  };

  const handleReset = () => {
    setFilters({
      sort: "highest_match",
      page: 1,
      page_size: 10,
    });
  };

  const items = data?.items || [];
  const total = data?.total || 0;
  const totalPages = data?.total_pages || 1;
  const currentPage = filters.page || 1;

  return (
    <div className="container mx-auto px-4 sm:px-8 py-8 space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Sparkles className="w-4 h-4" />
            </span>
            <span className="text-xs font-mono uppercase tracking-wider text-emerald-400 font-semibold">
              Smart Produce Discovery
            </span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Products Matched to Your Interests
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Real-time deterministic matching calculated from your preferences, location, and verified order history.
          </p>
        </div>

        <Link to="/buyer/preferences">
          <Button variant="outline" size="sm" className="gap-1.5 text-xs text-emerald-400 border-emerald-500/30">
            <Sliders className="w-3.5 h-3.5" />
            <span>Edit Preferences</span>
          </Button>
        </Link>
      </div>

      {/* Filter Component */}
      <MatchingFilters
        filters={filters}
        onFilterChange={handleFilterChange}
        onReset={handleReset}
        mode="buyer"
      />

      {/* Results Meta */}
      <div className="flex items-center justify-between text-xs text-slate-400 px-1">
        <span>
          Showing <strong className="text-white">{items.length}</strong> of{" "}
          <strong className="text-white">{total}</strong> matched produce listings
        </span>
        <span>Page {currentPage} of {totalPages}</span>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-16 space-y-3">
          <RefreshCw className="w-6 h-6 text-emerald-400 animate-spin" />
          <p className="text-sm text-slate-400">Computing real-time produce matches...</p>
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <div className="p-8 rounded-xl bg-destructive/10 border border-destructive/40 text-center space-y-3">
          <AlertCircle className="w-6 h-6 text-rose-400 mx-auto" />
          <p className="text-sm text-rose-300">
            Failed to retrieve recommendations: {(error as any)?.message || "Unknown error"}
          </p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && items.length === 0 && (
        <div className="p-12 rounded-xl bg-card/40 border border-border/60 text-center space-y-3">
          <Package className="w-10 h-10 text-slate-500 mx-auto" />
          <h3 className="text-base font-semibold text-white">No products currently match your preferences</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Try adjusting your search criteria or resetting filters to view a broader range of active harvest listings.
          </p>
          <div className="pt-2 flex justify-center gap-2">
            <Button variant="outline" size="sm" onClick={handleReset} className="text-xs">
              Reset Filters
            </Button>
            <Link to="/buyer/preferences">
              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-500 text-xs">
                Update Preferences
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* Grid of Results */}
      {!isLoading && !error && items.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map((item) => (
            <ProductMatchCard key={item.produce.produce_id} item={item} />
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4 border-t border-border/40">
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage <= 1 || isLoading}
            onClick={() => handleFilterChange({ page: currentPage - 1 })}
            className="text-xs gap-1"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous</span>
          </Button>

          <span className="text-xs text-slate-400 px-3 font-mono">
            {currentPage} / {totalPages}
          </span>

          <Button
            variant="outline"
            size="sm"
            disabled={currentPage >= totalPages || isLoading}
            onClick={() => handleFilterChange({ page: currentPage + 1 })}
            className="text-xs gap-1"
          >
            <span>Next</span>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
};
