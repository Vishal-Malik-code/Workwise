import { Router } from "express";
import { requireAuth } from "../../middlewares/auth.middleware.js";
import { loadMembership, requireWorkspaceManager, requireWorkspaceMember, requireWorkspaceOwner } from "../../middlewares/rbac.middleware.js";
import { createWorkspaceSchema, updateWorkspaceSchema, transferOwnershipSchema, deleteWorkspaceSchema } from "./schemas.js";
import { createWorkspace, listMyWorkspaces, getWorkspace, updateWorkspace, deleteWorkspace, transferOwnership } from "./service.js";
import memberRoutes from "../members/route.js";
import inviteRoutes from "../invites/route.js";
import projectRoutes from "../projects/route.js";
import labelRoutes from "../labels/route.js";
import activityRoutes from "../activity/route.js";
import assistantRoutes from "../assistant/route.js";

const router = Router();

router.use(requireAuth);

router.post("/", async (req, res, next) => {
  try {
    const { name } = createWorkspaceSchema.parse(req.body);
    const workspace = await createWorkspace(req.user!.id, name);
    res.status(201).json({ workspace });
  } catch (err) {
    next(err);
  }
});

router.get("/", async (req, res, next) => {
  try {
    const workspaces = await listMyWorkspaces(req.user!.id);
    res.json({ workspaces });
  } catch (err) {
    next(err);
  }
});

router.get("/:workspaceId", loadMembership, requireWorkspaceMember, async (req, res, next) => {
  try {
    const workspace = await getWorkspace((req.params.workspaceId as string));
    res.json({ workspace });
  } catch (err) {
    next(err);
  }
});

router.patch("/:workspaceId", loadMembership, requireWorkspaceManager, async (req, res, next) => {
  try {
    const input = updateWorkspaceSchema.parse(req.body);
    const workspace = await updateWorkspace((req.params.workspaceId as string), req.user!.id, input);
    res.json({ workspace });
  } catch (err) {
    next(err);
  }
});

router.delete("/:workspaceId", loadMembership, requireWorkspaceOwner, async (req, res, next) => {
  try {
    const { confirmationName } = deleteWorkspaceSchema.parse(req.body);
    await deleteWorkspace((req.params.workspaceId as string), req.user!.id, confirmationName);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

router.patch("/:workspaceId/transfer-owner", loadMembership, requireWorkspaceOwner, async (req, res, next) => {
  try {
    const { newOwnerMemberId } = transferOwnershipSchema.parse(req.body);
    const member = await transferOwnership((req.params.workspaceId as string), req.user!.id, newOwnerMemberId);
    res.json({ member });
  } catch (err) {
    next(err);
  }
});

router.use("/:workspaceId/members", loadMembership, memberRoutes);
router.use("/:workspaceId/invites", loadMembership, inviteRoutes);
router.use("/:workspaceId/projects", loadMembership, projectRoutes);
router.use("/:workspaceId/labels", loadMembership, labelRoutes);
router.use("/:workspaceId/activity", loadMembership, activityRoutes);
router.use("/:workspaceId/pulse", loadMembership, assistantRoutes);

export default router;
