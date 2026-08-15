import { Router } from "express";
import { requireWorkspaceContributor, requireWorkspaceMember } from "../../middlewares/rbac.middleware.js";
import { createCommentSchema } from "./schemas.js";
import { createComment, listComments, deleteComment } from "./service.js";

const router = Router({ mergeParams: true });

router.get("/", requireWorkspaceMember, async (req, res, next) => {
  try {
    const comments = await listComments((req.params.workspaceId as string), (req.params.taskId as string));
    res.json({ comments });
  } catch (err) {
    next(err);
  }
});

router.post("/", requireWorkspaceContributor, async (req, res, next) => {
  try {
    const { body } = createCommentSchema.parse(req.body);
    const comment = await createComment((req.params.workspaceId as string), (req.params.taskId as string), req.user!.id, body);
    res.status(201).json({ comment });
  } catch (err) {
    next(err);
  }
});

router.delete("/:commentId", requireWorkspaceContributor, async (req, res, next) => {
  try {
    await deleteComment((req.params.workspaceId as string), req.user!.id, (req.params.taskId as string), (req.params.commentId as string));
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
