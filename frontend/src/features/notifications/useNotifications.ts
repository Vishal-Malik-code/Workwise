"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { notificationsApi, type ListNotificationsQuery } from "./Notifications.api";

// Matches the invalidation in useWorkspaceSocket.ts's `notifications:changed`
// handler, which invalidates every query keyed under "notifications".
const NOTIFICATIONS_KEY = ["notifications"] as const;

export function useNotifications(query: ListNotificationsQuery = {}) {
  return useQuery({
    queryKey: [...NOTIFICATIONS_KEY, query],
    queryFn: () => notificationsApi.list(query),
    placeholderData: (prev) => prev,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationsApi.markAsRead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEY }),
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (workspaceId?: string) => notificationsApi.markAllAsRead(workspaceId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEY }),
  });
}
