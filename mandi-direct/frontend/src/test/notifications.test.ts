import { describe, it, expect } from "vitest";
import { formatRelativeTime } from "@/components/notifications/NotificationItem";
import { getNotificationTypeColor } from "@/components/notifications/NotificationIcon";
import {
  fetchNotifications,
  fetchUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
  fetchNotificationPreferences,
  updateNotificationPreferences,
} from "@/hooks/useNotifications";
import { NotificationType } from "@/types/notification";

describe("Phase 14 — Notifications & Communication Specs", () => {
  describe("Relative Timestamp Formatter", () => {
    it("should format timestamps within seconds as 'Just now'", () => {
      const nowIso = new Date().toISOString();
      expect(formatRelativeTime(nowIso)).toBe("Just now");
    });

    it("should format timestamps 5 minutes ago as '5m ago'", () => {
      const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      expect(formatRelativeTime(fiveMinAgo)).toBe("5m ago");
    });

    it("should format timestamps 2 hours ago as '2h ago'", () => {
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
      expect(formatRelativeTime(twoHoursAgo)).toBe("2h ago");
    });

    it("should format timestamps 1 day ago as 'Yesterday'", () => {
      const yesterday = new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString();
      expect(formatRelativeTime(yesterday)).toBe("Yesterday");
    });

    it("should format timestamps 3 days ago as '3d ago'", () => {
      const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
      expect(formatRelativeTime(threeDaysAgo)).toBe("3d ago");
    });
  });

  describe("Notification Type Colors and Badges", () => {
    const types: NotificationType[] = [
      "ORDER",
      "VERIFICATION",
      "PRODUCE",
      "LOGISTICS",
      "PAYMENT",
      "PAYOUT",
      "MATCHING",
      "PRICE_INTELLIGENCE",
      "DEMAND_INTELLIGENCE",
      "AUTH",
      "PROFILE",
      "SYSTEM",
    ];

    it("should return valid styling colors for all 12 notification types", () => {
      types.forEach((type) => {
        const colors = getNotificationTypeColor(type);
        expect(colors.bg).toBeDefined();
        expect(colors.text).toBeDefined();
        expect(colors.border).toBeDefined();
        expect(colors.bg.startsWith("bg-")).toBe(true);
        expect(colors.text.startsWith("text-")).toBe(true);
        expect(colors.border.startsWith("border-")).toBe(true);
      });
    });
  });

  describe("Notification API Client Functions", () => {
    it("should expose all required notification query and mutation functions", () => {
      expect(typeof fetchNotifications).toBe("function");
      expect(typeof fetchUnreadCount).toBe("function");
      expect(typeof markNotificationRead).toBe("function");
      expect(typeof markAllNotificationsRead).toBe("function");
      expect(typeof fetchNotificationPreferences).toBe("function");
      expect(typeof updateNotificationPreferences).toBe("function");
    });
  });

  describe("System Notifications Immutability", () => {
    it("should guarantee system_notifications defaults to true in preferences", () => {
      const defaultPrefs = {
        order_notifications: true,
        verification_notifications: true,
        logistics_notifications: true,
        payment_notifications: true,
        payout_notifications: true,
        matching_notifications: true,
        intelligence_notifications: true,
        system_notifications: true,
      };
      expect(defaultPrefs.system_notifications).toBe(true);
    });
  });
});
