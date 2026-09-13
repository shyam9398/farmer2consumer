import React, { useState } from "react";
import { Sprout, AlertCircle, RefreshCw, ChevronLeft, ChevronRight, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useMarketplaceProducts } from "@/hooks/useMarketplace";
import { MarketplaceFilters as FilterParams } from "@/types/marketplace";
import { ProduceCard } from "@/components/marketplace/ProduceCard";
import { MarketplaceFilters } from "@/components/marketplace/MarketplaceFilters";
import { MarketplaceSort } from "@/components/marketplace/MarketplaceSort";
import { useLanguage } from "@/context/LanguageContext";

export const MarketplacePage: React.FC = () => {
  const { t } = useLanguage();
  const [filters, setFilters] = useState<FilterParams>({
    page: 1,
    page_size: 16,
    sort: "recommended",
  });

  const { data, isLoading, isError, error, refetch } = useMarketplaceProducts(filters);

  const handleFilterChange = (newFilters: FilterParams) => {
    setFilters(newFilters);
  };

  const handleResetFilters = () => {
    setFilters({
      page: 1,
      page_size: 16,
      sort: "recommended",
    });
  };

  const handlePageChange = (newPage: number) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const totalPages = data?.total_pages || 1;
  const currentPage = filters.page || 1;

  return (
    <div className="container mx-auto px-4 sm:px-8 py-8 space-y-8 max-w-7xl">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-950/40 via-background to-slate-900/60 border border-emerald-500/20 p-6 sm:p-10 shadow-2xl">
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
            <Sprout className="h-3.5 w-3.5" />
            <span>{t.marketplace.badge}</span>
          </div>
          <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight">
            {t.marketplace.title}
          </h1>
          <p className="text-sm sm:text-base text-slate-300 font-medium leading-relaxed">
            {t.marketplace.subtitle}
          </p>
        </div>
      </div>

      {/* Search and Filters Section */}
      <MarketplaceFilters
        filters={filters}
        onFilterChange={handleFilterChange}
        onReset={handleResetFilters}
        totalResults={data?.total || 0}
      />

      {/* Sorting and Count Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-4">
        <div className="flex items-center gap-2 text-xs text-slate-300">
          <SlidersHorizontal className="h-3.5 w-3.5 text-emerald-400" />
          <span>{t.marketplace.showing}</span>
          <span className="font-bold text-white">
            {data ? (data.total > 0 ? (currentPage - 1) * (filters.page_size || 16) + 1 : 0) : 0}
            {" - "}
            {data ? Math.min(currentPage * (filters.page_size || 16), data.total) : 0}
          </span>
          <span>{t.marketplace.of}</span>
          <span className="font-bold text-white">{data?.total || 0}</span>
          <span>{t.marketplace.verifiedLots}</span>
        </div>

        <MarketplaceSort
          value={filters.sort}
          onChange={(newSort) => setFilters((prev) => ({ ...prev, sort: newSort, page: 1 }))}
        />
      </div>

      {/* Main Grid / State Handling */}
      {isLoading ? (
        // Loading Skeleton Cards Grid
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, idx) => (
            <Card key={idx} className="glass-card overflow-hidden border-border/40 animate-pulse space-y-4 p-4">
              <div className="aspect-[4/3] w-full rounded-lg bg-slate-800/60" />
              <div className="space-y-2">
                <div className="h-5 w-3/4 rounded bg-slate-800/60" />
                <div className="h-4 w-1/2 rounded bg-slate-800/40" />
              </div>
              <div className="h-10 w-full rounded-lg bg-slate-800/40" />
              <div className="h-9 w-full rounded-md bg-slate-800/60" />
            </Card>
          ))}
        </div>
      ) : isError ? (
        // Error State
        <Card className="glass-card border-destructive/30 p-10 text-center max-w-xl mx-auto space-y-4">
          <div className="h-12 w-12 rounded-full bg-destructive/10 text-destructive mx-auto flex items-center justify-center">
            <AlertCircle className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h3 className="font-heading text-lg font-bold text-white">Unable to load marketplace</h3>
            <p className="text-xs text-slate-400">
              {(error as any)?.response?.data?.detail || "Please check your network connection and try again."}
            </p>
          </div>
          <Button variant="outline" onClick={() => refetch()} className="gap-2">
            <RefreshCw className="h-4 w-4" /> Retry
          </Button>
        </Card>
      ) : !data || data.items.length === 0 ? (
        // Empty State
        <Card className="glass-card border-border/40 p-12 text-center max-w-xl mx-auto space-y-5">
          <div className="h-16 w-16 rounded-full bg-secondary/60 text-slate-400 mx-auto flex items-center justify-center">
            <Sprout className="h-8 w-8 text-emerald-400" />
          </div>
          <div className="space-y-2">
            <h3 className="font-heading text-xl font-bold text-white">{t.marketplace.noProduceFound}</h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {filters.search || filters.category || filters.district || filters.min_price || filters.max_price
                ? t.marketplace.noProduceMatching
                : t.marketplace.noProduceAvailable}
            </p>
          </div>
          <Button variant="harvest" onClick={handleResetFilters} size="sm">
            {t.marketplace.clearFilters}
          </Button>
        </Card>
      ) : (
        // Real Data Product Cards Grid
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {data.items.map((product) => (
            <ProduceCard key={product.id} product={product} />
          ))}
        </div>
      )}

      {/* Server-Side Pagination Bar */}
      {data && data.total_pages > 1 && (
        <div className="flex flex-wrap items-center justify-center gap-2 pt-6 border-t border-border/40">
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage <= 1}
            onClick={() => handlePageChange(currentPage - 1)}
            className="gap-1 h-9 px-3 text-xs"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>{t.common.back}</span>
          </Button>

          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 2)
            .map((pageNumber, idx, arr) => {
              const prev = arr[idx - 1];
              const isEllipsis = prev && pageNumber - prev > 1;

              return (
                <React.Fragment key={pageNumber}>
                  {isEllipsis && <span className="text-slate-500 px-1 text-xs">...</span>}
                  <Button
                    variant={currentPage === pageNumber ? "harvest" : "outline"}
                    size="sm"
                    onClick={() => handlePageChange(pageNumber)}
                    className="h-9 w-9 p-0 text-xs font-semibold"
                  >
                    {pageNumber}
                  </Button>
                </React.Fragment>
              );
            })}

          <Button
            variant="outline"
            size="sm"
            disabled={currentPage >= totalPages}
            onClick={() => handlePageChange(currentPage + 1)}
            className="gap-1 h-9 px-3 text-xs"
          >
            <span>{t.common.next}</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default MarketplacePage;
