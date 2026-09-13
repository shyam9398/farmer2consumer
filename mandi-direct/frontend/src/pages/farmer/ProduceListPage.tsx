import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertCircle,
  Clock,
  Loader2,
  PackageCheck,
  PlusCircle,
  RotateCcw,
  Search,
  ShoppingBag,
  Sprout,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useFarms, useFarmerSummary } from "@/hooks/useFarmer";
import {
  useDeleteProduce,
  useProduceList,
  useProduceStats,
  useSubmitProduce,
  usePublishProduce,
} from "@/hooks/useProduce";
import { ProduceCard } from "@/components/produce/ProduceCard";
import { DeleteProduceDialog } from "@/components/produce/DeleteProduceDialog";
import { ProduceListing } from "@/types/produce";

export const ProduceListPage: React.FC = () => {
  const navigate = useNavigate();
  const { data: summary } = useFarmerSummary();
  const { data: farms = [] } = useFarms();
  const { data: stats } = useProduceStats();

  // Filters state
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [farmFilter, setFarmFilter] = useState<string>("");
  const [page, setPage] = useState(1);

  // Dialog & actions state
  const [produceToDelete, setProduceToDelete] = useState<ProduceListing | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Queries & Mutations
  const {
    data: produceData,
    isLoading,
    isError,
    refetch,
  } = useProduceList({
    search: search || undefined,
    status: statusFilter || undefined,
    category: categoryFilter || undefined,
    farm_id: farmFilter || undefined,
    page,
    page_size: 12,
  });

  const deleteMutation = useDeleteProduce();
  const submitMutation = useSubmitProduce();
  const publishMutation = usePublishProduce();

  const isProfileComplete = summary?.is_profile_complete ?? false;

  const handleResetFilters = () => {
    setSearch("");
    setStatusFilter("");
    setCategoryFilter("");
    setFarmFilter("");
    setPage(1);
  };

  const handleDeleteConfirm = async () => {
    if (!produceToDelete) return;
    setActionError(null);
    try {
      await deleteMutation.mutateAsync(produceToDelete.id);
      setProduceToDelete(null);
      setActionSuccess("Produce lot deleted successfully.");
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err: any) {
      setActionError(err?.response?.data?.detail || "Failed to delete produce lot.");
    }
  };

  const handleSubmitForVerification = async (item: ProduceListing) => {
    setActionError(null);
    setActionSuccess(null);
    if (!item.images || item.images.length === 0) {
      setActionError(`Please upload at least 1 photo for "${item.product_name}" before submitting.`);
      setTimeout(() => setActionError(null), 5000);
      return;
    }

    try {
      await submitMutation.mutateAsync(item.id);
      setActionSuccess(`"${item.product_name}" submitted for admin verification.`);
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err: any) {
      setActionError(err?.response?.data?.detail || "Failed to submit for verification.");
      setTimeout(() => setActionError(null), 5000);
    }
  };

  const handlePublishProduce = async (item: ProduceListing) => {
    setActionError(null);
    setActionSuccess(null);
    try {
      await publishMutation.mutateAsync(item.id);
      setActionSuccess(`"${item.product_name}" is now listed and visible in the Marketplace!`);
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err: any) {
      setActionError(err?.response?.data?.detail || "Failed to publish produce lot.");
      setTimeout(() => setActionError(null), 5000);
    }
  };

  return (
    <div className="container mx-auto px-4 sm:px-8 py-8 space-y-8 max-w-7xl">
      {/* Header & Primary Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
              <Sprout className="h-5 w-5" />
            </span>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">
              My Produce Lots
            </h1>
          </div>
          <p className="text-sm text-slate-400">
            Manage your harvest inventory, upload crop photos, and track verification on Mandi Direct.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={() => {
              if (!isProfileComplete) {
                navigate("/farmer/profile");
              } else {
                navigate("/farmer/produce/new");
              }
            }}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-lg shadow-emerald-950/40"
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            + Add Produce Lot
          </Button>
        </div>
      </div>

      {/* Profile Incompletion Warning */}
      {!isProfileComplete && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-amber-200">
                Profile Incomplete ({summary?.profile_completion_pct || 0}%)
              </h4>
              <p className="text-xs text-amber-300/80 mt-0.5">
                You must complete your personal details, address, and register at least one farm before you can add produce lots.
              </p>
            </div>
          </div>
          <Button
            size="sm"
            onClick={() => navigate("/farmer/profile")}
            className="bg-amber-600 hover:bg-amber-700 text-white font-medium text-xs shrink-0"
          >
            Complete Profile
          </Button>
        </div>
      )}

      {/* Notifications */}
      {actionSuccess && (
        <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm font-medium animate-in fade-in">
          {actionSuccess}
        </div>
      )}
      {actionError && (
        <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm font-medium animate-in fade-in">
          {actionError}
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="glass-card">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400">
              <Sprout className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase font-medium">Total Lots</p>
              <h3 className="text-2xl font-bold text-white">
                {stats?.total_listings ?? 0}
              </h3>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-400">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase font-medium">In Review</p>
              <h3 className="text-2xl font-bold text-amber-300">
                {stats?.pending_count ?? 0}
              </h3>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-green-500/10 text-green-400">
              <ShoppingBag className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase font-medium">Approved / Live</p>
              <h3 className="text-2xl font-bold text-green-300">
                {(stats?.approved_count ?? 0) + (stats?.listed_count ?? 0)}
              </h3>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-slate-800 text-slate-300">
              <PackageCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase font-medium">Drafts</p>
              <h3 className="text-2xl font-bold text-slate-200">
                {stats?.draft_count ?? 0}
              </h3>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card className="glass-card p-4 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {/* Keyword Search */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search crop, variety..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-9 bg-slate-900/60 border-slate-700 text-xs text-white"
            />
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="w-full h-10 px-3 rounded-md bg-slate-900/80 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="">All Statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="PENDING_VERIFICATION">Verification Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="LISTED">Live on Market</option>
              <option value="PARTIALLY_SOLD">Partially Sold</option>
              <option value="SOLD_OUT">Sold Out</option>
              <option value="REJECTED">Changes Requested</option>
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setPage(1);
              }}
              className="w-full h-10 px-3 rounded-md bg-slate-900/80 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="">All Categories</option>
              <option value="VEGETABLE">Vegetables</option>
              <option value="FRUIT">Fruits</option>
              <option value="GRAIN">Grains & Cereals</option>
              <option value="PULSE">Pulses / Dal</option>
              <option value="SPICE">Spices</option>
              <option value="OILSEED">Oilseeds</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          {/* Farm Filter */}
          <div>
            <select
              value={farmFilter}
              onChange={(e) => {
                setFarmFilter(e.target.value);
                setPage(1);
              }}
              className="w-full h-10 px-3 rounded-md bg-slate-900/80 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="">All Farms</option>
              {farms.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.farm_name} ({f.village})
                </option>
              ))}
            </select>
          </div>
        </div>

        {(search || statusFilter || categoryFilter || farmFilter) && (
          <div className="flex items-center justify-between pt-1 text-xs text-slate-400">
            <span>
              Filtered results:{" "}
              <strong className="text-slate-200">
                {produceData?.total ?? 0} lots
              </strong>
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResetFilters}
              className="h-7 text-xs text-slate-400 hover:text-white"
            >
              <RotateCcw className="h-3 w-3 mr-1" />
              Reset Filters
            </Button>
          </div>
        )}
      </Card>

      {/* Content Area */}
      {isLoading ? (
        <div className="py-16 flex flex-col items-center justify-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
          <p className="text-sm text-slate-400 font-medium">Loading produce listings...</p>
        </div>
      ) : isError ? (
        <div className="p-8 rounded-xl bg-slate-900/80 border border-border text-center space-y-3">
          <AlertCircle className="h-10 w-10 text-rose-400 mx-auto" />
          <h3 className="text-lg font-bold text-white">Failed to load produce listings</h3>
          <p className="text-xs text-slate-400">There was an error communicating with the API.</p>
          <Button onClick={() => refetch()} variant="outline" size="sm">
            Try Again
          </Button>
        </div>
      ) : produceData?.items && produceData.items.length > 0 ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {produceData.items.map((produce) => (
              <ProduceCard
                key={produce.id}
                produce={produce}
                onDelete={(item) => setProduceToDelete(item)}
                onSubmit={(item) => handleSubmitForVerification(item)}
                onPublish={(item) => handlePublishProduce(item)}
              />
            ))}
          </div>

          {/* Pagination Controls */}
          {produceData.total_pages > 1 && (
            <div className="flex items-center justify-between border-t border-border/50 pt-4 text-xs text-slate-400">
              <span>
                Page {produceData.page} of {produceData.total_pages} ({produceData.total} total items)
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                  className="border-slate-700"
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= produceData.total_pages}
                  onClick={() => setPage((prev) => prev + 1)}
                  className="border-slate-700"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Empty State */
        <div className="p-12 rounded-xl bg-slate-900/40 border border-dashed border-border/80 text-center space-y-4">
          <div className="p-4 rounded-full bg-emerald-500/10 w-fit mx-auto text-emerald-400">
            <Sprout className="h-10 w-10" />
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <h3 className="text-lg font-bold text-white">No Produce Listings Found</h3>
            <p className="text-xs text-slate-400">
              {search || statusFilter || categoryFilter || farmFilter
                ? "No harvest lots match your filter criteria. Try clearing filters."
                : "You haven't added any produce lots yet. Create your first lot to start selling directly to wholesale and retail buyers."}
            </p>
          </div>
          {search || statusFilter || categoryFilter || farmFilter ? (
            <Button variant="outline" size="sm" onClick={handleResetFilters}>
              Clear Filters
            </Button>
          ) : (
            <Button
              onClick={() => {
                if (!isProfileComplete) {
                  navigate("/farmer/profile");
                } else {
                  navigate("/farmer/produce/new");
                }
              }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
            >
              <PlusCircle className="h-4 w-4 mr-2" />
              Add Your First Produce Lot
            </Button>
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteProduceDialog
        isOpen={!!produceToDelete}
        produce={produceToDelete}
        isLoading={deleteMutation.isPending}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setProduceToDelete(null)}
      />
    </div>
  );
};
