import { and, eq } from "drizzle-orm";
import { db, schema } from "../../db/index.js";
import { AppError } from "../../utils/AppError.js";
import { recordAudit } from "../activity/service.js";
import { emitWorkspaceEvent } from "../../utils/socketEvents.js";

export async function listMembers(workspaceId: string) {
  return db
    .select({
      id: schema.workspaceMembers.id,
      role: schema.workspaceMembers.role,
      userId: schema.users.id,
      name: schema.users.name,
      email: schema.users.email,
    })
    .from(schema.workspaceMembers)
    .innerJoin(schema.users, eq(schema.users.id, schema.workspaceMembers.userId))
    .where(eq(schema.workspaceMembers.workspaceId, workspaceId));
}

export async function addMember(workspaceId: string, actorId: string, email: string, role: string) {
  const [user] = await db.select().from(schema.users).where(eq(schema.users.email, email)).limit(1);
  if (!user) throw AppError.notFound("No user with that email");

  const [existing] = await db
    .select({ id: schema.workspaceMembers.id })
    .from(schema.workspaceMembers)
    .where(and(eq(schema.workspaceMembers.workspaceId, workspaceId), eq(schema.workspaceMembers.userId, user.id)))
    .limit(1);
  if (existing) throw AppError.conflict("User is already a member");

  const [member] = await db
    .insert(schema.workspaceMembers)
    .values({ workspaceId, userId: user.id, role: role as never })
    .returning();

  await recordAudit({
    workspaceId,
    actorId,
    action: "member.added",
    targetType: "user",
    targetId: user.id,
    metadata: { role },
  });

  emitWorkspaceEvent(workspaceId, "member", "added", { member });

  return member;
}

export async function updateMemberRole(workspaceId: string, actorId: string, memberId: string, role: string) {
  const [target] = await db
    .select()
    .from(schema.workspaceMembers)
    .where(and(eq(schema.workspaceMembers.id, memberId), eq(schema.workspaceMembers.workspaceId, workspaceId)))
    .limit(1);
  if (!target) throw AppError.notFound("Member not found");

  if (target.role === "OWNER" && role !== "OWNER") {
    throw AppError.conflict("Cannot demote the sole workspace owner");
  }

  const [updated] = await db
    .update(schema.workspaceMembers)
    .set({ role: role as never })
    .where(and(eq(schema.workspaceMembers.id, memberId), eq(schema.workspaceMembers.workspaceId, workspaceId)))
    .returning();

  await recordAudit({
    workspaceId,
    actorId,
    action: "member.role_updated",
    targetType: "user",
    targetId: updated.userId,
    metadata: { role },
  });

  emitWorkspaceEvent(workspaceId, "member", "updated", { member: updated });

  return updated;
}

export async function removeMember(workspaceId: string, actorId: string, memberId: string) {
  const [target] = await db
    .select()
    .from(schema.workspaceMembers)
    .where(and(eq(schema.workspaceMembers.id, memberId), eq(schema.workspaceMembers.workspaceId, workspaceId)))
    .limit(1);
  if (!target) throw AppError.notFound("Member not found");

  if (target.role === "OWNER") {
    throw AppError.conflict("Cannot remove the sole workspace owner");
  }

  const [removed] = await db
    .delete(schema.workspaceMembers)
    .where(and(eq(schema.workspaceMembers.id, memberId), eq(schema.workspaceMembers.workspaceId, workspaceId)))
    .returning();

  await recordAudit({
    workspaceId,
    actorId,
    action: "member.removed",
    targetType: "user",
    targetId: removed.userId,
  });

  emitWorkspaceEvent(workspaceId, "member", "removed", { memberId });
}
