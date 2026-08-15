// Shared entity + response types matching backend/src/db/schema/*.ts and the
// {data}/{error} envelope produced by backend/src/middlewares/envelope.middleware.ts.

export type WorkspaceRole = "OWNER" | "ADMIN" | "MANAGER" | "MEMBER" | "VIEWER";

export type TaskStatus = "BACKLOG" | "TODO" | "IN_PROGRESS" | "BLOCKED" | "DONE";
export type TaskPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export type InviteStatus = "PENDING" | "ACCEPTED" | "DECLINED" | "EXPIRED";

export type ProposalAction = "CREATE_TASK" | "UPDATE_TASK" | "ADD_COMMENT";
export type ProposalStatus = "PENDING" | "APPROVED" | "REJECTED" | "EXPIRED" | "EXECUTED" | "FAILED";

export type NotificationType =
  | "TASK_ASSIGNED"
  | "COMMENT_MENTION"
  | "TASK_STATUS_CHANGED"
  | "COMMENT_ADDED"
  | "MEMBER_INVITED"
  | "PROJECT_UPDATED";

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

/** Shape returned by GET /workspaces — a workspace with the caller's role folded in. */
export interface WorkspaceWithRole extends Workspace {
  role: WorkspaceRole;
}

export interface WorkspaceMember {
  id: string;
  role: WorkspaceRole;
  userId: string;
  name: string;
  email: string;
}

export interface Project {
  id: string;
  workspaceId: string;
  name: string;
  description: string | null;
  createdById: string;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  projectId: string;
  workspaceId: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId: string | null;
  createdById: string;
  position: number;
  dueDate: string | null;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  id: string;
  taskId: string;
  authorId: string;
  body: string;
  createdAt: string;
  updatedAt: string;
}

export interface Label {
  id: string;
  workspaceId: string;
  name: string;
  color: string;
  createdAt: string;
}

export interface TaskLabel {
  id: string;
  taskId: string;
  labelId: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  workspaceId: string;
  type: NotificationType;
  payload: Record<string, unknown>;
  readAt: string | null;
  createdAt: string;
}

export interface WorkspaceInvite {
  id: string;
  workspaceId: string;
  email: string;
  role: Exclude<WorkspaceRole, "OWNER">;
  invitedById: string;
  status: InviteStatus;
  expiresAt: string;
  createdAt: string;
}

export interface AiActionProposal {
  id: string;
  workspaceId: string;
  requestedById: string;
  action: ProposalAction;
  payload: Record<string, unknown>;
  summary: string;
  status: ProposalStatus;
  reviewedById: string | null;
  reviewedAt: string | null;
  expiresAt: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  workspaceId: string;
  actorId: string | null;
  action: string;
  targetType: string;
  targetId: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export interface PaginatedResult<T> {
  items: T[];
  page: number;
  limit: number;
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
}

// ---- Realtime event payloads (backend/src/utils/socketEvents.ts) ----

export interface WorkspaceChangedEvent {
  resource: string;
  action: string;
  workspaceId: string;
  [key: string]: unknown;
}

export interface NotificationsChangedEvent {
  resource: string;
  action: string;
  userId: string;
  [key: string]: unknown;
}
