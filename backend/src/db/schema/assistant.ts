import { pgTable, pgEnum, uuid, text, jsonb, timestamp } from "drizzle-orm/pg-core";
import { users } from "./users.js";
import { workspaces } from "./workspaces.js";

export const proposalStatusEnum = pgEnum("proposal_status", [
  "PENDING",
  "APPROVED",
  "REJECTED",
  "EXPIRED",
  "EXECUTED",
  "FAILED",
]);

export const proposalActionEnum = pgEnum("proposal_action", [
  "CREATE_TASK",
  "UPDATE_TASK",
  "ADD_COMMENT",
]);

// Pulse (the AI assistant) never writes to domain tables directly. Every
// mutation it wants to make is captured here as a pending proposal; a human
// with sufficient RBAC permission must approve it before it is applied.
export const aiActionProposals = pgTable("ai_action_proposals", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  requestedById: uuid("requested_by_id")
    .notNull()
    .references(() => users.id),
  action: proposalActionEnum("action").notNull(),
  payload: jsonb("payload").notNull(),
  summary: text("summary").notNull(),
  status: proposalStatusEnum("status").notNull().default("PENDING"),
  reviewedById: uuid("reviewed_by_id").references(() => users.id),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
