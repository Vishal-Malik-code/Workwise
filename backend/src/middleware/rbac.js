import { and, eq } from "drizzle-orm";
import { db, schema } from "../db/index.js";

const ROLE_RANK = {
  OWNER: 4,
  ADMIN: 3,
  MANAGER: 2,
  MEMBER: 1,
  VIEWER: 0,
};

// Loads the caller's membership for :workspaceId (or req.body.workspaceId)
// and attaches it as req.membership so downstream handlers can read the role.
export async function loadMembership(req, res, next) {
  try {
    const workspaceId = req.params.workspaceId || req.body.workspaceId;
    if (!workspaceId) {
      return res.status(400).json({ error: "workspaceId is required" });
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
      return res.status(403).json({ error: "Not a member of this workspace" });
    }

    req.membership = membership;
    next();
  } catch (err) {
    next(err);
  }
}

// Returns middleware that 403s unless the caller's role in the workspace
// meets or exceeds minRole in the OWNER > ADMIN > MANAGER > MEMBER > VIEWER hierarchy.
export function requireRole(minRole) {
  const minRank = ROLE_RANK[minRole];
  return (req, res, next) => {
    if (!req.membership) {
      return res.status(500).json({ error: "loadMembership must run before requireRole" });
    }
    if (ROLE_RANK[req.membership.role] < minRank) {
      return res.status(403).json({ error: `Requires ${minRole} role or higher` });
    }
    next();
  };
}

export { ROLE_RANK };
