import React from "react";
import { Badge } from "@/components/ui/badge";
import { EarningStatus } from "@/types/earnings";
import { CheckCircle2, Clock, DollarSign, XCircle } from "lucide-react";

interface EarningStatusBadgeProps {
  status: EarningStatus | string;
}

export const EarningStatusBadge: React.FC<EarningStatusBadgeProps> = ({ status }) => {
  switch (status) {
    case "PAID":
      return (
        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3" />
          <span>PAID</span>
        </Badge>
      );
    case "AVAILABLE":
      return (
        <Badge variant="outline" className="bg-teal-500/10 text-teal-300 border-teal-500/30 flex items-center gap-1">
          <DollarSign className="w-3 h-3" />
          <span>AVAILABLE</span>
        </Badge>
      );
    case "PENDING_SETTLEMENT":
    case "EXPECTED":
      return (
        <Badge variant="outline" className="bg-amber-500/10 text-amber-400 border-amber-500/30 flex items-center gap-1">
          <Clock className="w-3 h-3 animate-spin" />
          <span>PENDING SETTLEMENT</span>
        </Badge>
      );
    case "CANCELLED":
    case "REFUNDED":
      return (
        <Badge variant="outline" className="bg-rose-500/10 text-rose-400 border-rose-500/30 flex items-center gap-1">
          <XCircle className="w-3 h-3" />
          <span>{status}</span>
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className="bg-slate-500/10 text-slate-400 border-slate-500/30">
          {status}
        </Badge>
      );
  }
};
