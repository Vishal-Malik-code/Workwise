import {
  pgTable,
  pgEnum,
  uuid,
  varchar,
  text,
  jsonb,
  timestamp,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { users, workspaces } from "./schema.js";

export const proposalStatusEnum = pgEnum("proposal_status", [
  "PENDING",
  "APPROVED",
  "REJECTED",
]);

export const proposalActionEnum = pgEnum("proposal_action", [
  "CREATE_TASK",
  "UPDATE_TASK",
  "DELETE_TASK",
  "CREATE_PROJECT",
]);

// Pulse (the AI assistant) never writes to domain tables directly. Every
// mutation it wants to make is captured here as a pending proposal; a human
// with sufficient RBAC permission must approve it before it is applied.
export const aiActionProposals = pgTable("ai_action_proposals", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
  requestedById: uuid("requested_by_id").notNull().references(() => users.id),
  action: proposalActionEnum("action").notNull(),
  payload: jsonb("payload").notNull(),
  summary: text("summary").notNull(),
  status: proposalStatusEnum("status").notNull().default("PENDING"),
  reviewedById: uuid("reviewed_by_id").references(() => users.id),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
  actorId: uuid("actor_id").references(() => users.id, { onDelete: "set null" }),
  action: varchar("action", { length: 80 }).notNull(),
  targetType: varchar("target_type", { length: 40 }).notNull(),
  targetId: uuid("target_id"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const aiActionProposalsRelations = relations(aiActionProposals, ({ one }) => ({
  workspace: one(workspaces, { fields: [aiActionProposals.workspaceId], references: [workspaces.id] }),
  requestedBy: one(users, { fields: [aiActionProposals.requestedById], references: [users.id] }),
  reviewedBy: one(users, { fields: [aiActionProposals.reviewedById], references: [users.id] }),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  workspace: one(workspaces, { fields: [auditLogs.workspaceId], references: [workspaces.id] }),
  actor: one(users, { fields: [auditLogs.actorId], references: [users.id] }),
}));
