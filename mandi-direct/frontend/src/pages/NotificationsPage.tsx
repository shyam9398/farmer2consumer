import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  CheckCheck,
  ChevronLeft,
  ChevronRight,
  Filter,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  useNotifications,
  useMarkAllNotificationsRead,
} from "@/hooks/useNotifications";
import { NotificationType } from "@/types/notification";
import { NotificationItem } from "@/components/notifications/NotificationItem";
import { NotificationEmptyState } from "@/components/notifications/NotificationEmptyState";

type TabOption = "ALL" | "UNREAD";

interface CategoryFilterOption {
  label: string;
  value?: NotificationType;
}

const CATEGORY_FILTERS: CategoryFilterOption[] = [
  { label: "All Types" },
  { label: "Orders", value: "ORDER" },
  { label: "Verification", value: "VERIFICATION" },
  { label: "Produce", value: "PRODUCE" },
  { label: "Logistics", value: "LOGISTICS" },
  { label: "Payments", value: "PAYMENT" },
  { label: "Payouts", value: "PAYOUT" },
  { label: "Matching", value: "MATCHING" },
  { label: "Intelligence", value: "PRICE_INTELLIGENCE" },
  { label: "System", value: "SYSTEM" },
];

export const NotificationsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabOption>("ALL");
  const [selectedType, setSelectedType] = useState<NotificationType | undefined>(undefined);
  const [page, setPage] = useState<number>(1);
  const pageSize = 15;

  const { data, isLoading } = useNotifications({
    page,
    page_size: pageSize,
    unread_only: activeTab === "UNREAD",
    type: selectedType,
  });

  const markAllMutation = useMarkAllNotificationsRead();

  const handleTabChange = (tab: TabOption) => {
    setActiveTab(tab);
    setPage(1);
  };

  const handleTypeSelect = (type?: NotificationType) => {
    setSelectedType(type);
    setPage(1);
  };

  const items = data?.items || [];
  const total = data?.total || 0;
  const totalPages = data?.total_pages || 1;
  const unreadCount = data?.unread_count || 0;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/50">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-white">Notifications</h1>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                {unreadCount} unread
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Real-time business updates, order statuses, and trade communications across Mandi Direct.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => markAllMutation.mutate()}
              disabled={markAllMutation.isPending}
              className="h-8 gap-1.5 text-xs border-border/60 hover:border-emerald-500/40 text-slate-200 hover:text-emerald-400"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>Mark all as read</span>
            </Button>
          )}
          <Link to="/settings/notifications">
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 text-xs border-border/60 hover:border-border text-slate-300"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Preferences</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Filter Tabs & Category Pills */}
      <div className="space-y-3">
        {/* All vs Unread Tabs */}
        <div className="flex items-center gap-2 border-b border-border/40 pb-2">
          <button
            onClick={() => handleTabChange("ALL")}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
              activeTab === "ALL"
                ? "bg-secondary text-white shadow-sm border border-border/60"
                : "text-muted-foreground hover:text-white"
            }`}
          >
            All Notifications
          </button>
          <button
            onClick={() => handleTabChange("UNREAD")}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${
              activeTab === "UNREAD"
                ? "bg-secondary text-white shadow-sm border border-border/60"
                : "text-muted-foreground hover:text-white"
            }`}
          >
            <span>Unread</span>
            {unreadCount > 0 && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            )}
          </button>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <Filter className="w-3 h-3 text-muted-foreground shrink-0 ml-1 mr-1" />
          {CATEGORY_FILTERS.map((cat) => {
            const isSelected = selectedType === cat.value;
            return (
              <button
                key={cat.label}
                onClick={() => handleTypeSelect(cat.value)}
                className={`px-2.5 py-1 rounded-full whitespace-nowrap text-[11px] font-medium transition-all ${
                  isSelected
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                    : "bg-secondary/30 text-muted-foreground hover:text-slate-200 border border-transparent hover:border-border/40"
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Notification List Body */}
      <div className="space-y-2">
        {isLoading ? (
          <div className="space-y-2 py-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-16 rounded-lg bg-secondary/20 animate-pulse" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-xl border border-border/50 bg-secondary/10 py-12">
            <NotificationEmptyState
              title={
                activeTab === "UNREAD"
                  ? "You're all caught up"
                  : "No notifications found"
              }
              description={
                activeTab === "UNREAD"
                  ? "You don't have any unread notifications."
                  : "No notifications match your current category filter."
              }
            />
          </div>
        ) : (
          items.map((notification) => (
            <NotificationItem key={notification.id} notification={notification} />
          ))
        )}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="pt-4 flex items-center justify-between border-t border-border/40 text-xs">
          <span className="text-muted-foreground">
            Showing {(page - 1) * pageSize + 1}–
            {Math.min(page * pageSize, total)} of {total} notifications
          </span>

          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="h-8 px-2.5 text-xs gap-1 border-border/50"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Previous</span>
            </Button>
            <span className="px-2 font-medium text-slate-300">
              {page} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="h-8 px-2.5 text-xs gap-1 border-border/50"
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
export default NotificationsPage;
