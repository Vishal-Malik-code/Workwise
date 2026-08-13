import { and, eq } from "drizzle-orm";
import { db, schema } from "../db/index.js";
import { createWorkspaceSchema, addMemberSchema, updateMemberRoleSchema, slugify } from "../validators/workspace.js";
import { recordAudit } from "../services/audit.service.js";

export async function createWorkspace(req, res, next) {
  try {
    const { name } = createWorkspaceSchema.parse(req.body);
    const baseSlug = slugify(name) || "workspace";
    let slug = baseSlug;
    let attempt = 0;

    while (true) {
      const [clash] = await db
        .select({ id: schema.workspaces.id })
        .from(schema.workspaces)
        .where(eq(schema.workspaces.slug, slug))
        .limit(1);
      if (!clash) break;
      attempt += 1;
      slug = `${baseSlug}-${attempt}`;
    }

    const [workspace] = await db
      .insert(schema.workspaces)
      .values({ name, slug, ownerId: req.user.id })
      .returning();

    await db.insert(schema.workspaceMembers).values({
      workspaceId: workspace.id,
      userId: req.user.id,
      role: "OWNER",
    });

    await recordAudit({ workspaceId: workspace.id, actorId: req.user.id, action: "workspace.created", targetType: "workspace", targetId: workspace.id });

    res.status(201).json({ workspace });
  } catch (err) {
    next(err);
  }
}

export async function listMyWorkspaces(req, res, next) {
  try {
    const rows = await db
      .select({ workspace: schema.workspaces, role: schema.workspaceMembers.role })
      .from(schema.workspaceMembers)
      .innerJoin(schema.workspaces, eq(schema.workspaces.id, schema.workspaceMembers.workspaceId))
      .where(eq(schema.workspaceMembers.userId, req.user.id));

    res.json({ workspaces: rows.map((r) => ({ ...r.workspace, role: r.role })) });
  } catch (err) {
    next(err);
  }
}

export async function listMembers(req, res, next) {
  try {
    const rows = await db
      .select({
        id: schema.workspaceMembers.id,
        role: schema.workspaceMembers.role,
        userId: schema.users.id,
        name: schema.users.name,
        email: schema.users.email,
      })
      .from(schema.workspaceMembers)
      .innerJoin(schema.users, eq(schema.users.id, schema.workspaceMembers.userId))
      .where(eq(schema.workspaceMembers.workspaceId, req.params.workspaceId));

    res.json({ members: rows });
  } catch (err) {
    next(err);
  }
}

export async function addMember(req, res, next) {
  try {
    const { email, role } = addMemberSchema.parse(req.body);
    const workspaceId = req.params.workspaceId;

    const [user] = await db.select().from(schema.users).where(eq(schema.users.email, email)).limit(1);
    if (!user) {
      return res.status(404).json({ error: "No user with that email" });
    }

    const [existing] = await db
      .select({ id: schema.workspaceMembers.id })
      .from(schema.workspaceMembers)
      .where(and(eq(schema.workspaceMembers.workspaceId, workspaceId), eq(schema.workspaceMembers.userId, user.id)))
      .limit(1);
    if (existing) {
      return res.status(409).json({ error: "User is already a member" });
    }

    const [member] = await db
      .insert(schema.workspaceMembers)
      .values({ workspaceId, userId: user.id, role })
      .returning();

    await recordAudit({ workspaceId, actorId: req.user.id, action: "member.added", targetType: "user", targetId: user.id, metadata: { role } });

    res.status(201).json({ member });
  } catch (err) {
    next(err);
  }
}

export async function updateMemberRole(req, res, next) {
  try {
    const { role } = updateMemberRoleSchema.parse(req.body);
    const { workspaceId, memberId } = req.params;

    const [updated] = await db
      .update(schema.workspaceMembers)
      .set({ role })
      .where(and(eq(schema.workspaceMembers.id, memberId), eq(schema.workspaceMembers.workspaceId, workspaceId)))
      .returning();

    if (!updated) {
      return res.status(404).json({ error: "Member not found" });
    }

    await recordAudit({ workspaceId, actorId: req.user.id, action: "member.role_updated", targetType: "user", targetId: updated.userId, metadata: { role } });

    res.json({ member: updated });
  } catch (err) {
    next(err);
  }
}

export async function removeMember(req, res, next) {
  try {
    const { workspaceId, memberId } = req.params;

    const [removed] = await db
      .delete(schema.workspaceMembers)
      .where(and(eq(schema.workspaceMembers.id, memberId), eq(schema.workspaceMembers.workspaceId, workspaceId)))
      .returning();

    if (!removed) {
      return res.status(404).json({ error: "Member not found" });
    }

    await recordAudit({ workspaceId, actorId: req.user.id, action: "member.removed", targetType: "user", targetId: removed.userId });

    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
