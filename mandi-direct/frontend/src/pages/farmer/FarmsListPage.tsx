import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  Plus,
  Layers,
  Sparkles,
  MapPin,
  AlertCircle,
  CheckCircle,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FarmCard } from "@/components/farmer/FarmCard";
import { DeleteFarmDialog } from "@/components/farmer/DeleteFarmDialog";
import { useFarms, useDeleteFarm, useFarmerSummary } from "@/hooks/useFarmer";
import { Farm } from "@/types/farmer";

export const FarmsListPage: React.FC = () => {
  const { data: farms = [], isLoading, error } = useFarms();
  const { data: summary } = useFarmerSummary();
  const deleteFarm = useDeleteFarm();

  const [farmToDelete, setFarmToDelete] = useState<Farm | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(
    null
  );

  const handleDeleteConfirm = async () => {
    if (!farmToDelete) return;
    try {
      await deleteFarm.mutateAsync(farmToDelete.id);
      setFeedback({ type: "success", message: `Farm "${farmToDelete.farm_name}" was deleted successfully.` });
      setFarmToDelete(null);
    } catch (err: any) {
      setFeedback({
        type: "error",
        message: err?.response?.data?.detail || "Failed to delete farm. Please try again.",
      });
    }
  };

  return (
    <div className="container mx-auto px-4 sm:px-8 py-8 space-y-8 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="success">FARM MANAGEMENT</Badge>
            <span className="text-xs text-muted-foreground">Multi-parcel Registry</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white">My Farms</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Register and manage your land parcels to list produce directly for institutional buyers.
          </p>
        </div>

        <Link to="/farmer/farms/new">
          <Button variant="harvest" className="gap-2 shadow-md shadow-emerald-600/20">
            <Plus className="h-4 w-4" />
            <span>+ Add Farm</span>
          </Button>
        </Link>
      </div>

      {/* Summary Banner if farms exist */}
      {farms.length > 0 && summary && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-xl glass-card border border-emerald-500/30">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase">Registered Parcels</p>
              <p className="text-xl font-bold text-white font-mono">{summary.total_farms} Farms</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase">Total Cultivated Area</p>
              <p className="text-xl font-bold text-white font-mono">
                {summary.total_farm_area_acres} Acres
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <MapPin className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase">Primary Crops</p>
              <p className="text-xs font-semibold text-emerald-400 truncate max-w-[200px]">
                {summary.primary_crops.length > 0 ? summary.primary_crops.join(", ") : "None specified"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Feedback Alert */}
      {feedback && (
        <div
          className={`flex items-center gap-3 p-4 rounded-xl border text-sm font-medium ${
            feedback.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
              : "bg-rose-500/10 border-rose-500/30 text-rose-300"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle className="h-5 w-5 shrink-0 text-emerald-400" />
          ) : (
            <AlertCircle className="h-5 w-5 shrink-0 text-rose-400" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Main Content Area */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
          <p className="text-sm text-slate-400">Loading your farm records...</p>
        </div>
      ) : error ? (
        <div className="p-6 rounded-xl bg-destructive/10 border border-destructive/30 text-center space-y-3">
          <AlertCircle className="h-8 w-8 text-rose-400 mx-auto" />
          <p className="text-sm text-rose-300">
            Failed to load farm details from server. Please refresh or check connection.
          </p>
        </div>
      ) : farms.length === 0 ? (
        /* Empty State */
        <div className="text-center py-16 px-4 rounded-2xl border border-dashed border-border/80 bg-secondary/20 max-w-xl mx-auto space-y-4">
          <div className="h-16 w-16 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto">
            <Layers className="h-8 w-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-white">Your farm information has not been added yet.</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Add your land parcels to complete your profile and unlock the Add Produce workflow for direct mandi auctions.
            </p>
          </div>
          <div className="pt-2">
            <Link to="/farmer/farms/new">
              <Button variant="harvest" className="gap-2">
                <Plus className="h-4 w-4" />
                <span>+ Add Your First Farm</span>
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        /* Grid of Farms */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {farms.map((farm) => (
            <FarmCard
              key={farm.id}
              farm={farm}
              onDelete={(f) => setFarmToDelete(f)}
            />
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteFarmDialog
        isOpen={Boolean(farmToDelete)}
        farm={farmToDelete}
        isLoading={deleteFarm.isPending}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setFarmToDelete(null)}
      />
    </div>
  );
};
