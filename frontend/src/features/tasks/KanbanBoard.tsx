"use client";

import { useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { TaskCard } from "./TaskCard";
import { TaskDetailDialog } from "./TaskDetailDialog";
import { useMoveTask } from "./useTasks";
import { useMembers } from "@/features/members/useMembers";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SegmentedProgressBar } from "@/components/shared/SegmentedProgressBar";
import { STATUS_TONE } from "@/components/shared/StatusBadge";
import { cn } from "@/lib/utils";
import type { Task, TaskPriority, TaskStatus } from "@/types/api";

const COLUMNS: Array<{ key: TaskStatus; label: string; description: string }> = [
  { key: "BACKLOG", label: "Backlog", description: "Ideas and upcoming work" },
  { key: "TODO", label: "To do", description: "Ready to be picked up" },
  { key: "IN_PROGRESS", label: "In progress", description: "Actively being worked" },
  { key: "BLOCKED", label: "Blocked", description: "Waiting on a dependency" },
  { key: "DONE", label: "Done", description: "Completed work" },
];

const PRIORITIES: TaskPriority[] = ["LOW", "MEDIUM", "HIGH", "URGENT"];

function Column({
  status,
  label,
  description,
  tasks,
  totalTasks,
  workspaceId,
  projectId,
  onOpenTask,
}: {
  status: TaskStatus;
  label: string;
  description: string;
  tasks: Task[];
  totalTasks: number;
  workspaceId: string;
  projectId: string;
  onOpenTask: (taskId: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex min-h-[200px] min-w-[280px] max-w-[320px] flex-1 flex-col rounded-lg p-2 transition-colors",
        isOver && "bg-black/5",
      )}
    >
      <div className="mb-1 px-1">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted">
          {label} <span className="text-muted/70">({tasks.length})</span>
        </h2>
        <p className="mt-0.5 text-xs text-muted/70">{description}</p>
      </div>
      <SegmentedProgressBar
        value={tasks.length}
        max={totalTasks}
        tone={STATUS_TONE[status]}
        className="mb-3 px-1"
      />
      {tasks.map((task) => (
        <TaskCard key={task.id} task={task} workspaceId={workspaceId} projectId={projectId} onOpen={onOpenTask} />
      ))}
      {tasks.length === 0 && (
        <Card className="border-dashed p-3 text-center text-xs text-muted">Drop tasks here</Card>
      )}
    </div>
  );
}

export function KanbanBoard({
  tasks,
  workspaceId,
  projectId,
}: {
  tasks: Task[];
  workspaceId: string;
  projectId: string;
}) {
  const moveTask = useMoveTask(workspaceId, projectId);
  const { data: members } = useMembers(workspaceId);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [openTaskId, setOpenTaskId] = useState<string | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | "ALL">("ALL");
  const [assigneeFilter, setAssigneeFilter] = useState<string>("ALL");
  const [includeArchived, setIncludeArchived] = useState(false);

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (!includeArchived && task.archivedAt) return false;
      if (priorityFilter !== "ALL" && task.priority !== priorityFilter) return false;
      if (assigneeFilter === "UNASSIGNED" && task.assigneeId) return false;
      if (assigneeFilter !== "ALL" && assigneeFilter !== "UNASSIGNED" && task.assigneeId !== assigneeFilter) return false;
      return true;
    });
  }, [tasks, priorityFilter, assigneeFilter, includeArchived]);

  const byColumn = useMemo(() => {
    const grouped = new Map<TaskStatus, Task[]>(COLUMNS.map((c) => [c.key, []]));
    for (const task of [...filteredTasks].sort((a, b) => a.position - b.position)) {
      grouped.get(task.status)?.push(task);
    }
    return grouped;
  }, [filteredTasks]);

  const activeTask = activeId ? tasks.find((t) => t.id === activeId) ?? null : null;

  function handleDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;

    const taskId = String(active.id);
    const newStatus = over.id as TaskStatus;
    const task = tasks.find((t) => t.id === taskId);
    if (!task || task.status === newStatus) return;

    const columnTasks = byColumn.get(newStatus) ?? [];
    const nextPosition = columnTasks.length > 0 ? Math.max(...columnTasks.map((t) => t.position)) + 1 : 0;

    moveTask.mutate({ taskId, status: newStatus, position: nextPosition });
  }

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="mb-4 flex flex-wrap items-center gap-4 rounded-lg border border-border p-3">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted">Board filters</span>

        <div className="flex items-center gap-2">
          <span className="text-xs text-muted">Priority</span>
          <Select value={priorityFilter} onValueChange={(v) => setPriorityFilter(v as TaskPriority | "ALL")}>
            <SelectTrigger className="h-8 w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All priorities</SelectItem>
              {PRIORITIES.map((p) => (
                <SelectItem key={p} value={p}>
                  {p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-muted">Assignee</span>
          <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
            <SelectTrigger className="h-8 w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Everyone</SelectItem>
              <SelectItem value="UNASSIGNED">Unassigned</SelectItem>
              {members?.map((m) => (
                <SelectItem key={m.userId} value={m.userId}>
                  {m.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <label className="flex items-center gap-2 text-xs text-muted">
          <Checkbox checked={includeArchived} onCheckedChange={(v) => setIncludeArchived(v === true)} />
          Include archived
        </label>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2">
        {COLUMNS.map((col) => (
          <Column
            key={col.key}
            status={col.key}
            label={col.label}
            description={col.description}
            tasks={byColumn.get(col.key) ?? []}
            totalTasks={filteredTasks.length}
            workspaceId={workspaceId}
            projectId={projectId}
            onOpenTask={setOpenTaskId}
          />
        ))}
      </div>
      <DragOverlay>
        {activeTask ? <TaskCard task={activeTask} workspaceId={workspaceId} projectId={projectId} /> : null}
      </DragOverlay>
      <TaskDetailDialog
        workspaceId={workspaceId}
        projectId={projectId}
        taskId={openTaskId}
        onOpenChange={(open) => !open && setOpenTaskId(null)}
      />
    </DndContext>
  );
}
