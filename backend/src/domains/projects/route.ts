import { Router } from "express";
import { requireWorkspaceManager, requireWorkspaceMember } from "../../middlewares/rbac.middleware.js";
import { createProjectSchema, updateProjectSchema } from "./schemas.js";
import { createProject, listProjects, getProject, updateProject, deleteProject } from "./service.js";
import taskRoutes from "../tasks/route.js";

const router = Router({ mergeParams: true });

router.get("/", requireWorkspaceMember, async (req, res, next) => {
  try {
    const projects = await listProjects((req.params.workspaceId as string));
    res.json({ projects });
  } catch (err) {
    next(err);
  }
});

router.post("/", requireWorkspaceManager, async (req, res, next) => {
  try {
    const input = createProjectSchema.parse(req.body);
    const project = await createProject((req.params.workspaceId as string), req.user!.id, input);
    res.status(201).json({ project });
  } catch (err) {
    next(err);
  }
});

router.get("/:projectId", requireWorkspaceMember, async (req, res, next) => {
  try {
    const project = await getProject((req.params.workspaceId as string), (req.params.projectId as string));
    res.json({ project });
  } catch (err) {
    next(err);
  }
});

router.patch("/:projectId", requireWorkspaceManager, async (req, res, next) => {
  try {
    const input = updateProjectSchema.parse(req.body);
    const project = await updateProject((req.params.workspaceId as string), req.user!.id, (req.params.projectId as string), input);
    res.json({ project });
  } catch (err) {
    next(err);
  }
});

router.delete("/:projectId", requireWorkspaceManager, async (req, res, next) => {
  try {
    await deleteProject((req.params.workspaceId as string), req.user!.id, (req.params.projectId as string));
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

router.use("/:projectId/tasks", taskRoutes);

export default router;
