"use client";

import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Calendar, Copy, MessageSquare, User } from "lucide-react";
import { Card } from "@/components/ui/card";
import { StatusBadge, PRIORITY_TONE } from "@/components/shared/StatusBadge";
import { cn } from "@/lib/utils";
import { useDuplicateTask } from "./useTasks";
import { useMembers } from "@/features/members/useMembers";
import type { Task } from "@/types/api";

export interface TaskCardProps {
  task: Task;
  workspaceId: string;
  projectId: string;
  /** Opens the task detail modal for this task. */
  onOpen?: (taskId: string) => void;
}

export function TaskCard({ task, workspaceId, projectId, onOpen }: TaskCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: task.id });
  const duplicateTask = useDuplicateTask(workspaceId, projectId);
  const { data: members } = useMembers(workspaceId);

  const assigneeName = task.assigneeId ? members?.find((m) => m.userId === task.assigneeId)?.name ?? "Unassigned" : "Unassigned";

  const style = transform ? { transform: CSS.Translate.toString(transform) } : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn("touch-none", isDragging && "z-10 opacity-70")}
    >
      <Card
        role="button"
        tabIndex={0}
        onClick={() => onOpen?.(task.id)}
        onKeyDown={(e) => {
          if (e.key === "Enter") onOpen?.(task.id);
        }}
        className="group relative mb-3 cursor-grab p-3 transition-colors hover:border-accent/50 active:cursor-grabbing"
      >
        <button
          type="button"
          aria-label="Duplicate task"
          title="Duplicate task"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            duplicateTask.mutate(task.id);
          }}
          className="absolute right-2 top-2 rounded-md p-1 text-muted opacity-0 transition-opacity hover:bg-black/10 hover:text-foreground group-hover:opacity-100"
        >
          <Copy className="h-3.5 w-3.5" />
        </button>

        <div className="mb-2 flex items-center justify-between pr-6">
          <StatusBadge tone={PRIORITY_TONE[task.priority]}>{task.priority}</StatusBadge>
          <span className="rounded bg-black/5 px-1.5 py-0.5 font-mono text-[10px] text-muted">
            #{task.id.slice(0, 6)}
          </span>
        </div>

        <p className="text-sm font-medium text-foreground">{task.title}</p>
        {task.description && <p className="mt-1 line-clamp-2 text-xs text-muted">{task.description}</p>}

        <div className="mt-3 flex flex-col gap-1.5 border-t border-border pt-2 text-xs text-muted">
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 shrink-0" />
            <span>{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "No due date"}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 shrink-0" />
              {assigneeName}
            </span>
            <span className="flex items-center gap-1 text-muted/70">
              <MessageSquare className="h-3.5 w-3.5" />
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
}
