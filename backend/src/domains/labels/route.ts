import { Router } from "express";
import { requireWorkspaceContributor, requireWorkspaceMember } from "../../middlewares/rbac.middleware.js";
import { createLabelSchema, replaceTaskLabelsSchema } from "./schemas.js";
import { createLabel, listLabels, deleteLabel, attachLabel, detachLabel, replaceTaskLabels } from "./service.js";

const router = Router({ mergeParams: true });

router.get("/", requireWorkspaceMember, async (req, res, next) => {
  try {
    const labels = await listLabels((req.params.workspaceId as string));
    res.json({ labels });
  } catch (err) {
    next(err);
  }
});

router.post("/", requireWorkspaceContributor, async (req, res, next) => {
  try {
    const { name, color } = createLabelSchema.parse(req.body);
    const label = await createLabel((req.params.workspaceId as string), req.user!.id, name, color);
    res.status(201).json({ label });
  } catch (err) {
    next(err);
  }
});

router.delete("/:labelId", requireWorkspaceContributor, async (req, res, next) => {
  try {
    await deleteLabel((req.params.workspaceId as string), req.user!.id, (req.params.labelId as string));
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

router.put("/tasks/:taskId", requireWorkspaceContributor, async (req, res, next) => {
  try {
    const { labelIds } = replaceTaskLabelsSchema.parse(req.body);
    const labels = await replaceTaskLabels((req.params.workspaceId as string), req.user!.id, (req.params.taskId as string), labelIds);
    res.json({ labels });
  } catch (err) {
    next(err);
  }
});

router.post("/:labelId/tasks/:taskId", requireWorkspaceContributor, async (req, res, next) => {
  try {
    const taskLabel = await attachLabel((req.params.workspaceId as string), req.user!.id, (req.params.taskId as string), (req.params.labelId as string));
    res.status(201).json({ taskLabel });
  } catch (err) {
    next(err);
  }
});

router.delete("/:labelId/tasks/:taskId", requireWorkspaceContributor, async (req, res, next) => {
  try {
    await detachLabel((req.params.workspaceId as string), req.user!.id, (req.params.taskId as string), (req.params.labelId as string));
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
