import React, { useState } from "react";
import { AlertCircle, X, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

interface VerificationRejectDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void> | void;
  title: string;
  entityName: string;
  isLoading?: boolean;
}

export const VerificationRejectDialog: React.FC<VerificationRejectDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  entityName,
  isLoading = false,
}) => {
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const trimmedReason = reason.trim();
  const isValid = trimmedReason.length >= 5;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) {
      setError("A detailed explanation of at least 5 characters is required.");
      return;
    }
    setError(null);
    try {
      await onConfirm(trimmedReason);
      setReason("");
      onClose();
    } catch (err: any) {
      setError(
        err?.response?.data?.detail || "Failed to submit rejection. Please try again."
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-rose-50/50 dark:bg-rose-950/20">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-rose-100 dark:bg-rose-900/60 rounded-xl text-rose-600 dark:text-rose-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                {title}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-xs">
                {entityName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="p-3.5 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200/60 dark:border-amber-900/40 text-amber-900 dark:text-amber-300 text-xs leading-relaxed flex items-start space-x-2.5">
            <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <span>
              The farmer will receive this exact feedback message to correct their details
              or upload higher quality lot photos before resubmitting.
            </span>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Rejection Reason <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={4}
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (error) setError(null);
              }}
              placeholder="e.g. Document mismatch on survey number SY-42, or produce photo is blurry and does not show quality grade."
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition-all resize-none"
              autoFocus
            />
            <div className="flex justify-between items-center text-xs">
              <span className={trimmedReason.length < 5 ? "text-slate-400" : "text-emerald-600 font-medium"}>
                {trimmedReason.length} / 5 minimum characters
              </span>
              <span className="text-slate-400">Max 1000 characters</span>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 rounded-xl text-rose-700 dark:text-rose-300 text-xs font-medium">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
              className="rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!isValid || isLoading}
              className="bg-rose-600 hover:bg-rose-700 text-white font-medium rounded-xl shadow-sm"
            >
              {isLoading ? "Submitting Rejection..." : "Confirm Rejection"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
