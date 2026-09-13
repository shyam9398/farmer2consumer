import React, { useState } from "react";
import {
  useAdminPriceObservations,
  useCreatePriceObservation,
  useUpdatePriceObservation,
  useDeletePriceObservation,
  useImportPriceObservations,
} from "@/hooks/usePriceIntelligence";
import { PriceObservation, PriceObservationCreateInput } from "@/types/priceIntelligence";
import { PriceObservationTable } from "@/components/price-intelligence/PriceObservationTable";
import { PriceObservationForm } from "@/components/price-intelligence/PriceObservationForm";
import { CSVImportPanel } from "@/components/price-intelligence/CSVImportPanel";
import { Search, Plus, FileSpreadsheet, RefreshCw, ChevronLeft, ChevronRight, Shield } from "lucide-react";

export const AdminPriceIntelligencePage: React.FC = () => {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [sourceType, setSourceType] = useState("");
  const [page, setPage] = useState(1);

  const [editingObs, setEditingObs] = useState<PriceObservation | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isCSVOpen, setIsCSVOpen] = useState(false);

  const { data: listData, isLoading, refetch, isRefetching } = useAdminPriceObservations({
    search: search || undefined,
    category: category || undefined,
    source_type: sourceType || undefined,
    page,
    size: 15,
  });

  const createMutation = useCreatePriceObservation();
  const updateMutation = useUpdatePriceObservation();
  const deleteMutation = useDeletePriceObservation();
  const importMutation = useImportPriceObservations();

  const handleFormSubmit = (data: PriceObservationCreateInput) => {
    if (editingObs) {
      updateMutation.mutate(
        { id: editingObs.id, data },
        {
          onSuccess: () => {
            setIsFormOpen(false);
            setEditingObs(null);
          },
        }
      );
    } else {
      createMutation.mutate(data, {
        onSuccess: () => {
          setIsFormOpen(false);
        },
      });
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this price observation?")) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-6 rounded-3xl bg-slate-900 text-white shadow-lg">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-semibold mb-2">
            <Shield className="h-3.5 w-3.5" />
            Admin Governance & Moderation
          </div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight">Market Price Observations Console</h1>
          <p className="text-xs md:text-sm text-slate-400 mt-1 max-w-xl">
            Maintain, clean, and import market price observations used by the Mandi Direct recommendation engine.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsCSVOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition-colors border border-slate-700 shadow-xs"
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-400" />
            Import CSV
          </button>
          <button
            type="button"
            onClick={() => {
              setEditingObs(null);
              setIsFormOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add Observation
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-2xl border border-border bg-card shadow-2xs flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
        <div className="w-full md:w-auto flex-1 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="h-4 w-4 text-muted-foreground absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search product, market, or source..."
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-input bg-background text-foreground text-xs"
            />
          </div>

          <select
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 rounded-xl border border-input bg-background text-foreground text-xs"
          >
            <option value="">All Categories</option>
            <option value="VEGETABLE">Vegetables</option>
            <option value="FRUIT">Fruits</option>
            <option value="GRAIN">Grains</option>
            <option value="PULSE">Pulses</option>
            <option value="SPICE">Spices</option>
            <option value="OILSEED">Oilseeds</option>
          </select>

          <select
            value={sourceType}
            onChange={(e) => {
              setSourceType(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 rounded-xl border border-input bg-background text-foreground text-xs"
          >
            <option value="">All Source Types</option>
            <option value="ADMIN_IMPORT">ADMIN_IMPORT</option>
            <option value="GOVERNMENT_DATA">GOVERNMENT_DATA</option>
            <option value="EXTERNAL_API">EXTERNAL_API</option>
            <option value="MANDI_DIRECT_TRANSACTION">MANDI_DIRECT_TRANSACTION</option>
            <option value="OTHER">OTHER</option>
          </select>
        </div>

        <button
          type="button"
          onClick={() => refetch()}
          disabled={isRefetching}
          className="p-2 rounded-xl border border-border text-muted-foreground hover:text-foreground transition-colors shrink-0"
          title="Refresh Table"
        >
          <RefreshCw className={`h-4 w-4 ${isRefetching ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Main Observations Table */}
      {isLoading ? (
        <div className="p-12 text-center border border-border rounded-2xl bg-card animate-pulse">
          <div className="h-6 w-48 bg-muted rounded mx-auto mb-2" />
          <div className="h-4 w-32 bg-muted rounded mx-auto" />
        </div>
      ) : listData ? (
        <div className="space-y-4">
          <PriceObservationTable
            observations={listData.items}
            onEdit={(obs) => {
              setEditingObs(obs);
              setIsFormOpen(true);
            }}
            onDelete={handleDelete}
            isDeleting={deleteMutation.isPending}
          />

          {/* Pagination Controls */}
          {listData.pages > 1 && (
            <div className="flex items-center justify-between p-4 rounded-2xl border border-border bg-card text-xs">
              <span className="text-muted-foreground">
                Showing Page <strong>{listData.page}</strong> of <strong>{listData.pages}</strong> ({listData.total} total records)
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="p-2 rounded-xl border border-border text-foreground hover:bg-muted disabled:opacity-40"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  disabled={page >= listData.pages}
                  onClick={() => setPage((p) => p + 1)}
                  className="p-2 rounded-xl border border-border text-foreground hover:bg-muted disabled:opacity-40"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      ) : null}

      {/* Form Modal */}
      {isFormOpen && (
        <PriceObservationForm
          initialData={editingObs}
          onSubmit={handleFormSubmit}
          onCancel={() => {
            setIsFormOpen(false);
            setEditingObs(null);
          }}
          isLoading={createMutation.isPending || updateMutation.isPending}
        />
      )}

      {/* CSV Import Modal */}
      {isCSVOpen && (
        <CSVImportPanel
          onUpload={(file) => importMutation.mutateAsync(file)}
          onClose={() => setIsCSVOpen(false)}
        />
      )}
    </div>
  );
};
