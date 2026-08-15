"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useDeleteTask, useDuplicateTask, useTask, useUpdateTask } from "@/features/tasks/useTasks";
import { useComments, useCreateComment, useDeleteComment } from "@/features/comments/useComments";
import { useAttachLabel, useLabels } from "@/features/labels/useLabels";
import { useMembers } from "@/features/members/useMembers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge, PRIORITY_TONE, STATUS_TONE } from "@/components/shared/StatusBadge";
import { ApiError } from "@/lib/api-client";
import { formatRelativeTime } from "@/lib/format";
import type { TaskPriority, TaskStatus } from "@/types/api";

const STATUSES: TaskStatus[] = ["BACKLOG", "TODO", "IN_PROGRESS", "BLOCKED", "DONE"];
const PRIORITIES: TaskPriority[] = ["LOW", "MEDIUM", "HIGH", "URGENT"];

export interface TaskDetailPanelProps {
  workspaceId: string;
  projectId: string;
  taskId: string;
  /** When rendered inside a modal, called after a destructive/close action so the caller can dismiss it. */
  onClose?: () => void;
}

/**
 * Two-column task detail: left column is the editable form (title,
 * description, status/priority, assignee, due date, labels); right column is
 * the comment/discussion thread. Shared by both the standalone task route and
 * the Kanban-board modal so there is exactly one implementation of the form.
 */
export function TaskDetailPanel({ workspaceId, projectId, taskId, onClose }: TaskDetailPanelProps) {
  const { data: task, isLoading } = useTask(workspaceId, projectId, taskId);
  const updateTask = useUpdateTask(workspaceId, projectId);
  const deleteTask = useDeleteTask(workspaceId, projectId);
  const duplicateTask = useDuplicateTask(workspaceId, projectId);
  const { data: members } = useMembers(workspaceId);
  const { data: labels } = useLabels(workspaceId);
  const attachLabel = useAttachLabel(workspaceId);

  const { data: comments, isLoading: commentsLoading } = useComments(workspaceId, projectId, taskId);
  const createComment = useCreateComment(workspaceId, projectId, taskId);
  const deleteComment = useDeleteComment(workspaceId, projectId, taskId);
  const [commentBody, setCommentBody] = useState("");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description ?? "");
      setDueDate(task.dueDate ? task.dueDate.slice(0, 10) : "");
    }
  }, [task]);

  if (isLoading) {
    return <Skeleton className="h-64" />;
  }

  if (!task) {
    return <p className="text-muted">Task not found.</p>;
  }

  const dirty =
    title !== task.title ||
    description !== (task.description ?? "") ||
    dueDate !== (task.dueDate ? task.dueDate.slice(0, 10) : "");

  function handleFieldChange(patch: Partial<{ status: TaskStatus; priority: TaskPriority; assigneeId: string | null }>) {
    updateTask.mutate(
      { taskId, ...patch },
      { onError: (err) => toast.error(err instanceof ApiError ? err.message : "Could not update task") },
    );
  }

  function handleSave() {
    updateTask.mutate(
      { taskId, title, description: description || null, dueDate: toIsoDateTime(dueDate) },
      {
        onSuccess: () => onClose?.(),
        onError: (err) => toast.error(err instanceof ApiError ? err.message : "Could not update task"),
      },
    );
  }

  function handleDelete() {
    deleteTask.mutate(taskId, {
      onSuccess: () => onClose?.(),
      onError: (err) => toast.error(err instanceof ApiError ? err.message : "Could not delete task"),
    });
  }

  function handleDuplicate() {
    duplicateTask.mutate(taskId, {
      onSuccess: () => onClose?.(),
      onError: (err) => toast.error(err instanceof ApiError ? err.message : "Could not duplicate task"),
    });
  }

  function handleAddComment(e: React.FormEvent) {
    e.preventDefault();
    if (!commentBody.trim()) return;
    createComment.mutate(commentBody, {
      onSuccess: () => setCommentBody(""),
      onError: (err) => toast.error(err instanceof ApiError ? err.message : "Could not add comment"),
    });
  }

  function handleAttachLabel(labelId: string) {
    attachLabel.mutate(
      { labelId, taskId },
      { onError: (err) => toast.error(err instanceof ApiError ? err.message : "Could not attach label") },
    );
  }

  const assigneeName = members?.find((m) => m.userId === task.assigneeId)?.name ?? "Unassigned";

  return (
    <div className="grid gap-6 lg:grid-cols-[3fr_2fr]">
      {/* Left: editable form */}
      <div className="flex flex-col gap-4">
        <Field label="Title">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Task title" />
        </Field>

        <Field label="Description">
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add a description..."
            className="min-h-[100px]"
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Status">
            <Select value={task.status} onValueChange={(v) => handleFieldChange({ status: v as TaskStatus })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s.replace("_", " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <StatusBadge tone={STATUS_TONE[task.status]} className="w-fit">
              {task.status.replace("_", " ")}
            </StatusBadge>
          </Field>

          <Field label="Priority">
            <Select value={task.priority} onValueChange={(v) => handleFieldChange({ priority: v as TaskPriority })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PRIORITIES.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <StatusBadge tone={PRIORITY_TONE[task.priority]} className="w-fit">
              {task.priority}
            </StatusBadge>
          </Field>
        </div>

        <Field label="Assignee">
          <Select
            value={task.assigneeId ?? "unassigned"}
            onValueChange={(v) => handleFieldChange({ assigneeId: v === "unassigned" ? null : v })}
          >
            <SelectTrigger>
              <SelectValue>{assigneeName}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="unassigned">Unassigned</SelectItem>
              {members?.map((m) => (
                <SelectItem key={m.userId} value={m.userId}>
                  {m.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field label="Due date">
          <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        </Field>

        <div>
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Labels</div>
          <div className="flex flex-wrap gap-2">
            {labels?.map((label) => (
              <button key={label.id} type="button" onClick={() => handleAttachLabel(label.id)}>
                <Badge variant="outline" style={{ borderColor: label.color, color: label.color }}>
                  {label.name}
                </Badge>
              </button>
            ))}
            {!labels?.length && <p className="text-xs text-muted">No labels in this workspace yet.</p>}
          </div>
        </div>

        <div className="mt-2 flex items-center justify-between border-t border-border pt-4">
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleDuplicate} disabled={duplicateTask.isPending}>
              {duplicateTask.isPending ? "Duplicating..." : "Duplicate"}
            </Button>
            <Button variant="danger" size="sm" onClick={handleDelete} disabled={deleteTask.isPending}>
              {deleteTask.isPending ? "Deleting..." : "Delete"}
            </Button>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => onClose?.()}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSave} disabled={!dirty || updateTask.isPending}>
              {updateTask.isPending ? "Saving..." : "Save changes"}
            </Button>
          </div>
        </div>
      </div>

      {/* Right: discussion */}
      <div className="flex flex-col rounded-lg border border-border p-4">
        <h3 className="mb-3 text-sm font-semibold text-foreground">Discussion</h3>

        {commentsLoading ? (
          <Skeleton className="h-20" />
        ) : comments?.length ? (
          <div className="mb-4 flex-1 space-y-3 overflow-y-auto">
            {comments.map((c) => (
              <div key={c.id} className="rounded-lg border border-border p-3">
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-xs text-muted">{formatRelativeTime(c.createdAt)}</span>
                  <button
                    className="text-xs text-muted hover:text-rose-600"
                    onClick={() =>
                      deleteComment.mutate(c.id, {
                        onError: (err) => toast.error(err instanceof ApiError ? err.message : "Could not delete comment"),
                      })
                    }
                  >
                    Delete
                  </button>
                </div>
                <p className="text-sm text-foreground/90">{c.body}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="mb-4 flex-1 text-sm text-muted">No comments yet.</p>
        )}

        <form onSubmit={handleAddComment} className="flex flex-col gap-2">
          <Textarea
            placeholder="Add a comment..."
            value={commentBody}
            onChange={(e) => setCommentBody(e.target.value)}
            className="min-h-[60px]"
          />
          <Button type="submit" size="sm" disabled={createComment.isPending} className="self-end">
            {createComment.isPending ? "Posting..." : "Post comment"}
          </Button>
        </form>
      </div>
    </div>
  );
}

/**
 * The `<input type="date">` gives back a plain `YYYY-MM-DD` string, but the
 * backend's update-task schema expects a full ISO-8601 datetime
 * (`z.string().datetime()`). Convert (or clear) accordingly before sending.
 */
function toIsoDateTime(dateOnly: string): string | null {
  if (!dateOnly) return null;
  return new Date(`${dateOnly}T00:00:00.000Z`).toISOString();
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</span>
      {children}
    </div>
  );
}
