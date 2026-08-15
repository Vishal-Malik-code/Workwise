import { Router } from "express";
import { requireAuth } from "../../middlewares/auth.middleware.js";
import { listNotifications, markAsRead, markAllAsRead } from "./service.js";

const router = Router();

router.use(requireAuth);

router.get("/", async (req, res, next) => {
  try {
    const result = await listNotifications(req.user!.id, req.query);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.patch("/:id/read", async (req, res, next) => {
  try {
    const notification = await markAsRead((req.params.id as string), req.user!.id);
    res.json({ notification });
  } catch (err) {
    next(err);
  }
});

router.patch("/read-all", async (req, res, next) => {
  try {
    const workspaceId = typeof req.query.workspaceId === "string" ? req.query.workspaceId : undefined;
    await markAllAsRead(req.user!.id, workspaceId);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
