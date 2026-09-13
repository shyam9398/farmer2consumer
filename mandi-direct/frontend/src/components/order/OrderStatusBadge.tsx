import React from "react";
import {
  Clock,
  CheckCircle2,
  Package,
  Truck,
  Check,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { OrderStatus } from "@/types/order";

interface OrderStatusBadgeProps {
  status: OrderStatus | string;
  className?: string;
}

export const OrderStatusBadge: React.FC<OrderStatusBadgeProps> = ({
  status,
  className = "",
}) => {
  switch (status?.toUpperCase()) {
    case "PENDING":
      return (
        <Badge
          variant="outline"
          className={`border-amber-500/40 text-amber-300 bg-amber-500/10 gap-1.5 font-medium ${className}`}
        >
          <Clock className="w-3 h-3 text-amber-400" />
          <span>Pending Confirmation</span>
        </Badge>
      );
    case "ACCEPTED":
      return (
        <Badge
          variant="outline"
          className={`border-emerald-500/40 text-emerald-300 bg-emerald-500/10 gap-1.5 font-medium ${className}`}
        >
          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
          <span>Accepted by Farmer</span>
        </Badge>
      );
    case "PREPARING":
      return (
        <Badge
          variant="outline"
          className={`border-blue-500/40 text-blue-300 bg-blue-500/10 gap-1.5 font-medium ${className}`}
        >
          <Package className="w-3 h-3 text-blue-400" />
          <span>Harvesting / Preparing</span>
        </Badge>
      );
    case "READY_FOR_PICKUP":
      return (
        <Badge
          variant="outline"
          className={`border-indigo-500/40 text-indigo-300 bg-indigo-500/10 gap-1.5 font-medium ${className}`}
        >
          <Package className="w-3 h-3 text-indigo-400" />
          <span>Ready for Pickup</span>
        </Badge>
      );
    case "PICKED_UP":
    case "OUT_FOR_DELIVERY":
      return (
        <Badge
          variant="outline"
          className={`border-cyan-500/40 text-cyan-300 bg-cyan-500/10 gap-1.5 font-medium ${className}`}
        >
          <Truck className="w-3 h-3 text-cyan-400 animate-pulse" />
          <span>Out for Delivery</span>
        </Badge>
      );
    case "DELIVERED":
      return (
        <Badge
          variant="outline"
          className={`border-emerald-500 text-emerald-400 bg-emerald-950/40 gap-1.5 font-bold ${className}`}
        >
          <Check className="w-3 h-3 text-emerald-400" />
          <span>Delivered</span>
        </Badge>
      );
    case "CANCELLED":
      return (
        <Badge
          variant="outline"
          className={`border-rose-500/40 text-rose-300 bg-rose-500/10 gap-1.5 font-medium ${className}`}
        >
          <XCircle className="w-3 h-3 text-rose-400" />
          <span>Cancelled</span>
        </Badge>
      );
    case "REJECTED":
      return (
        <Badge
          variant="outline"
          className={`border-slate-500/40 text-slate-300 bg-slate-800/40 gap-1.5 font-medium ${className}`}
        >
          <AlertCircle className="w-3 h-3 text-slate-400" />
          <span>Rejected by Farmer</span>
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className={`border-slate-600 text-slate-300 ${className}`}>
          <span>{status}</span>
        </Badge>
      );
  }
};
