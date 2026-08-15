import { pgTable, pgEnum, uuid, jsonb, timestamp } from "drizzle-orm/pg-core";
import { users } from "./users.js";
import { workspaces } from "./workspaces.js";

export const notificationTypeEnum = pgEnum("notification_type", [
  "TASK_ASSIGNED",
  "COMMENT_MENTION",
  "TASK_STATUS_CHANGED",
  "COMMENT_ADDED",
  "MEMBER_INVITED",
  "PROJECT_UPDATED",
]);

export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  workspaceId: uuid("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  type: notificationTypeEnum("type").notNull(),
  payload: jsonb("payload").notNull().default({}),
  readAt: timestamp("read_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
