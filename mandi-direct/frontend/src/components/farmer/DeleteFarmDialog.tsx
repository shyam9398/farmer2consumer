import React from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Farm } from "@/types/farmer";

interface DeleteFarmDialogProps {
  isOpen: boolean;
  farm: Farm | null;
  isLoading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const DeleteFarmDialog: React.FC<DeleteFarmDialogProps> = ({
  isOpen,
  farm,
  isLoading,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen || !farm) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-md rounded-xl border border-border bg-slate-900/95 p-6 shadow-2xl space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-500/20 text-rose-400">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Delete Farm Parcel</h3>
            <p className="text-xs text-muted-foreground">This action cannot be undone.</p>
          </div>
        </div>

        <div className="p-3 rounded-lg bg-secondary/40 border border-border/50 text-xs text-slate-300 space-y-1">
          <p>
            Are you sure you want to remove{" "}
            <span className="font-semibold text-white">"{farm.farm_name}"</span> ({farm.total_area}{" "}
            {farm.area_unit})?
          </p>
          <p className="text-[11px] text-slate-400">
            Location: {farm.village}, {farm.district}
          </p>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button variant="ghost" size="sm" onClick={onCancel} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={onConfirm}
            disabled={isLoading}
            className="gap-1.5"
          >
            {isLoading ? "Deleting..." : "Confirm Delete"}
          </Button>
        </div>
      </div>
    </div>
  );
};
