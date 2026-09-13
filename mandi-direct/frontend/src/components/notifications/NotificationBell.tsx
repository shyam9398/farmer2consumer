import React, { useState } from "react";
import { Bell } from "lucide-react";
import { useUnreadNotificationCount } from "@/hooks/useNotifications";
import { NotificationPopover } from "./NotificationPopover";

export const NotificationBell: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { data: unreadCount = 0 } = useUnreadNotificationCount();

  const togglePopover = () => {
    setIsOpen((prev) => !prev);
  };

  return (
    <div className="relative inline-block">
      <button
        onClick={togglePopover}
        type="button"
        aria-label={`Notifications (${unreadCount} unread)`}
        className={`relative flex items-center justify-center w-8 h-8 rounded-lg border transition-all ${
          isOpen
            ? "bg-secondary text-white border-emerald-500/50 shadow-[0_0_12px_rgba(16,185,129,0.2)]"
            : "border-border/50 bg-secondary/20 text-slate-300 hover:text-white hover:bg-secondary/40 hover:border-border/80"
        }`}
      >
        <Bell className="w-4 h-4 transition-transform active:scale-95" />

        {/* Unread count badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-black text-slate-950 shadow-md animate-in zoom-in-50">
            {unreadCount > 99 ? "99+" : unreadCount}
            <span className="absolute -inset-0.5 rounded-full bg-emerald-400/40 animate-ping" />
          </span>
        )}
      </button>

      {/* Popover Dropdown */}
      <NotificationPopover
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        unreadCount={unreadCount}
      />
    </div>
  );
};
