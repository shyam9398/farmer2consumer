import React from "react";
import { Check, AlertTriangle, XCircle } from "lucide-react";
import { OrderStatus, OrderStatusHistory } from "@/types/order";

interface OrderStatusTimelineProps {
  currentStatus: OrderStatus;
  history: OrderStatusHistory[];
}

interface Step {
  key: OrderStatus | string;
  label: string;
  sublabel: string;
}

export const OrderStatusTimeline: React.FC<OrderStatusTimelineProps> = ({
  currentStatus,
  history = [],
}) => {
  if (currentStatus === "CANCELLED" || currentStatus === "REJECTED") {
    const isCancelled = currentStatus === "CANCELLED";
    const historyEntry = history.find((h) => h.new_status === currentStatus);

    return (
      <div
        className={`rounded-xl border p-4 flex items-start gap-3 ${
          isCancelled
            ? "border-rose-500/30 bg-rose-950/20 text-rose-300"
            : "border-slate-700 bg-slate-900/60 text-slate-300"
        }`}
      >
        {isCancelled ? (
          <XCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
        ) : (
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        )}
        <div className="space-y-1 text-xs">
          <h4 className="font-bold text-sm text-white">
            {isCancelled ? "Order Cancelled" : "Order Declined by Farmer"}
          </h4>
          <p className="text-slate-300 leading-relaxed">
            {historyEntry?.reason ||
              (isCancelled
                ? "This order was cancelled by the buyer. Reserved inventory was restored to the mandi."
                : "The farmer was unable to accept this order lot. Please select an alternative verified farmer.")}
          </p>
          {historyEntry?.created_at && (
            <p className="text-[11px] text-slate-400">
              Recorded on: {new Date(historyEntry.created_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
            </p>
          )}
        </div>
      </div>
    );
  }

  const steps: Step[] = [
    { key: "PENDING", label: "Order Confirmed", sublabel: "Order Placed" },
    { key: "ACCEPTED", label: "Farmer Accepted", sublabel: "Availability Confirmed" },
    { key: "PREPARING", label: "Preparing", sublabel: "Harvesting & Sorting" },
    { key: "READY_FOR_PICKUP", label: "Ready for Pickup", sublabel: "Staged at Hub" },
    { key: "PICKED_UP", label: "Picked Up", sublabel: "Collected from Hub" },
    { key: "OUT_FOR_DELIVERY", label: "Out for Delivery", sublabel: "In Transit" },
    { key: "DELIVERED", label: "Delivered", sublabel: "Handed Over" },
  ];

  const statusOrder = [
    "PENDING",
    "ACCEPTED",
    "PREPARING",
    "READY_FOR_PICKUP",
    "PICKED_UP",
    "OUT_FOR_DELIVERY",
    "DELIVERED",
  ];

  const currentIndex = statusOrder.indexOf(currentStatus);

  // Map each status to timestamp in history
  const getTimestampForStatus = (statusKey: string) => {
    const entry = history.find((h) => h.new_status === statusKey);
    if (!entry?.created_at) return null;
    const d = new Date(entry.created_at);
    return d.toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="w-full py-4 overflow-x-auto">
      <div className="min-w-[650px] relative flex items-start justify-between px-2">
        {/* Continuous Background Line */}
        <div className="absolute left-8 right-8 top-4 h-1 bg-slate-800 rounded-full z-0" />

        {/* Progress Line */}
        <div
          className="absolute left-8 top-4 h-1 bg-emerald-500 rounded-full z-0 transition-all duration-500"
          style={{
            width: `${Math.min(
              100,
              Math.max(0, (currentIndex / (steps.length - 1)) * 100)
            )}%`,
          }}
        />

        {steps.map((step, idx) => {
          const stepIndex = statusOrder.indexOf(step.key);
          const isCompleted = currentIndex >= stepIndex;
          const isCurrent = currentIndex === stepIndex;
          const timestamp = getTimestampForStatus(step.key);

          return (
            <div
              key={step.key}
              className="relative z-10 flex flex-col items-center group cursor-default max-w-[90px] text-center"
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${
                  isCompleted
                    ? "bg-emerald-600 border-emerald-500 text-white shadow-md shadow-emerald-950/40"
                    : isCurrent
                    ? "bg-slate-900 border-emerald-400 text-emerald-400 ring-4 ring-emerald-500/20"
                    : "bg-slate-900 border-slate-700 text-slate-500"
                }`}
              >
                {isCompleted ? (
                  <Check className="w-4 h-4 text-white stroke-[2.5]" />
                ) : (
                  <span className="text-[10px] font-bold">{idx + 1}</span>
                )}
              </div>

              <div className="mt-2 space-y-0.5">
                <p
                  className={`text-xs font-semibold leading-tight ${
                    isCurrent
                      ? "text-emerald-400 font-bold"
                      : isCompleted
                      ? "text-slate-200"
                      : "text-slate-500"
                  }`}
                >
                  {step.label}
                </p>

                {timestamp ? (
                  <p className="text-[10px] font-mono text-emerald-400/80 font-medium">
                    {timestamp}
                  </p>
                ) : (
                  <p className="text-[10px] text-slate-400 hidden sm:block">
                    {step.sublabel}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
export default OrderStatusTimeline;
