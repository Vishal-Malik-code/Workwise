import { apiClient } from "@/lib/api-client";
import type { Notification, PaginatedResult, PaginationQuery } from "@/types/api";

export interface ListNotificationsQuery extends PaginationQuery {
  unreadOnly?: boolean;
}

export const notificationsApi = {
  list: (query: ListNotificationsQuery = {}) =>
    apiClient.get<PaginatedResult<Notification>>("/notifications", { query }),
  markAsRead: (id: string) => apiClient.patch<{ notification: Notification }>(`/notifications/${id}/read`),
  markAllAsRead: (workspaceId?: string) =>
    apiClient.patch<undefined>("/notifications/read-all", undefined, {
      query: workspaceId ? { workspaceId } : undefined,
    }),
};
