import { Router } from "express";
import { requireWorkspaceMember } from "../../middlewares/rbac.middleware.js";
import { listActivity } from "./service.js";

const router = Router({ mergeParams: true });

router.get("/", requireWorkspaceMember, async (req, res, next) => {
  try {
    const result = await listActivity((req.params.workspaceId as string), req.query);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

export default router;
