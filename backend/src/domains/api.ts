import { Router } from "express";
import authRoutes from "./auth/route.js";
import workspaceRoutes from "./workspaces/route.js";
import inviteTokenRoutes from "./invites/token-route.js";
import notificationRoutes from "./notifications/route.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/workspaces", workspaceRoutes);
router.use("/invites", inviteTokenRoutes);
router.use("/notifications", notificationRoutes);

export default router;
