export type ResolutionKind = "project" | "task" | "member";

export interface RiskItem {
  type:
    | "OVERDUE_TASK"
    | "BLOCKED_TASK"
    | "URGENT_UNASSIGNED"
    | "BACKLOG_DUE_SOON"
    | "STALE_PROJECT"
    | "OVERLOADED_MEMBER";
  summary: string;
  targetType: "task" | "project" | "member";
  targetId: string;
  detail?: Record<string, unknown>;
}
