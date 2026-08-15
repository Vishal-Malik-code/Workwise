import { z } from "zod";

export const createTaskSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(4000).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  status: z.enum(["BACKLOG", "TODO", "IN_PROGRESS", "BLOCKED", "DONE"]).optional(),
  assigneeId: z.string().uuid().nullable().optional(),
  dueDate: z.string().datetime().nullable().optional(),
});

export const updateTaskSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(4000).nullable().optional(),
  status: z.enum(["BACKLOG", "TODO", "IN_PROGRESS", "BLOCKED", "DONE"]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  assigneeId: z.string().uuid().nullable().optional(),
  position: z.number().int().optional(),
  dueDate: z.string().datetime().nullable().optional(),
});

export const reorderTaskSchema = z.object({
  position: z.number().int(),
  status: z.enum(["BACKLOG", "TODO", "IN_PROGRESS", "BLOCKED", "DONE"]).optional(),
});
