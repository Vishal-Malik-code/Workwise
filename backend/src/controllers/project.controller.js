import { and, eq } from "drizzle-orm";
import { db, schema } from "../db/index.js";
import { createProjectSchema } from "../validators/project.js";
import { recordAudit } from "../services/audit.service.js";

export async function createProject(req, res, next) {
  try {
    const { name, description } = createProjectSchema.parse(req.body);
    const workspaceId = req.params.workspaceId;

    const [project] = await db
      .insert(schema.projects)
      .values({ workspaceId, name, description, createdById: req.user.id })
      .returning();

    await recordAudit({ workspaceId, actorId: req.user.id, action: "project.created", targetType: "project", targetId: project.id });

    res.status(201).json({ project });
  } catch (err) {
    next(err);
  }
}

export async function listProjects(req, res, next) {
  try {
    const rows = await db
      .select()
      .from(schema.projects)
      .where(eq(schema.projects.workspaceId, req.params.workspaceId));

    res.json({ projects: rows });
  } catch (err) {
    next(err);
  }
}

export async function getProject(req, res, next) {
  try {
    const { workspaceId, projectId } = req.params;
    const [project] = await db
      .select()
      .from(schema.projects)
      .where(and(eq(schema.projects.id, projectId), eq(schema.projects.workspaceId, workspaceId)))
      .limit(1);

    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    res.json({ project });
  } catch (err) {
    next(err);
  }
}

export async function deleteProject(req, res, next) {
  try {
    const { workspaceId, projectId } = req.params;
    const [deleted] = await db
      .delete(schema.projects)
      .where(and(eq(schema.projects.id, projectId), eq(schema.projects.workspaceId, workspaceId)))
      .returning();

    if (!deleted) {
      return res.status(404).json({ error: "Project not found" });
    }

    await recordAudit({ workspaceId, actorId: req.user.id, action: "project.deleted", targetType: "project", targetId: projectId });

    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
