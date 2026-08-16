import { generateText } from "ai";
import { and, desc, eq, lt } from "drizzle-orm";
import { db, schema } from "../../db/index.js";
import type { Tx } from "../../db/index.js";
import { AppError } from "../../utils/AppError.js";
import { getPagination, type PaginationInput } from "../../utils/pagination.js";
import { emitWorkspaceEvent } from "../../utils/socketEvents.js";
import { recordAudit } from "../activity/service.js";
import { pulseModel } from "../../ai/provider.js";
import { buildReadTools, buildWriteTools } from "../../ai/tools.js";
import { env } from "../../config/env.js";

const SYSTEM_PROMPT = `You are Pulse, the workspace assistant for Workwise. You help members understand
their workspace and propose task/comment changes. You never write to the database directly — every
change you want to make must go through one of the propose_* tools, which records a pending proposal
for a human to approve. Refer to projects, tasks, and members by name — never invent or assume an id.
Call a propose_* tool at most once per requested change.

For questions about how many projects exist, or an overview of the whole workspace, call listProjects
first — never answer from findTasks alone, since a workspace can have projects with no tasks yet. For
questions about one specific project (its description, task breakdown, etc), call getProjectSummary
with that project's name. Only state facts a tool actually returned; if a tool returns no matching
project or an empty list, say so plainly instead of guessing.`;

export async function askPulse(workspaceId: string, userId: string, message: string) {
  if (!env.AI_ENABLED) {
    throw AppError.serviceUnavailable("The assistant is currently disabled");
  }

  const ctx = { workspaceId, userId };
  const result = await generateText({
    model: pulseModel,
    system: SYSTEM_PROMPT,
    prompt: message,
    tools: { ...buildReadTools(ctx), ...buildWriteTools(ctx) },
    maxSteps: 5,
  });

  return { reply: result.text };
}

async function expireStaleProposals(workspaceId: string) {
  await db
    .update(schema.aiActionProposals)
    .set({ status: "EXPIRED" })
    .where(
      and(
        eq(schema.aiActionProposals.workspaceId, workspaceId),
        eq(schema.aiActionProposals.status, "PENDING"),
        lt(schema.aiActionProposals.expiresAt, new Date()),
      ),
    );
}

export async function listProposals(workspaceId: string, filters: { status?: string } & PaginationInput) {
  // Lazily expire anything past its TTL before listing.
  await expireStaleProposals(workspaceId);

  const { limit, offset, page } = getPagination(filters);
  const conditions = [eq(schema.aiActionProposals.workspaceId, workspaceId)];
  if (filters.status) {
    conditions.push(eq(schema.aiActionProposals.status, filters.status as never));
  }

  const rows = await db
    .select()
    .from(schema.aiActionProposals)
    .where(and(...conditions))
    .orderBy(desc(schema.aiActionProposals.createdAt))
    .limit(limit)
    .offset(offset);

  return { items: rows, page, limit };
}

async function applyProposal(tx: Tx, proposal: typeof schema.aiActionProposals.$inferSelect) {
  const { action, payload, workspaceId } = proposal as {
    action: string;
    payload: Record<string, unknown>;
    workspaceId: string;
  };

  switch (action) {
    case "CREATE_TASK": {
      const [task] = await tx
        .insert(schema.tasks)
        .values({
          workspaceId,
          projectId: payload.projectId as string,
          title: payload.title as string,
          description: payload.description as string | undefined,
          priority: (payload.priority as never) ?? "MEDIUM",
          assigneeId: (payload.assigneeId as string | null) ?? null,
          createdById: proposal.requestedById,
        })
        .returning();
      return { targetType: "task" as const, targetId: task.id };
    }
    case "UPDATE_TASK": {
      const { taskId, ...patch } = payload as { taskId: string; [k: string]: unknown };
      const cleanPatch = Object.fromEntries(Object.entries(patch).filter(([, v]) => v !== undefined));
      const [task] = await tx
        .update(schema.tasks)
        .set({ ...cleanPatch, updatedAt: new Date() })
        .where(and(eq(schema.tasks.id, taskId), eq(schema.tasks.workspaceId, workspaceId)))
        .returning();
      if (!task) throw AppError.notFound("Task no longer exists");
      return { targetType: "task" as const, targetId: task.id };
    }
    case "ADD_COMMENT": {
      const [comment] = await tx
        .insert(schema.comments)
        .values({ taskId: payload.taskId as string, authorId: proposal.requestedById, body: payload.body as string })
        .returning();
      return { targetType: "comment" as const, targetId: comment.id };
    }
    default:
      throw new Error(`Unknown proposal action: ${action}`);
  }
}

export async function decideProposal(
  workspaceId: string,
  proposalId: string,
  reviewerId: string,
  reviewerRole: string,
  approve: boolean,
) {
  if (reviewerRole === "VIEWER") {
    throw AppError.forbidden("VIEWER cannot approve or reject proposals");
  }

  const [proposal] = await db
    .select()
    .from(schema.aiActionProposals)
    .where(and(eq(schema.aiActionProposals.id, proposalId), eq(schema.aiActionProposals.workspaceId, workspaceId)))
    .limit(1);

  if (!proposal) throw AppError.notFound("Proposal not found");

  if (proposal.expiresAt.getTime() < Date.now() && proposal.status === "PENDING") {
    await db.update(schema.aiActionProposals).set({ status: "EXPIRED" }).where(eq(schema.aiActionProposals.id, proposal.id));
    throw AppError.gone("Proposal has expired");
  }

  if (proposal.status !== "PENDING") {
    throw AppError.conflict("Proposal already reviewed");
  }

  if (!approve) {
    const [updated] = await db
      .update(schema.aiActionProposals)
      .set({ status: "REJECTED", reviewedById: reviewerId, reviewedAt: new Date() })
      .where(eq(schema.aiActionProposals.id, proposal.id))
      .returning();

    await recordAudit({
      workspaceId,
      actorId: reviewerId,
      action: "ai_proposal.rejected",
      targetType: "ai_action_proposal",
      targetId: proposal.id,
    });

    return updated;
  }

  // Mark APPROVED first, then attempt to execute. If execution fails, roll
  // the status forward to FAILED (not back to PENDING) so it isn't silently
  // retried against possibly-partial state.
  await db
    .update(schema.aiActionProposals)
    .set({ status: "APPROVED", reviewedById: reviewerId, reviewedAt: new Date() })
    .where(eq(schema.aiActionProposals.id, proposal.id));

  try {
    const { targetType, targetId } = await db.transaction(async (tx) => {
      const applied = await applyProposal(tx, proposal);
      await tx
        .update(schema.aiActionProposals)
        .set({ status: "EXECUTED" })
        .where(eq(schema.aiActionProposals.id, proposal.id));
      await recordAudit({
        dbClient: tx,
        workspaceId,
        actorId: reviewerId,
        action: "ai_proposal.approved",
        targetType: applied.targetType,
        targetId: applied.targetId,
        metadata: { proposalId: proposal.id },
      });
      return applied;
    });

    emitWorkspaceEvent(workspaceId, "assistant", "proposal_executed", { proposalId: proposal.id, targetType, targetId });

    const [final] = await db
      .select()
      .from(schema.aiActionProposals)
      .where(eq(schema.aiActionProposals.id, proposal.id))
      .limit(1);
    return final;
  } catch (err) {
    await db.update(schema.aiActionProposals).set({ status: "FAILED" }).where(eq(schema.aiActionProposals.id, proposal.id));
    await recordAudit({
      workspaceId,
      actorId: reviewerId,
      action: "ai_proposal.failed",
      targetType: "ai_action_proposal",
      targetId: proposal.id,
      metadata: { error: err instanceof Error ? err.message : String(err) },
    });
    throw err;
  }
}
