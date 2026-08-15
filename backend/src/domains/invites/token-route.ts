import { Router } from "express";
import { requireAuth } from "../../middlewares/auth.middleware.js";
import { acceptInvite, declineInvite } from "./service.js";

// Top-level /api/invites/:token/{accept,decline} — the token identifies the
// workspace, so these routes don't nest under a workspaceId.
const router = Router();

router.post("/:token/accept", requireAuth, async (req, res, next) => {
  try {
    const result = await acceptInvite((req.params.token as string), req.user!.id, req.user!.email);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.post("/:token/decline", requireAuth, async (req, res, next) => {
  try {
    const result = await declineInvite((req.params.token as string), req.user!.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

export default router;
