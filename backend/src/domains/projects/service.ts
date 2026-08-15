import { and, eq } from "drizzle-orm";
import { db, schema } from "../../db/index.js";
import { AppError } from "../../utils/AppError.js";
import { recordAudit } from "../activity/service.js";
import { emitWorkspaceEvent } from "../../utils/socketEvents.js";

export async function createProject(
  workspaceId: string,
  actorId: string,
  input: { name: string; description?: string },
) {
  const [project] = await db
    .insert(schema.projects)
    .values({ workspaceId, name: input.name, description: input.description, createdById: actorId })
    .returning();

  await recordAudit({
    workspaceId,
    actorId,
    action: "project.created",
    targetType: "project",
    targetId: project.id,
  });

  emitWorkspaceEvent(workspaceId, "project", "created", { project });

  return project;
}

export async function listProjects(workspaceId: string) {
  return db.select().from(schema.projects).where(eq(schema.projects.workspaceId, workspaceId));
}

export async function getProject(workspaceId: string, projectId: string) {
  const [project] = await db
    .select()
    .from(schema.projects)
    .where(and(eq(schema.projects.id, projectId), eq(schema.projects.workspaceId, workspaceId)))
    .limit(1);
  if (!project) throw AppError.notFound("Project not found");
  return project;
}

export async function updateProject(
  workspaceId: string,
  actorId: string,
  projectId: string,
  patch: { name?: string; description?: string | null },
) {
  const [updated] = await db
    .update(schema.projects)
    .set({ ...patch, updatedAt: new Date() })
    .where(and(eq(schema.projects.id, projectId), eq(schema.projects.workspaceId, workspaceId)))
    .returning();
  if (!updated) throw AppError.notFound("Project not found");

  await recordAudit({
    workspaceId,
    actorId,
    action: "project.updated",
    targetType: "project",
    targetId: projectId,
    metadata: patch,
  });

  emitWorkspaceEvent(workspaceId, "project", "updated", { project: updated });

  return updated;
}

export async function deleteProject(workspaceId: string, actorId: string, projectId: string) {
  const [deleted] = await db
    .delete(schema.projects)
    .where(and(eq(schema.projects.id, projectId), eq(schema.projects.workspaceId, workspaceId)))
    .returning();
  if (!deleted) throw AppError.notFound("Project not found");

  await recordAudit({
    workspaceId,
    actorId,
    action: "project.deleted",
    targetType: "project",
    targetId: projectId,
  });

  emitWorkspaceEvent(workspaceId, "project", "deleted", { projectId });
}
