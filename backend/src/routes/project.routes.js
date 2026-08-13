import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { loadMembership, requireRole } from "../middleware/rbac.js";
import { createProject, listProjects, getProject, deleteProject } from "../controllers/project.controller.js";
import taskRoutes from "./task.routes.js";

const router = Router({ mergeParams: true });

router.use(requireAuth, loadMembership);

router.post("/", requireRole("MANAGER"), createProject);
router.get("/", listProjects);
router.get("/:projectId", getProject);
router.delete("/:projectId", requireRole("MANAGER"), deleteProject);

router.use("/:projectId/tasks", taskRoutes);

export default router;
