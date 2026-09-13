import React, { useEffect, useState } from "react";
import { Check, Lock, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  useNotificationPreferences,
  useUpdateNotificationPreferences,
} from "@/hooks/useNotifications";
import { NotificationPreferenceUpdate } from "@/types/notification";

interface PreferenceOption {
  key: keyof NotificationPreferenceUpdate;
  title: string;
  description: string;
  disabled?: boolean;
}

const PREFERENCE_OPTIONS: PreferenceOption[] = [
  {
    key: "order_notifications",
    title: "Order Lifecycle Notifications",
    description: "Receive alerts when orders are placed, accepted, preparing, or ready for pickup.",
  },
  {
    key: "verification_notifications",
    title: "Verification & Compliance",
    description: "Receive updates when farmer profiles and produce listings are approved or reviewed.",
  },
  {
    key: "logistics_notifications",
    title: "Logistics & Transport",
    description: "Receive alerts on pickup schedules, consignments out for delivery, and arrival.",
  },
  {
    key: "payment_notifications",
    title: "Buyer Payment Updates",
    description: "Notifications when buyer payments are verified and processed.",
  },
  {
    key: "payout_notifications",
    title: "Farmer Payouts & Earnings",
    description: "Receive notifications when payout requests are submitted, processed, or completed.",
  },
  {
    key: "matching_notifications",
    title: "Smart Farmer-Buyer Matching",
    description: "Get alerts when high-confidence direct trade matches are discovered for your produce.",
  },
  {
    key: "intelligence_notifications",
    title: "Price & Demand Intelligence",
    description: "Receive factual alerts regarding market price updates and local demand spikes.",
  },
  {
    key: "system_notifications",
    title: "System & Security (Required)",
    description: "Critical security notices and operational announcements. Cannot be disabled.",
    disabled: true,
  },
];

export const NotificationPreferencesForm: React.FC = () => {
  const { data: preferences, isLoading } = useNotificationPreferences();
  const updateMutation = useUpdateNotificationPreferences();

  const [formState, setFormState] = useState<NotificationPreferenceUpdate>({
    order_notifications: true,
    verification_notifications: true,
    logistics_notifications: true,
    payment_notifications: true,
    payout_notifications: true,
    matching_notifications: true,
    intelligence_notifications: true,
    system_notifications: true,
  });
  const [successMsg, setSuccessMsg] = useState(false);

  useEffect(() => {
    if (preferences) {
      setFormState({
        order_notifications: preferences.order_notifications,
        verification_notifications: preferences.verification_notifications,
        logistics_notifications: preferences.logistics_notifications,
        payment_notifications: preferences.payment_notifications,
        payout_notifications: preferences.payout_notifications,
        matching_notifications: preferences.matching_notifications,
        intelligence_notifications: preferences.intelligence_notifications,
        system_notifications: true, // Always true
      });
    }
  }, [preferences]);

  const handleToggle = (key: keyof NotificationPreferenceUpdate, disabled?: boolean) => {
    if (disabled) return;
    setFormState((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
    setSuccessMsg(false);
  };

  const handleSave = () => {
    updateMutation.mutate(
      { ...formState, system_notifications: true },
      {
        onSuccess: () => {
          setSuccessMsg(true);
          setTimeout(() => setSuccessMsg(false), 3000);
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-4 p-6 rounded-xl border border-border/50 bg-secondary/20 animate-pulse">
        <div className="h-6 w-48 bg-secondary/50 rounded" />
        <div className="h-20 bg-secondary/40 rounded-lg" />
        <div className="h-20 bg-secondary/40 rounded-lg" />
        <div className="h-20 bg-secondary/40 rounded-lg" />
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border/60 bg-secondary/15 backdrop-blur-sm p-6 space-y-6">
      <div className="space-y-1">
        <h3 className="text-base font-semibold text-white">Notification Preferences</h3>
        <p className="text-xs text-muted-foreground">
          Choose which notifications you wish to receive in Mandi Direct. Settings persist across devices.
        </p>
      </div>

      <div className="divide-y divide-border/40">
        {PREFERENCE_OPTIONS.map((opt) => {
          const isChecked = Boolean(formState[opt.key]);

          return (
            <div
              key={opt.key}
              className="py-4 first:pt-0 last:pb-0 flex items-center justify-between gap-4"
            >
              <div className="space-y-0.5 flex-1 pr-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-slate-200">{opt.title}</span>
                  {opt.disabled && (
                    <span className="flex items-center gap-1 text-[10px] font-semibold text-amber-400/90 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                      <Lock className="w-2.5 h-2.5" />
                      Locked
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {opt.description}
                </p>
              </div>

              {/* Custom Switch Toggle */}
              <button
                type="button"
                role="switch"
                aria-checked={isChecked}
                disabled={opt.disabled}
                onClick={() => handleToggle(opt.key, opt.disabled)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  opt.disabled
                    ? "opacity-60 cursor-not-allowed bg-emerald-600"
                    : isChecked
                    ? "bg-emerald-500"
                    : "bg-slate-700"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    isChecked ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          );
        })}
      </div>

      {/* Save Actions */}
      <div className="pt-4 border-t border-border/50 flex items-center justify-between">
        {successMsg ? (
          <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
            <Check className="w-4 h-4" />
            Preferences saved successfully
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">Changes take effect immediately</span>
        )}

        <Button
          onClick={handleSave}
          disabled={updateMutation.isPending}
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs h-9 gap-1.5"
        >
          <Save className="w-3.5 h-3.5" />
          <span>{updateMutation.isPending ? "Saving..." : "Save Preferences"}</span>
        </Button>
      </div>
    </div>
  );
};
