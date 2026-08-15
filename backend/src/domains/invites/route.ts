import { Router } from "express";
import { requireWorkspaceAdmin, requireWorkspaceMember } from "../../middlewares/rbac.middleware.js";
import { inviteLimiter } from "../../middlewares/rateLimit.middleware.js";
import { createInviteSchema } from "./schemas.js";
import { createInvite, listPendingInvites } from "./service.js";

// Nested under /api/workspaces/:workspaceId/invites
const router = Router({ mergeParams: true });

router.get("/", requireWorkspaceMember, async (req, res, next) => {
  try {
    const invites = await listPendingInvites((req.params.workspaceId as string));
    res.json({ invites });
  } catch (err) {
    next(err);
  }
});

router.post("/", requireWorkspaceAdmin, inviteLimiter, async (req, res, next) => {
  try {
    const { email, role } = createInviteSchema.parse(req.body);
    const { invite, token } = await createInvite((req.params.workspaceId as string), req.user!.id, email, role);
    res.status(201).json({ invite, token });
  } catch (err) {
    next(err);
  }
});

export default router;
