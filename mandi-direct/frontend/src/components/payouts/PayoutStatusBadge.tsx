import React from "react";
import { Badge } from "@/components/ui/badge";
import { PayoutStatus } from "@/types/payout";
import { CheckCircle2, Clock, Loader2, XCircle } from "lucide-react";

interface PayoutStatusBadgeProps {
  status: PayoutStatus | string;
}

export const PayoutStatusBadge: React.FC<PayoutStatusBadgeProps> = ({ status }) => {
  switch (status) {
    case "COMPLETED":
      return (
        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3" />
          <span>COMPLETED</span>
        </Badge>
      );
    case "PROCESSING":
      return (
        <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/30 flex items-center gap-1">
          <Loader2 className="w-3 h-3 animate-spin" />
          <span>PROCESSING</span>
        </Badge>
      );
    case "PENDING":
      return (
        <Badge variant="outline" className="bg-amber-500/10 text-amber-400 border-amber-500/30 flex items-center gap-1">
          <Clock className="w-3 h-3" />
          <span>PENDING</span>
        </Badge>
      );
    case "FAILED":
    case "CANCELLED":
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
