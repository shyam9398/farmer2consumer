import React from "react";
import { CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { VerificationStatus } from "@/types/farmer";
import { cn } from "@/lib/utils";

interface VerificationBadgeProps {
  status?: VerificationStatus;
  notes?: string | null;
  className?: string;
  showNotesInline?: boolean;
}

export const VerificationBadge: React.FC<VerificationBadgeProps> = ({
  status = "PENDING",
  notes,
  className,
  showNotesInline = false,
}) => {
  const getBadgeConfig = () => {
    switch (status) {
      case "VERIFIED":
        return {
          variant: "success" as const,
          label: "Verified Farmer",
          icon: <CheckCircle2 className="h-3.5 w-3.5 mr-1 text-emerald-400" />,
          bgColor: "bg-emerald-500/10 border-emerald-500/30 text-emerald-400",
        };
      case "REJECTED":
        return {
          variant: "destructive" as const,
          label: "Verification Rejected",
          icon: <AlertCircle className="h-3.5 w-3.5 mr-1 text-rose-400" />,
          bgColor: "bg-rose-500/10 border-rose-500/30 text-rose-400",
        };
      case "PENDING":
      default:
        return {
          variant: "outline" as const,
          label: "Pending Verification",
          icon: <Clock className="h-3.5 w-3.5 mr-1 text-amber-400" />,
          bgColor: "bg-amber-500/10 border-amber-500/30 text-amber-400",
        };
    }
  };

  const config = getBadgeConfig();

  return (
    <div className={cn("inline-flex flex-col gap-1", className)}>
      <Badge
        variant={config.variant}
        className={cn(
          "inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full border shadow-sm transition-all",
          config.bgColor
        )}
      >
        {config.icon}
        <span>{config.label}</span>
      </Badge>
      {showNotesInline && notes && (
        <p className="text-xs text-slate-400 mt-0.5">
          <span className="font-semibold text-slate-300">Admin Note:</span> {notes}
        </p>
      )}
    </div>
  );
};
