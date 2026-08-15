import { and, eq, inArray } from "drizzle-orm";
import { db, schema } from "../../db/index.js";
import { AppError } from "../../utils/AppError.js";
import { recordAudit } from "../activity/service.js";
import { emitWorkspaceEvent } from "../../utils/socketEvents.js";

export async function createLabel(workspaceId: string, actorId: string, name: string, color?: string) {
  const [label] = await db
    .insert(schema.labels)
    .values({ workspaceId, name, color })
    .returning();

  await recordAudit({ workspaceId, actorId, action: "label.created", targetType: "label", targetId: label.id });
  emitWorkspaceEvent(workspaceId, "label", "created", { label });

  return label;
}

export async function listLabels(workspaceId: string) {
  return db.select().from(schema.labels).where(eq(schema.labels.workspaceId, workspaceId));
}

export async function deleteLabel(workspaceId: string, actorId: string, labelId: string) {
  const [deleted] = await db
    .delete(schema.labels)
    .where(and(eq(schema.labels.id, labelId), eq(schema.labels.workspaceId, workspaceId)))
    .returning();
  if (!deleted) throw AppError.notFound("Label not found");

  await recordAudit({ workspaceId, actorId, action: "label.deleted", targetType: "label", targetId: labelId });
  emitWorkspaceEvent(workspaceId, "label", "deleted", { labelId });
}

export async function attachLabel(workspaceId: string, actorId: string, taskId: string, labelId: string) {
  const [task] = await db
    .select({ id: schema.tasks.id })
    .from(schema.tasks)
    .where(and(eq(schema.tasks.id, taskId), eq(schema.tasks.workspaceId, workspaceId)))
    .limit(1);
  if (!task) throw AppError.notFound("Task not found");

  const [label] = await db
    .select({ id: schema.labels.id })
    .from(schema.labels)
    .where(and(eq(schema.labels.id, labelId), eq(schema.labels.workspaceId, workspaceId)))
    .limit(1);
  if (!label) throw AppError.notFound("Label not found");

  const [existing] = await db
    .select({ id: schema.taskLabels.id })
    .from(schema.taskLabels)
    .where(and(eq(schema.taskLabels.taskId, taskId), eq(schema.taskLabels.labelId, labelId)))
    .limit(1);
  if (existing) return existing;

  const [taskLabel] = await db.insert(schema.taskLabels).values({ taskId, labelId }).returning();

  await recordAudit({
    workspaceId,
    actorId,
    action: "label.attached",
    targetType: "task",
    targetId: taskId,
    metadata: { labelId },
  });

  emitWorkspaceEvent(workspaceId, "task", "label_attached", { taskId, labelId });

  return taskLabel;
}

export async function replaceTaskLabels(workspaceId: string, actorId: string, taskId: string, labelIds: string[]) {
  const labels = await db.transaction(async (tx) => {
    const [task] = await tx
      .select({ id: schema.tasks.id })
      .from(schema.tasks)
      .where(and(eq(schema.tasks.id, taskId), eq(schema.tasks.workspaceId, workspaceId)))
      .limit(1);
    if (!task) throw AppError.notFound("Task not found");

    if (labelIds.length > 0) {
      const found = await tx
        .select({ id: schema.labels.id })
        .from(schema.labels)
        .where(and(inArray(schema.labels.id, labelIds), eq(schema.labels.workspaceId, workspaceId)));
      if (found.length !== new Set(labelIds).size) {
        throw AppError.badRequest("One or more labels do not belong to this workspace");
      }
    }

    await tx.delete(schema.taskLabels).where(eq(schema.taskLabels.taskId, taskId));

    if (labelIds.length > 0) {
      await tx.insert(schema.taskLabels).values(labelIds.map((labelId) => ({ taskId, labelId })));
    }

    if (labelIds.length === 0) return [];

    return tx
      .select({
        id: schema.labels.id,
        workspaceId: schema.labels.workspaceId,
        name: schema.labels.name,
        color: schema.labels.color,
        createdAt: schema.labels.createdAt,
      })
      .from(schema.labels)
      .where(inArray(schema.labels.id, labelIds));
  });

  await recordAudit({
    workspaceId,
    actorId,
    action: "label.replaced",
    targetType: "task",
    targetId: taskId,
    metadata: { labelIds },
  });

  emitWorkspaceEvent(workspaceId, "task", "labels_replaced", { taskId, labelIds });

  return labels;
}

export async function detachLabel(workspaceId: string, actorId: string, taskId: string, labelId: string) {
  const [deleted] = await db
    .delete(schema.taskLabels)
    .where(and(eq(schema.taskLabels.taskId, taskId), eq(schema.taskLabels.labelId, labelId)))
    .returning();
  if (!deleted) throw AppError.notFound("Label is not attached to this task");

  await recordAudit({
    workspaceId,
    actorId,
    action: "label.detached",
    targetType: "task",
    targetId: taskId,
    metadata: { labelId },
  });

  emitWorkspaceEvent(workspaceId, "task", "label_detached", { taskId, labelId });
}
