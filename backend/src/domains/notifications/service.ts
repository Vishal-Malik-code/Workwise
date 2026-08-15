import { and, desc, eq, isNull } from "drizzle-orm";
import { db, schema } from "../../db/index.js";
import type { DbClient } from "../../db/index.js";
import { AppError } from "../../utils/AppError.js";
import { getPagination, type PaginationInput } from "../../utils/pagination.js";
import { emitUserEvent } from "../../utils/socketEvents.js";

export type NotificationType =
  | "TASK_ASSIGNED"
  | "COMMENT_MENTION"
  | "TASK_STATUS_CHANGED"
  | "COMMENT_ADDED"
  | "MEMBER_INVITED"
  | "PROJECT_UPDATED";

export interface CreateNotificationInput {
  dbClient?: DbClient;
  userId: string;
  workspaceId: string;
  type: NotificationType;
  payload?: Record<string, unknown>;
}

// Inserts a notification row and pings the recipient's socket room. Callers
// in other domains should wrap this in try/catch — a notification failure
// must never break the mutation that triggered it.
export async function createNotification({
  dbClient = db,
  userId,
  workspaceId,
  type,
  payload = {},
}: CreateNotificationInput) {
  const [notification] = await dbClient
    .insert(schema.notifications)
    .values({ userId, workspaceId, type, payload })
    .returning();

  emitUserEvent(userId, "notification", "created", { notification });

  return notification;
}

export interface ListNotificationsOptions extends PaginationInput {
  unreadOnly?: boolean | string;
}

export async function listNotifications(userId: string, options: ListNotificationsOptions = {}) {
  const { limit, offset, page } = getPagination(options);
  const unreadOnly = options.unreadOnly === true || options.unreadOnly === "true";

  const conditions = [eq(schema.notifications.userId, userId)];
  if (unreadOnly) {
    conditions.push(isNull(schema.notifications.readAt));
  }

  const items = await db
    .select()
    .from(schema.notifications)
    .where(and(...conditions))
    .orderBy(desc(schema.notifications.createdAt))
    .limit(limit)
    .offset(offset);

  return { items, page, limit };
}

export async function markAsRead(notificationId: string, userId: string) {
  const [updated] = await db
    .update(schema.notifications)
    .set({ readAt: new Date() })
    .where(and(eq(schema.notifications.id, notificationId), eq(schema.notifications.userId, userId)))
    .returning();

  if (!updated) throw AppError.notFound("Notification not found");

  return updated;
}

export async function markAllAsRead(userId: string, workspaceId?: string) {
  const conditions = [eq(schema.notifications.userId, userId), isNull(schema.notifications.readAt)];
  if (workspaceId) {
    conditions.push(eq(schema.notifications.workspaceId, workspaceId));
  }

  await db
    .update(schema.notifications)
    .set({ readAt: new Date() })
    .where(and(...conditions));
}
