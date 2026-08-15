import { z } from "zod";

export const createWorkspaceSchema = z.object({
  name: z.string().min(1).max(120),
});

export const updateWorkspaceSchema = z.object({
  name: z.string().min(1).max(120).optional(),
});

export const transferOwnershipSchema = z.object({
  newOwnerMemberId: z.string().uuid(),
});

export const deleteWorkspaceSchema = z.object({
  confirmationName: z.string().min(1),
});

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 128);
}
