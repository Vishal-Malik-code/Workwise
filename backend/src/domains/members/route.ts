import { Router } from "express";
import { requireWorkspaceAdmin, requireWorkspaceMember } from "../../middlewares/rbac.middleware.js";
import { addMemberSchema, updateMemberRoleSchema } from "./schemas.js";
import { listMembers, addMember, updateMemberRole, removeMember } from "./service.js";

const router = Router({ mergeParams: true });

router.get("/", requireWorkspaceMember, async (req, res, next) => {
  try {
    const members = await listMembers((req.params.workspaceId as string));
    res.json({ members });
  } catch (err) {
    next(err);
  }
});

router.post("/", requireWorkspaceAdmin, async (req, res, next) => {
  try {
    const { email, role } = addMemberSchema.parse(req.body);
    const member = await addMember((req.params.workspaceId as string), req.user!.id, email, role);
    res.status(201).json({ member });
  } catch (err) {
    next(err);
  }
});

router.patch("/:memberId", requireWorkspaceAdmin, async (req, res, next) => {
  try {
    const { role } = updateMemberRoleSchema.parse(req.body);
    const member = await updateMemberRole((req.params.workspaceId as string), req.user!.id, (req.params.memberId as string), role);
    res.json({ member });
  } catch (err) {
    next(err);
  }
});

router.delete("/:memberId", requireWorkspaceAdmin, async (req, res, next) => {
  try {
    await removeMember((req.params.workspaceId as string), req.user!.id, (req.params.memberId as string));
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
