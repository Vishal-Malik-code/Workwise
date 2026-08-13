import { and, eq } from "drizzle-orm";
import { db, schema } from "../db/index.js";
import { createTaskSchema, updateTaskSchema } from "../validators/project.js";
import { recordAudit } from "../services/audit.service.js";

export async function createTask(req, res, next) {
  try {
    const input = createTaskSchema.parse(req.body);
    const { workspaceId, projectId } = req.params;

    const [task] = await db
      .insert(schema.tasks)
      .values({
        workspaceId,
        projectId,
        title: input.title,
        description: input.description,
        priority: input.priority,
        assigneeId: input.assigneeId,
        dueDate: input.dueDate ? new Date(input.dueDate) : null,
        createdById: req.user.id,
      })
      .returning();

    await recordAudit({ workspaceId, actorId: req.user.id, action: "task.created", targetType: "task", targetId: task.id });

    res.status(201).json({ task });
  } catch (err) {
    next(err);
  }
}

export async function listTasks(req, res, next) {
  try {
    const { workspaceId, projectId } = req.params;
    const rows = await db
      .select()
      .from(schema.tasks)
      .where(and(eq(schema.tasks.workspaceId, workspaceId), eq(schema.tasks.projectId, projectId)));

    res.json({ tasks: rows });
  } catch (err) {
    next(err);
  }
}

export async function updateTask(req, res, next) {
  try {
    const input = updateTaskSchema.parse(req.body);
    const { workspaceId, taskId } = req.params;

    const patch = { ...input, updatedAt: new Date() };
    if (input.dueDate !== undefined) {
      patch.dueDate = input.dueDate ? new Date(input.dueDate) : null;
    }

    const [task] = await db
      .update(schema.tasks)
      .set(patch)
      .where(and(eq(schema.tasks.id, taskId), eq(schema.tasks.workspaceId, workspaceId)))
      .returning();

    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    await recordAudit({ workspaceId, actorId: req.user.id, action: "task.updated", targetType: "task", targetId: task.id, metadata: input });

    req.app.get("io")?.to(`workspace:${workspaceId}`).emit("task:updated", task);

    res.json({ task });
  } catch (err) {
    next(err);
  }
}

export async function deleteTask(req, res, next) {
  try {
    const { workspaceId, taskId } = req.params;
    const [deleted] = await db
      .delete(schema.tasks)
      .where(and(eq(schema.tasks.id, taskId), eq(schema.tasks.workspaceId, workspaceId)))
      .returning();

    if (!deleted) {
      return res.status(404).json({ error: "Task not found" });
    }

    await recordAudit({ workspaceId, actorId: req.user.id, action: "task.deleted", targetType: "task", targetId: taskId });

    req.app.get("io")?.to(`workspace:${workspaceId}`).emit("task:deleted", { id: taskId });

    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
