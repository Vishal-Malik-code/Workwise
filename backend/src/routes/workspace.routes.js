import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { loadMembership, requireRole } from "../middleware/rbac.js";
import {
  createWorkspace,
  listMyWorkspaces,
  listMembers,
  addMember,
  updateMemberRole,
  removeMember,
} from "../controllers/workspace.controller.js";

const router = Router();

router.use(requireAuth);

router.post("/", createWorkspace);
router.get("/", listMyWorkspaces);

router.get("/:workspaceId/members", loadMembership, listMembers);
router.post("/:workspaceId/members", loadMembership, requireRole("ADMIN"), addMember);
router.patch("/:workspaceId/members/:memberId", loadMembership, requireRole("ADMIN"), updateMemberRole);
router.delete("/:workspaceId/members/:memberId", loadMembership, requireRole("ADMIN"), removeMember);

export default router;
