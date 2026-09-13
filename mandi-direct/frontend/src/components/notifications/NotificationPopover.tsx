import React, { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { CheckCheck, Settings, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  useNotifications,
  useMarkAllNotificationsRead,
} from "@/hooks/useNotifications";
import { NotificationItem } from "./NotificationItem";
import { NotificationEmptyState } from "./NotificationEmptyState";

interface NotificationPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  unreadCount: number;
}

export const NotificationPopover: React.FC<NotificationPopoverProps> = ({
  isOpen,
  onClose,
  unreadCount,
}) => {
  const popoverRef = useRef<HTMLDivElement>(null);
  const { data, isLoading } = useNotifications({ page: 1, page_size: 5 });
  const markAllMutation = useMarkAllNotificationsRead();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const items = data?.items || [];

  return (
    <div
      ref={popoverRef}
      className="absolute right-0 top-full mt-2 w-80 sm:w-96 rounded-xl border border-border/70 bg-slate-950/95 backdrop-blur-xl shadow-2xl z-50 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150"
    >
      {/* Popover Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/50 bg-secondary/20">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-white">Notifications</h3>
          {unreadCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              {unreadCount} new
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => markAllMutation.mutate()}
              disabled={markAllMutation.isPending}
              className="h-7 px-2 text-[11px] text-muted-foreground hover:text-white flex items-center gap-1"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>Mark read</span>
            </Button>
          )}
          <Link
            to="/settings/notifications"
            onClick={onClose}
            className="p-1 rounded-md text-muted-foreground hover:text-white hover:bg-secondary/40 transition-colors"
            title="Notification Preferences"
          >
            <Settings className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Popover Items List */}
      <div className="max-h-[380px] overflow-y-auto p-2 space-y-1.5">
        {isLoading ? (
          <div className="p-4 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 rounded-lg bg-secondary/30 animate-pulse" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <NotificationEmptyState
            title="No notifications yet"
            description="You will be notified when orders, verification, or logistics updates occur."
          />
        ) : (
          items.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onClosePopover={onClose}
            />
          ))
        )}
      </div>

      {/* Popover Footer */}
      <div className="p-2 border-t border-border/50 bg-secondary/10 flex items-center justify-between text-xs">
        <Link
          to="/notifications"
          onClick={onClose}
          className="w-full flex items-center justify-center gap-1.5 py-1.5 font-medium text-emerald-400 hover:text-emerald-300 transition-colors"
        >
          <span>View all notifications</span>
          <ExternalLink className="w-3 h-3" />
        </Link>
      </div>
    </div>
  );
};
