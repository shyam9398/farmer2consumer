import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Sliders, Sparkles, ArrowRight, RefreshCw } from "lucide-react";
import { useBuyerPreferences, useUpdateBuyerPreferences } from "@/hooks/useBuyerPreferences";
import { BuyerPreferenceForm } from "@/components/matching/BuyerPreferenceForm";
import { BuyerPreferences } from "@/types/matching";
import { Button } from "@/components/ui/button";

export const BuyerPreferencesPage: React.FC = () => {
  const { data: preferences, isLoading, error, refetch } = useBuyerPreferences();
  const updateMutation = useUpdateBuyerPreferences();
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const handleSubmit = async (payload: Partial<BuyerPreferences>) => {
    setSaveSuccess(false);
    setSaveError(null);
    try {
      await updateMutation.mutateAsync(payload);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err: any) {
      const msg =
        err?.response?.data?.detail || err?.message || "Failed to update buyer preferences.";
      setSaveError(typeof msg === "string" ? msg : JSON.stringify(msg));
    }
  };

  return (
    <div className="container mx-auto px-4 sm:px-8 py-8 space-y-8 max-w-4xl">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Sliders className="w-4 h-4" />
            </span>
            <span className="text-xs font-mono uppercase tracking-wider text-emerald-400 font-semibold">
              Procurement Profile
            </span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Buyer Preferences
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Tell Mandi Direct what products and regions you are interested in so we can show more relevant farmer listings.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link to="/buyer/matching">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs text-emerald-400 border-emerald-500/30">
              <Sparkles className="w-3.5 h-3.5" />
              <span>View Recommendations</span>
              <ArrowRight className="w-3 h-3" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-16 space-y-3">
          <RefreshCw className="w-6 h-6 text-emerald-400 animate-spin" />
          <p className="text-sm text-slate-400">Loading your procurement preferences...</p>
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <div className="p-6 rounded-xl bg-destructive/10 border border-destructive/40 text-center space-y-3">
          <p className="text-sm text-rose-300">
            Failed to load preferences: {(error as any)?.message || "Unknown error"}
          </p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      )}

      {/* Preference Configuration Form */}
      {!isLoading && (
        <BuyerPreferenceForm
          initialData={preferences}
          onSubmit={handleSubmit}
          isSaving={updateMutation.isPending}
          saveSuccess={saveSuccess}
          saveError={saveError}
        />
      )}
    </div>
  );
};
