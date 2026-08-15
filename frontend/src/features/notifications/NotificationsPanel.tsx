"use client";

import { Bell, Check } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/lib/format";
import type { Notification, NotificationType } from "@/types/api";
import { useMarkAllNotificationsRead, useMarkNotificationRead, useNotifications } from "./useNotifications";

const NOTIFICATION_COPY: Record<NotificationType, string> = {
  TASK_ASSIGNED: "assigned you a task",
  COMMENT_MENTION: "mentioned you in a comment",
  TASK_STATUS_CHANGED: "changed the status of a task you're assigned to",
  COMMENT_ADDED: "commented on a task you're assigned to",
  MEMBER_INVITED: "invited a new member",
  PROJECT_UPDATED: "updated a project",
};

function describe(notification: Notification): string {
  const payload = notification.payload as { taskTitle?: string };
  const base = NOTIFICATION_COPY[notification.type] ?? "sent a notification";
  return payload.taskTitle ? `${base}: "${payload.taskTitle}"` : base;
}

function notificationHref(notification: Notification): string {
  // Notification payloads only carry taskId/commentId, not the projectId
  // needed for a deep link into the task detail route, so land on the
  // workspace's project list for now.
  return `/dashboard/${notification.workspaceId}`;
}

function NotificationRow({ notification }: { notification: Notification }) {
  const markRead = useMarkNotificationRead();
  const unread = !notification.readAt;

  return (
    <div
      className={cn(
        "flex items-start gap-2 rounded-md px-2 py-2 text-sm transition-colors",
        unread ? "bg-accent/10" : "hover:bg-white/5",
      )}
    >
      <Link href={notificationHref(notification)} className="min-w-0 flex-1">
        <p className={cn("truncate", unread ? "font-medium text-foreground" : "text-muted")}>{describe(notification)}</p>
        <p className="mt-0.5 text-xs text-muted/70">{formatRelativeTime(notification.createdAt)}</p>
      </Link>
      {unread && (
        <button
          type="button"
          title="Mark as read"
          onClick={() => markRead.mutate(notification.id)}
          disabled={markRead.isPending}
          className="mt-0.5 shrink-0 rounded-md p-1 text-muted transition-colors hover:bg-white/10 hover:text-foreground disabled:opacity-50"
        >
          <Check className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

export function NotificationsPanel() {
  const { data, isLoading } = useNotifications({ limit: 20 });
  const markAllRead = useMarkAllNotificationsRead();

  const notifications = data?.items ?? [];
  const unreadCount = notifications.filter((n) => !n.readAt).length;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-semibold text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-2">
        <div className="mb-1 flex items-center justify-between px-1">
          <span className="text-sm font-semibold">Notifications</span>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto px-1.5 py-0.5 text-xs"
              onClick={() => markAllRead.mutate(undefined)}
              disabled={markAllRead.isPending}
            >
              Mark all read
            </Button>
          )}
        </div>
        <div className="max-h-96 space-y-0.5 overflow-y-auto">
          {isLoading && (
            <div className="space-y-2 p-1">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          )}
          {!isLoading && notifications.length === 0 && (
            <p className="px-1 py-6 text-center text-xs text-muted">You're all caught up.</p>
          )}
          {notifications.map((notification) => (
            <NotificationRow key={notification.id} notification={notification} />
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
