import React from "react";
import {
  AlertCircle,
  Archive,
  CheckCircle2,
  Clock,
  FileEdit,
  PackageCheck,
  ShoppingBag,
  TimerOff,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ProduceStatus } from "@/types/produce";
import { cn } from "@/lib/utils";

interface ProduceStatusBadgeProps {
  status: ProduceStatus;
  notes?: string | null;
  className?: string;
  showNotesInline?: boolean;
}

export const ProduceStatusBadge: React.FC<ProduceStatusBadgeProps> = ({
  status,
  notes,
  className,
  showNotesInline = false,
}) => {
  const getBadgeConfig = () => {
    switch (status) {
      case "DRAFT":
        return {
          label: "Draft",
          icon: <FileEdit className="h-3 w-3 mr-1 text-slate-400" />,
          bgColor: "bg-slate-800/80 border-slate-700 text-slate-300",
        };
      case "PENDING_VERIFICATION":
        return {
          label: "Pending Verification",
          icon: <Clock className="h-3 w-3 mr-1 text-amber-400 animate-pulse" />,
          bgColor: "bg-amber-500/10 border-amber-500/30 text-amber-400",
        };
      case "APPROVED":
        return {
          label: "Approved",
          icon: <CheckCircle2 className="h-3 w-3 mr-1 text-emerald-400" />,
          bgColor: "bg-emerald-500/10 border-emerald-500/30 text-emerald-400",
        };
      case "LISTED":
        return {
          label: "Status: Listed ✓ Visible in Marketplace",
          icon: <ShoppingBag className="h-3 w-3 mr-1 text-green-400" />,
          bgColor: "bg-green-500/15 border-green-500/40 text-green-300 font-bold",
        };
      case "PARTIALLY_SOLD":
        return {
          label: "Partially Sold",
          icon: <PackageCheck className="h-3 w-3 mr-1 text-cyan-400" />,
          bgColor: "bg-cyan-500/10 border-cyan-500/30 text-cyan-300",
        };
      case "SOLD_OUT":
        return {
          label: "Sold Out",
          icon: <PackageCheck className="h-3 w-3 mr-1 text-purple-400" />,
          bgColor: "bg-purple-500/10 border-purple-500/30 text-purple-300",
        };
      case "REJECTED":
        return {
          label: "Rejected",
          icon: <AlertCircle className="h-3 w-3 mr-1 text-rose-400" />,
          bgColor: "bg-rose-500/10 border-rose-500/30 text-rose-300",
        };
      case "EXPIRED":
        return {
          label: "Expired",
          icon: <TimerOff className="h-3 w-3 mr-1 text-zinc-400" />,
          bgColor: "bg-zinc-800/60 border-zinc-700 text-zinc-400",
        };
      case "ARCHIVED":
      default:
        return {
          label: "Archived",
          icon: <Archive className="h-3 w-3 mr-1 text-zinc-400" />,
          bgColor: "bg-zinc-800/60 border-zinc-700 text-zinc-400",
        };
    }
  };

  const config = getBadgeConfig();

  return (
    <div className={cn("inline-flex flex-col gap-1", className)}>
      <Badge
        variant="outline"
        className={cn(
          "inline-flex items-center px-2.5 py-0.5 text-xs font-medium rounded-full border shadow-sm transition-all",
          config.bgColor
        )}
      >
        {config.icon}
        <span>{config.label}</span>
      </Badge>
      {showNotesInline && notes && (
        <div className="text-xs text-rose-300/90 bg-rose-500/10 border border-rose-500/20 rounded p-1.5 mt-1">
          <span className="font-semibold text-rose-200">Review Note:</span> {notes}
        </div>
      )}
    </div>
  );
};
