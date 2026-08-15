import { and, eq } from "drizzle-orm";
import { db, schema } from "../../db/index.js";
import { AppError } from "../../utils/AppError.js";
import { recordAudit } from "../activity/service.js";
import { emitWorkspaceEvent } from "../../utils/socketEvents.js";
import { createNotification } from "../notifications/service.js";

export interface CreateTaskInput {
  title: string;
  description?: string;
  priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  status?: "BACKLOG" | "TODO" | "IN_PROGRESS" | "BLOCKED" | "DONE";
  assigneeId?: string | null;
  dueDate?: string | null;
}

export async function createTask(
  workspaceId: string,
  projectId: string,
  actorId: string,
  input: CreateTaskInput,
) {
  const [task] = await db
    .insert(schema.tasks)
    .values({
      workspaceId,
      projectId,
      title: input.title,
      description: input.description,
      priority: input.priority,
      status: input.status,
      assigneeId: input.assigneeId ?? null,
      dueDate: input.dueDate ? new Date(input.dueDate) : null,
      createdById: actorId,
    })
    .returning();

  await recordAudit({ workspaceId, actorId, action: "task.created", targetType: "task", targetId: task.id });
  emitWorkspaceEvent(workspaceId, "task", "created", { task });

  if (task.assigneeId && task.assigneeId !== actorId) {
    try {
      await createNotification({
        userId: task.assigneeId,
        workspaceId,
        type: "TASK_ASSIGNED",
        payload: { taskId: task.id, taskTitle: task.title, actorId },
      });
    } catch (err) {
      console.error("Failed to create TASK_ASSIGNED notification", err);
    }
  }

  return task;
}

export async function duplicateTask(workspaceId: string, taskId: string, actorId: string) {
  const [source] = await db
    .select()
    .from(schema.tasks)
    .where(and(eq(schema.tasks.id, taskId), eq(schema.tasks.workspaceId, workspaceId)))
    .limit(1);
  if (!source) throw AppError.notFound("Task not found");

  const [task] = await db
    .insert(schema.tasks)
    .values({
      workspaceId: source.workspaceId,
      projectId: source.projectId,
      title: `${source.title} (copy)`,
      description: source.description,
      status: source.status,
      priority: source.priority,
      createdById: actorId,
    })
    .returning();

  const existingLabels = await db
    .select({ labelId: schema.taskLabels.labelId })
    .from(schema.taskLabels)
    .where(eq(schema.taskLabels.taskId, taskId));

  if (existingLabels.length > 0) {
    await db.insert(schema.taskLabels).values(existingLabels.map((l) => ({ taskId: task.id, labelId: l.labelId })));
  }

  await recordAudit({ workspaceId, actorId, action: "task.duplicated", targetType: "task", targetId: task.id });
  emitWorkspaceEvent(workspaceId, "task", "created", { task });

  return task;
}

export async function listTasks(workspaceId: string, projectId: string) {
  return db
    .select()
    .from(schema.tasks)
    .where(and(eq(schema.tasks.workspaceId, workspaceId), eq(schema.tasks.projectId, projectId)));
}

export async function getTask(workspaceId: string, taskId: string) {
  const [task] = await db
    .select()
    .from(schema.tasks)
    .where(and(eq(schema.tasks.id, taskId), eq(schema.tasks.workspaceId, workspaceId)))
    .limit(1);
  if (!task) throw AppError.notFound("Task not found");
  return task;
}

export interface UpdateTaskPatch {
  title?: string;
  description?: string | null;
  status?: string;
  priority?: string;
  assigneeId?: string | null;
  position?: number;
  dueDate?: string | null;
}

export async function updateTask(workspaceId: string, actorId: string, taskId: string, input: UpdateTaskPatch) {
  const patch: Record<string, unknown> = { ...input, updatedAt: new Date() };
  if (input.dueDate !== undefined) {
    patch.dueDate = input.dueDate ? new Date(input.dueDate) : null;
  }

  const [before] = await db
    .select({ assigneeId: schema.tasks.assigneeId, status: schema.tasks.status })
    .from(schema.tasks)
    .where(and(eq(schema.tasks.id, taskId), eq(schema.tasks.workspaceId, workspaceId)))
    .limit(1);

  const [task] = await db
    .update(schema.tasks)
    .set(patch)
    .where(and(eq(schema.tasks.id, taskId), eq(schema.tasks.workspaceId, workspaceId)))
    .returning();

  if (!task) throw AppError.notFound("Task not found");

  await recordAudit({
    workspaceId,
    actorId,
    action: "task.updated",
    targetType: "task",
    targetId: task.id,
    metadata: input as Record<string, unknown>,
  });

  emitWorkspaceEvent(workspaceId, "task", "updated", { task });

  if (
    input.assigneeId !== undefined &&
    task.assigneeId &&
    task.assigneeId !== before?.assigneeId &&
    task.assigneeId !== actorId
  ) {
    try {
      await createNotification({
        userId: task.assigneeId,
        workspaceId,
        type: "TASK_ASSIGNED",
        payload: { taskId: task.id, taskTitle: task.title, actorId },
      });
    } catch (err) {
      console.error("Failed to create TASK_ASSIGNED notification", err);
    }
  } else if (
    input.status !== undefined &&
    task.status !== before?.status &&
    task.assigneeId &&
    task.assigneeId !== actorId
  ) {
    try {
      await createNotification({
        userId: task.assigneeId,
        workspaceId,
        type: "TASK_STATUS_CHANGED",
        payload: { taskId: task.id, taskTitle: task.title, status: task.status, actorId },
      });
    } catch (err) {
      console.error("Failed to create TASK_STATUS_CHANGED notification", err);
    }
  }

  return task;
}

export async function deleteTask(workspaceId: string, actorId: string, taskId: string) {
  const [deleted] = await db
    .delete(schema.tasks)
    .where(and(eq(schema.tasks.id, taskId), eq(schema.tasks.workspaceId, workspaceId)))
    .returning();
  if (!deleted) throw AppError.notFound("Task not found");

  await recordAudit({ workspaceId, actorId, action: "task.deleted", targetType: "task", targetId: taskId });
  emitWorkspaceEvent(workspaceId, "task", "deleted", { taskId });
}
