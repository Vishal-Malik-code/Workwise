import type { NextFunction, Request, Response } from "express";
import { and, eq } from "drizzle-orm";
import { db, schema } from "../db/index.js";
import { AppError } from "../utils/AppError.js";

export type WorkspaceRole = "OWNER" | "ADMIN" | "MANAGER" | "MEMBER" | "VIEWER";

export const ROLE_RANK: Record<WorkspaceRole, number> = {
  VIEWER: 1,
  MEMBER: 2,
  MANAGER: 3,
  ADMIN: 4,
  OWNER: 5,
};

// Loads the caller's membership for :workspaceId (or req.body.workspaceId)
// and attaches it as req.membership so downstream handlers can read the role.
export async function loadMembership(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    const workspaceId = (req.params.workspaceId as string) || req.body?.workspaceId;
    if (!workspaceId) {
      throw AppError.badRequest("workspaceId is required");
    }
    if (!req.user) {
      throw AppError.unauthorized();
    }

    const [membership] = await db
      .select()
      .from(schema.workspaceMembers)
      .where(
        and(
          eq(schema.workspaceMembers.workspaceId, workspaceId),
          eq(schema.workspaceMembers.userId, req.user.id),
        ),
      )
      .limit(1);

    if (!membership) {
      throw AppError.forbidden("Not a member of this workspace");
    }

    req.membership = membership as Express.Membership;
    next();
  } catch (err) {
    next(err);
  }
}

// Returns middleware that 403s unless the caller's role in the workspace
// meets or exceeds minRole in the OWNER > ADMIN > MANAGER > MEMBER > VIEWER hierarchy.
export function requireWorkspaceRole(minRole: WorkspaceRole) {
  const minRank = ROLE_RANK[minRole];
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.membership) {
      return next(AppError.internalError("loadMembership must run before requireWorkspaceRole"));
    }
    if (ROLE_RANK[req.membership.role] < minRank) {
      return next(AppError.forbidden(`Requires ${minRole} role or higher`));
    }
    next();
  };
}

export const requireWorkspaceMember = requireWorkspaceRole("VIEWER");
export const requireWorkspaceContributor = requireWorkspaceRole("MEMBER");
export const requireWorkspaceManager = requireWorkspaceRole("MANAGER");
export const requireWorkspaceAdmin = requireWorkspaceRole("ADMIN");
export const requireWorkspaceOwner = requireWorkspaceRole("OWNER");
