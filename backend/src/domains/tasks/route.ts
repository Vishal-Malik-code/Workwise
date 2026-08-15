import { Router } from "express";
import { requireWorkspaceContributor, requireWorkspaceManager, requireWorkspaceMember } from "../../middlewares/rbac.middleware.js";
import { createTaskSchema, updateTaskSchema, reorderTaskSchema } from "./schemas.js";
import { createTask, listTasks, getTask, updateTask, deleteTask, duplicateTask } from "./service.js";
import commentsRoute from "../comments/route.js";

const router = Router({ mergeParams: true });

router.get("/", requireWorkspaceMember, async (req, res, next) => {
  try {
    const tasks = await listTasks((req.params.workspaceId as string), (req.params.projectId as string));
    res.json({ tasks });
  } catch (err) {
    next(err);
  }
});

router.post("/", requireWorkspaceContributor, async (req, res, next) => {
  try {
    const input = createTaskSchema.parse(req.body);
    const task = await createTask((req.params.workspaceId as string), (req.params.projectId as string), req.user!.id, input);
    res.status(201).json({ task });
  } catch (err) {
    next(err);
  }
});

router.get("/:taskId", requireWorkspaceMember, async (req, res, next) => {
  try {
    const task = await getTask((req.params.workspaceId as string), (req.params.taskId as string));
    res.json({ task });
  } catch (err) {
    next(err);
  }
});

router.patch("/:taskId", requireWorkspaceContributor, async (req, res, next) => {
  try {
    const input = updateTaskSchema.parse(req.body);
    const task = await updateTask((req.params.workspaceId as string), req.user!.id, (req.params.taskId as string), input);
    res.json({ task });
  } catch (err) {
    next(err);
  }
});

router.patch("/:taskId/position", requireWorkspaceContributor, async (req, res, next) => {
  try {
    const input = reorderTaskSchema.parse(req.body);
    const task = await updateTask((req.params.workspaceId as string), req.user!.id, (req.params.taskId as string), input);
    res.json({ task });
  } catch (err) {
    next(err);
  }
});

router.post("/:taskId/duplicate", requireWorkspaceContributor, async (req, res, next) => {
  try {
    const task = await duplicateTask((req.params.workspaceId as string), (req.params.taskId as string), req.user!.id);
    res.status(201).json({ task });
  } catch (err) {
    next(err);
  }
});

router.delete("/:taskId", requireWorkspaceManager, async (req, res, next) => {
  try {
    await deleteTask((req.params.workspaceId as string), req.user!.id, (req.params.taskId as string));
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

router.use("/:taskId/comments", commentsRoute);

export default router;
