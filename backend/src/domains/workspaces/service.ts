import { and, eq } from "drizzle-orm";
import { db, schema } from "../../db/index.js";
import { AppError } from "../../utils/AppError.js";
import { recordAudit } from "../activity/service.js";
import { slugify } from "./schemas.js";

export async function createWorkspace(ownerId: string, name: string) {
  const baseSlug = slugify(name) || "workspace";
  let slug = baseSlug;
  let attempt = 0;

  // Retry with a numeric suffix until we land on a free slug.
  // eslint-disable-next-line no-constant-condition
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

  const workspace = await db.transaction(async (tx) => {
    const [ws] = await tx
      .insert(schema.workspaces)
      .values({ name, slug, ownerId })
      .returning();

    await tx.insert(schema.workspaceMembers).values({
      workspaceId: ws.id,
      userId: ownerId,
      role: "OWNER",
    });

    await recordAudit({
      dbClient: tx,
      workspaceId: ws.id,
      actorId: ownerId,
      action: "workspace.created",
      targetType: "workspace",
      targetId: ws.id,
    });

    return ws;
  });

  return workspace;
}

export async function listMyWorkspaces(userId: string) {
  const rows = await db
    .select({ workspace: schema.workspaces, role: schema.workspaceMembers.role })
    .from(schema.workspaceMembers)
    .innerJoin(schema.workspaces, eq(schema.workspaces.id, schema.workspaceMembers.workspaceId))
    .where(eq(schema.workspaceMembers.userId, userId));

  return rows.map((r) => ({ ...r.workspace, role: r.role }));
}

export async function getWorkspace(workspaceId: string) {
  const [workspace] = await db
    .select()
    .from(schema.workspaces)
    .where(eq(schema.workspaces.id, workspaceId))
    .limit(1);
  if (!workspace) throw AppError.notFound("Workspace not found");
  return workspace;
}

export async function updateWorkspace(workspaceId: string, actorId: string, patch: { name?: string }) {
  const [updated] = await db
    .update(schema.workspaces)
    .set({ ...patch, updatedAt: new Date() })
    .where(eq(schema.workspaces.id, workspaceId))
    .returning();
  if (!updated) throw AppError.notFound("Workspace not found");

  await recordAudit({
    workspaceId,
    actorId,
    action: "workspace.updated",
    targetType: "workspace",
    targetId: workspaceId,
    metadata: patch,
  });

  return updated;
}

export async function deleteWorkspace(workspaceId: string, actorId: string, confirmationName: string) {
  const workspace = await getWorkspace(workspaceId);
  if (confirmationName !== workspace.name) {
    throw AppError.badRequest("Confirmation name does not match the workspace name");
  }

  // Audit row is recorded before deletion because audit_logs.workspaceId
  // cascades on workspace delete — a post-delete insert would fail its FK.
  await recordAudit({
    workspaceId,
    actorId,
    action: "workspace.deleted",
    targetType: "workspace",
    targetId: workspaceId,
  });

  const [deleted] = await db
    .delete(schema.workspaces)
    .where(eq(schema.workspaces.id, workspaceId))
    .returning();
  if (!deleted) throw AppError.notFound("Workspace not found");
}

export async function transferOwnership(workspaceId: string, actorId: string, newOwnerMemberId: string) {
  const updated = await db.transaction(async (tx) => {
    const [target] = await tx
      .select()
      .from(schema.workspaceMembers)
      .where(
        and(
          eq(schema.workspaceMembers.id, newOwnerMemberId),
          eq(schema.workspaceMembers.workspaceId, workspaceId),
        ),
      )
      .limit(1);
    if (!target) throw AppError.notFound("Member not found in this workspace");

    if (target.role === "OWNER") {
      throw AppError.conflict("Member is already the workspace owner");
    }

    const [currentOwner] = await tx
      .select()
      .from(schema.workspaceMembers)
      .where(
        and(
          eq(schema.workspaceMembers.workspaceId, workspaceId),
          eq(schema.workspaceMembers.role, "OWNER"),
        ),
      )
      .limit(1);
    if (!currentOwner) throw AppError.internalError("Workspace has no current owner");

    // Demote the current owner first so the unique-OWNER partial index
    // never sees two OWNER rows for this workspace at once.
    await tx
      .update(schema.workspaceMembers)
      .set({ role: "ADMIN" })
      .where(eq(schema.workspaceMembers.id, currentOwner.id));

    const [promoted] = await tx
      .update(schema.workspaceMembers)
      .set({ role: "OWNER" })
      .where(eq(schema.workspaceMembers.id, target.id))
      .returning();

    await tx
      .update(schema.workspaces)
      .set({ ownerId: promoted.userId, updatedAt: new Date() })
      .where(eq(schema.workspaces.id, workspaceId));

    await recordAudit({
      dbClient: tx,
      workspaceId,
      actorId,
      action: "workspace.ownership_transferred",
      targetType: "user",
      targetId: promoted.userId,
      metadata: { fromMemberId: currentOwner.id, toMemberId: promoted.id },
    });

    return promoted;
  });

  return updated;
}
