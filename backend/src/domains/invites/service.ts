import crypto from "node:crypto";
import { and, eq } from "drizzle-orm";
import { db, schema } from "../../db/index.js";
import { AppError } from "../../utils/AppError.js";
import { recordAudit } from "../activity/service.js";
import { emitWorkspaceEvent, emitUserEvent } from "../../utils/socketEvents.js";
import { env } from "../../config/env.js";

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function createInvite(
  workspaceId: string,
  actorId: string,
  email: string,
  role: "ADMIN" | "MANAGER" | "MEMBER" | "VIEWER",
) {
  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + INVITE_TTL_MS);

  const [invite] = await db
    .insert(schema.workspaceInvites)
    .values({ workspaceId, email, role, invitedById: actorId, tokenHash, expiresAt })
    .returning();

  await recordAudit({
    workspaceId,
    actorId,
    action: "invite.created",
    targetType: "invite",
    targetId: invite.id,
    metadata: { email, role },
  });

  emitWorkspaceEvent(workspaceId, "invite", "created", { invite });

  // NOTE: production needs an out-of-band delivery mechanism (e.g. email).
  // That integration is a known gap — for now the raw token is only
  // returned to the caller when running under the test environment so
  // integration tests can exercise the accept/decline flow end-to-end.
  return { invite, token: env.NODE_ENV === "test" ? token : undefined };
}

export async function listPendingInvites(workspaceId: string) {
  return db
    .select()
    .from(schema.workspaceInvites)
    .where(and(eq(schema.workspaceInvites.workspaceId, workspaceId), eq(schema.workspaceInvites.status, "PENDING")));
}

async function findInviteByToken(token: string) {
  const tokenHash = hashToken(token);
  const [invite] = await db
    .select()
    .from(schema.workspaceInvites)
    .where(eq(schema.workspaceInvites.tokenHash, tokenHash))
    .limit(1);
  if (!invite) throw AppError.notFound("Invite not found");

  if (invite.status !== "PENDING") {
    throw AppError.gone("Invite is no longer pending");
  }
  if (invite.expiresAt.getTime() < Date.now()) {
    await db.update(schema.workspaceInvites).set({ status: "EXPIRED" }).where(eq(schema.workspaceInvites.id, invite.id));
    throw AppError.gone("Invite has expired");
  }

  return invite;
}

export async function acceptInvite(token: string, userId: string, userEmail: string) {
  const invite = await findInviteByToken(token);

  if (invite.email.toLowerCase() !== userEmail.toLowerCase()) {
    throw AppError.forbidden("This invite was issued to a different email address");
  }

  const [existingMember] = await db
    .select({ id: schema.workspaceMembers.id })
    .from(schema.workspaceMembers)
    .where(and(eq(schema.workspaceMembers.workspaceId, invite.workspaceId), eq(schema.workspaceMembers.userId, userId)))
    .limit(1);

  await db.transaction(async (tx) => {
    if (!existingMember) {
      await tx.insert(schema.workspaceMembers).values({
        workspaceId: invite.workspaceId,
        userId,
        role: invite.role,
      });
    }

    await tx
      .update(schema.workspaceInvites)
      .set({ status: "ACCEPTED" })
      .where(eq(schema.workspaceInvites.id, invite.id));

    await recordAudit({
      dbClient: tx,
      workspaceId: invite.workspaceId,
      actorId: userId,
      action: "invite.accepted",
      targetType: "invite",
      targetId: invite.id,
    });
  });

  emitWorkspaceEvent(invite.workspaceId, "member", "added", { userId });
  emitUserEvent(userId, "invite", "accepted", { workspaceId: invite.workspaceId });

  return { workspaceId: invite.workspaceId };
}

export async function declineInvite(token: string, userId: string) {
  const invite = await findInviteByToken(token);

  await db
    .update(schema.workspaceInvites)
    .set({ status: "DECLINED" })
    .where(eq(schema.workspaceInvites.id, invite.id));

  await recordAudit({
    workspaceId: invite.workspaceId,
    actorId: userId,
    action: "invite.declined",
    targetType: "invite",
    targetId: invite.id,
  });

  return { workspaceId: invite.workspaceId };
}
