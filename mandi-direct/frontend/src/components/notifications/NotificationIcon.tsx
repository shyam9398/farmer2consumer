import React from "react";
import {
  Bell,
  CheckCircle2,
  CreditCard,
  LineChart,
  Package,
  ShieldCheck,
  Sparkles,
  Sprout,
  TrendingUp,
  Truck,
  UserCheck,
  Wallet,
} from "lucide-react";
import { NotificationType } from "@/types/notification";

interface NotificationIconProps {
  type: NotificationType;
  className?: string;
  size?: number;
}

export const NotificationIcon: React.FC<NotificationIconProps> = ({
  type,
  className = "w-4 h-4",
  size,
}) => {
  switch (type) {
    case "ORDER":
      return <Package className={className} size={size} />;
    case "VERIFICATION":
      return <CheckCircle2 className={className} size={size} />;
    case "PRODUCE":
      return <Sprout className={className} size={size} />;
    case "LOGISTICS":
      return <Truck className={className} size={size} />;
    case "PAYMENT":
      return <CreditCard className={className} size={size} />;
    case "PAYOUT":
      return <Wallet className={className} size={size} />;
    case "MATCHING":
      return <Sparkles className={className} size={size} />;
    case "PRICE_INTELLIGENCE":
      return <TrendingUp className={className} size={size} />;
    case "DEMAND_INTELLIGENCE":
      return <LineChart className={className} size={size} />;
    case "AUTH":
      return <ShieldCheck className={className} size={size} />;
    case "PROFILE":
      return <UserCheck className={className} size={size} />;
    case "SYSTEM":
    default:
      return <Bell className={className} size={size} />;
  }
};

export const getNotificationTypeColor = (type: NotificationType): { bg: string; text: string; border: string } => {
  switch (type) {
    case "ORDER":
      return { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/20" };
    case "VERIFICATION":
      return { bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/20" };
    case "PRODUCE":
      return { bg: "bg-teal-500/10", text: "text-teal-400", border: "border-teal-500/20" };
    case "LOGISTICS":
      return { bg: "bg-purple-500/10", text: "text-purple-400", border: "border-purple-500/20" };
    case "PAYMENT":
      return { bg: "bg-indigo-500/10", text: "text-indigo-400", border: "border-indigo-500/20" };
    case "PAYOUT":
      return { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/20" };
    case "MATCHING":
      return { bg: "bg-fuchsia-500/10", text: "text-fuchsia-400", border: "border-fuchsia-500/20" };
    case "PRICE_INTELLIGENCE":
      return { bg: "bg-cyan-500/10", text: "text-cyan-400", border: "border-cyan-500/20" };
    case "DEMAND_INTELLIGENCE":
      return { bg: "bg-sky-500/10", text: "text-sky-400", border: "border-sky-500/20" };
    case "AUTH":
    case "PROFILE":
      return { bg: "bg-violet-500/10", text: "text-violet-400", border: "border-violet-500/20" };
    case "SYSTEM":
    default:
      return { bg: "bg-orange-500/10", text: "text-orange-400", border: "border-orange-500/20" };
  }
};
