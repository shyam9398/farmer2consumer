import React from "react";
import { useNavigate } from "react-router-dom";
import { Check } from "lucide-react";
import { NotificationItemData } from "@/types/notification";
import { useMarkNotificationRead } from "@/hooks/useNotifications";
import { NotificationIcon, getNotificationTypeColor } from "./NotificationIcon";

interface NotificationItemProps {
  notification: NotificationItemData;
  onClosePopover?: () => void;
}

export const formatRelativeTime = (isoString: string): string => {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHours = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSec < 45) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
};

export const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onClosePopover,
}) => {
  const navigate = useNavigate();
  const markReadMutation = useMarkNotificationRead();
  const colors = getNotificationTypeColor(notification.type);

  const handleClick = () => {
    if (!notification.is_read) {
      markReadMutation.mutate(notification.id);
    }
    if (notification.action_url) {
      if (onClosePopover) onClosePopover();
      navigate(notification.action_url);
    }
  };

  const handleQuickMarkRead = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!notification.is_read) {
      markReadMutation.mutate(notification.id);
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`group relative flex items-start gap-3.5 p-3.5 rounded-lg border transition-all cursor-pointer ${
        notification.is_read
          ? "bg-secondary/10 border-border/40 hover:bg-secondary/20 opacity-80 hover:opacity-100"
          : "bg-secondary/30 border-emerald-500/20 hover:bg-secondary/40 shadow-sm"
      }`}
    >
      {/* Category Icon */}
      <div
        className={`shrink-0 w-9 h-9 rounded-lg flex items-center justify-center border ${colors.bg} ${colors.text} ${colors.border}`}
      >
        <NotificationIcon type={notification.type} className="w-4 h-4" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pr-6">
        <div className="flex items-center gap-2 mb-0.5">
          <h4 className="text-xs font-semibold text-slate-100 truncate">
            {notification.title}
          </h4>
          <span className="text-[10px] text-muted-foreground shrink-0 font-medium">
            {formatRelativeTime(notification.created_at)}
          </span>
        </div>
        <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
          {notification.message}
        </p>
      </div>

      {/* Read / Unread Status Indicator & Quick Action */}
      <div className="absolute right-3 top-3 flex items-center gap-1.5">
        {!notification.is_read ? (
          <>
            <button
              onClick={handleQuickMarkRead}
              title="Mark as read"
              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-secondary/60 text-muted-foreground hover:text-slate-200"
            >
              <Check className="w-3.5 h-3.5" />
            </button>
            <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0 shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
          </>
        ) : null}
      </div>
    </div>
  );
};
