import type { HTMLAttributes } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { TaskPriority, TaskStatus } from "@/types/api";

const TONE_VARIANT = {
  neutral: "default",
  info: "info",
  accent: "accent",
  warning: "warning",
  orange: "orange",
  danger: "danger",
  success: "success",
} as const;

export type StatusBadgeTone = keyof typeof TONE_VARIANT;

/** Segment fill color for each tone, used by SegmentedProgressBar to stay in sync with StatusBadge. */
export const TONE_FILL_CLASS: Record<StatusBadgeTone, string> = {
  neutral: "bg-slate-400",
  info: "bg-blue-500",
  accent: "bg-indigo-500",
  warning: "bg-amber-500",
  orange: "bg-orange-500",
  danger: "bg-rose-500",
  success: "bg-emerald-500",
};

/** Single tone system shared by every badge/bar that renders a task priority or status. */
export const PRIORITY_TONE: Record<TaskPriority, StatusBadgeTone> = {
  LOW: "neutral",
  MEDIUM: "warning",
  HIGH: "orange",
  URGENT: "danger",
};

export const STATUS_TONE: Record<TaskStatus, StatusBadgeTone> = {
  BACKLOG: "neutral",
  TODO: "info",
  IN_PROGRESS: "accent",
  BLOCKED: "orange",
  DONE: "success",
};

export interface StatusBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: StatusBadgeTone;
}

export function StatusBadge({ tone = "neutral", className, ...props }: StatusBadgeProps) {
  return <Badge variant={TONE_VARIANT[tone]} className={cn(className)} {...props} />;
}
