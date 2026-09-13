import React from "react";
import { BellOff } from "lucide-react";

interface NotificationEmptyStateProps {
  title?: string;
  description?: string;
}

export const NotificationEmptyState: React.FC<NotificationEmptyStateProps> = ({
  title = "You're all caught up",
  description = "You don't have any notifications right now.",
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <div className="w-12 h-12 rounded-full bg-secondary/50 border border-border/50 flex items-center justify-center text-muted-foreground mb-3">
        <BellOff className="w-6 h-6 text-slate-400" />
      </div>
      <h4 className="text-sm font-semibold text-slate-200">{title}</h4>
      <p className="text-xs text-muted-foreground mt-1 max-w-[240px]">{description}</p>
    </div>
  );
};
