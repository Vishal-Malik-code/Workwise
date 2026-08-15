import { relations } from "drizzle-orm";
import { users } from "./users.js";
import { workspaces, workspaceMembers } from "./workspaces.js";
import { projects } from "./projects.js";
import { tasks } from "./tasks.js";
import { comments } from "./comments.js";
import { labels, taskLabels } from "./labels.js";
import { notifications } from "./notifications.js";
import { workspaceInvites } from "./invites.js";
import { aiActionProposals } from "./assistant.js";
import { auditLogs } from "./audit.js";

export const usersRelations = relations(users, ({ many }) => ({
  ownedWorkspaces: many(workspaces),
  memberships: many(workspaceMembers),
}));

export const workspacesRelations = relations(workspaces, ({ one, many }) => ({
  owner: one(users, { fields: [workspaces.ownerId], references: [users.id] }),
  members: many(workspaceMembers),
  projects: many(projects),
  labels: many(labels),
  invites: many(workspaceInvites),
}));

export const workspaceMembersRelations = relations(workspaceMembers, ({ one }) => ({
  workspace: one(workspaces, { fields: [workspaceMembers.workspaceId], references: [workspaces.id] }),
  user: one(users, { fields: [workspaceMembers.userId], references: [users.id] }),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  workspace: one(workspaces, { fields: [projects.workspaceId], references: [workspaces.id] }),
  createdBy: one(users, { fields: [projects.createdById], references: [users.id] }),
  tasks: many(tasks),
}));

export const tasksRelations = relations(tasks, ({ one, many }) => ({
  project: one(projects, { fields: [tasks.projectId], references: [projects.id] }),
  workspace: one(workspaces, { fields: [tasks.workspaceId], references: [workspaces.id] }),
  assignee: one(users, { fields: [tasks.assigneeId], references: [users.id] }),
  createdBy: one(users, { fields: [tasks.createdById], references: [users.id] }),
  comments: many(comments),
  taskLabels: many(taskLabels),
}));

export const commentsRelations = relations(comments, ({ one }) => ({
  task: one(tasks, { fields: [comments.taskId], references: [tasks.id] }),
  author: one(users, { fields: [comments.authorId], references: [users.id] }),
}));

export const labelsRelations = relations(labels, ({ one, many }) => ({
  workspace: one(workspaces, { fields: [labels.workspaceId], references: [workspaces.id] }),
  taskLabels: many(taskLabels),
}));

export const taskLabelsRelations = relations(taskLabels, ({ one }) => ({
  task: one(tasks, { fields: [taskLabels.taskId], references: [tasks.id] }),
  label: one(labels, { fields: [taskLabels.labelId], references: [labels.id] }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, { fields: [notifications.userId], references: [users.id] }),
  workspace: one(workspaces, { fields: [notifications.workspaceId], references: [workspaces.id] }),
}));

export const workspaceInvitesRelations = relations(workspaceInvites, ({ one }) => ({
  workspace: one(workspaces, { fields: [workspaceInvites.workspaceId], references: [workspaces.id] }),
  invitedBy: one(users, { fields: [workspaceInvites.invitedById], references: [users.id] }),
}));

export const aiActionProposalsRelations = relations(aiActionProposals, ({ one }) => ({
  workspace: one(workspaces, { fields: [aiActionProposals.workspaceId], references: [workspaces.id] }),
  requestedBy: one(users, { fields: [aiActionProposals.requestedById], references: [users.id] }),
  reviewedBy: one(users, { fields: [aiActionProposals.reviewedById], references: [users.id] }),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  workspace: one(workspaces, { fields: [auditLogs.workspaceId], references: [workspaces.id] }),
  actor: one(users, { fields: [auditLogs.actorId], references: [users.id] }),
}));
