import { Router } from "express";
import { requireRole } from "../middleware/rbac.js";
import { createTask, listTasks, updateTask, deleteTask } from "../controllers/task.controller.js";

const router = Router({ mergeParams: true });

router.post("/", requireRole("MEMBER"), createTask);
router.get("/", listTasks);
router.patch("/:taskId", requireRole("MEMBER"), updateTask);
router.delete("/:taskId", requireRole("MANAGER"), deleteTask);

export default router;
