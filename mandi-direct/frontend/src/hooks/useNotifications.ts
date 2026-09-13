import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/axios";
import {
  NotificationFilterParams,
  NotificationItemData,
  NotificationListResponse,
  NotificationPreferences,
  NotificationPreferenceUpdate,
  UnreadNotificationCountResponse,
} from "@/types/notification";

export const NOTIFICATIONS_QUERY_KEY = ["notifications"] as const;
export const UNREAD_COUNT_QUERY_KEY = ["notifications", "unread-count"] as const;
export const NOTIFICATION_PREFERENCES_KEY = ["notifications", "preferences"] as const;

export const fetchNotifications = async (
  params?: NotificationFilterParams
): Promise<NotificationListResponse> => {
  const queryParams = new URLSearchParams();
  if (params?.page) queryParams.set("page", params.page.toString());
  if (params?.page_size) queryParams.set("page_size", params.page_size.toString());
  if (params?.unread_only) queryParams.set("unread_only", "true");
  if (params?.type) queryParams.set("type", params.type);

  const qs = queryParams.toString();
  const url = `/api/v1/notifications${qs ? `?${qs}` : ""}`;
  const res = await apiClient.get<NotificationListResponse>(url);
  return res.data;
};

export const fetchUnreadCount = async (): Promise<number> => {
  const res = await apiClient.get<UnreadNotificationCountResponse>(
    "/api/v1/notifications/unread-count"
  );
  return res.data.unread_count;
};

export const markNotificationRead = async (
  notificationId: string
): Promise<NotificationItemData> => {
  const res = await apiClient.patch<NotificationItemData>(
    `/api/v1/notifications/${notificationId}/read`
  );
  return res.data;
};

export const markAllNotificationsRead = async (): Promise<number> => {
  const res = await apiClient.patch<UnreadNotificationCountResponse>(
    "/api/v1/notifications/read-all"
  );
  return res.data.unread_count;
};

export const fetchNotificationPreferences = async (): Promise<NotificationPreferences> => {
  const res = await apiClient.get<NotificationPreferences>(
    "/api/v1/notification-preferences"
  );
  return res.data;
};

export const updateNotificationPreferences = async (
  payload: NotificationPreferenceUpdate
): Promise<NotificationPreferences> => {
  const res = await apiClient.put<NotificationPreferences>(
    "/api/v1/notification-preferences",
    payload
  );
  return res.data;
};

export const useNotifications = (params?: NotificationFilterParams) => {
  return useQuery({
    queryKey: [...NOTIFICATIONS_QUERY_KEY, params],
    queryFn: () => fetchNotifications(params),
    staleTime: 1000 * 15, // 15 seconds
  });
};

export const useUnreadNotificationCount = () => {
  return useQuery({
    queryKey: UNREAD_COUNT_QUERY_KEY,
    queryFn: fetchUnreadCount,
    staleTime: 1000 * 15,
    refetchInterval: 1000 * 30, // Background poll every 30 seconds
  });
};

export const useMarkNotificationRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => {
      // Invalidate notifications list and count
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: UNREAD_COUNT_QUERY_KEY });
    },
  });
};

export const useMarkAllNotificationsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY });
      queryClient.setQueryData(UNREAD_COUNT_QUERY_KEY, 0);
    },
  });
};

export const useNotificationPreferences = () => {
  return useQuery({
    queryKey: NOTIFICATION_PREFERENCES_KEY,
    queryFn: fetchNotificationPreferences,
    staleTime: 1000 * 60 * 5,
  });
};

export const useUpdateNotificationPreferences = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateNotificationPreferences,
    onSuccess: (updated) => {
      queryClient.setQueryData(NOTIFICATION_PREFERENCES_KEY, updated);
    },
  });
};
