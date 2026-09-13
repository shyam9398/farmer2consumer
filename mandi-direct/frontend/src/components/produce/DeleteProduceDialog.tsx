import React from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProduceListing } from "@/types/produce";

interface DeleteProduceDialogProps {
  isOpen: boolean;
  produce: ProduceListing | null;
  isLoading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const DeleteProduceDialog: React.FC<DeleteProduceDialogProps> = ({
  isOpen,
  produce,
  isLoading,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen || !produce) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-slate-900 border border-border/80 rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4">
        <div className="flex items-center gap-3 text-rose-400">
          <div className="p-2.5 rounded-full bg-rose-500/10 border border-rose-500/20">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-bold text-white">Delete Produce Draft?</h3>
        </div>

        <p className="text-sm text-slate-300">
          Are you sure you want to delete the produce lot{" "}
          <strong className="text-white">"{produce.product_name}"</strong>
          {produce.variety ? ` (${produce.variety})` : ""}?
        </p>

        <p className="text-xs text-slate-400">
          This draft listing and all uploaded photos will be permanently deleted. This action cannot be undone.
        </p>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
            className="border-slate-700 hover:bg-slate-800"
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={onConfirm}
            disabled={isLoading}
            className="bg-rose-600 hover:bg-rose-700 font-semibold"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Deleting...
              </>
            ) : (
              "Delete Produce"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};
