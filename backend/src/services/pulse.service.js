import { generateText, tool } from "ai";
import { groq } from "@ai-sdk/groq";
import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { db, schema } from "../db/index.js";
import { recordAudit } from "./audit.service.js";

const SYSTEM_PROMPT = `You are Pulse, the workspace assistant for Workwise. You help members create and
update tasks by proposing changes. You never write to the database directly — every change you want to
make must go through the propose_action tool, which records a pending proposal for a human to approve.`;

// Pulse's only "write" capability: stage a proposal. Nothing here touches
// the tasks/projects tables directly.
function buildProposeActionTool({ workspaceId, userId }) {
  return tool({
    description: "Propose a mutation (creating or updating a task, or creating a project) for a human to review and approve.",
    parameters: z.object({
      action: z.enum(["CREATE_TASK", "UPDATE_TASK", "DELETE_TASK", "CREATE_PROJECT"]),
      summary: z.string().describe("One sentence, human-readable description of the proposed change"),
      payload: z.record(z.any()).describe("The data needed to apply the action, e.g. { projectId, title, priority }"),
    }),
    execute: async ({ action, summary, payload }) => {
      const [proposal] = await db
        .insert(schema.aiActionProposals)
        .values({ workspaceId, requestedById: userId, action, summary, payload })
        .returning();
      return { proposalId: proposal.id, status: "PENDING" };
    },
  });
}

export async function askPulse({ workspaceId, userId, message }) {
  const result = await generateText({
    model: groq("llama-3.3-70b-versatile"),
    system: SYSTEM_PROMPT,
    prompt: message,
    tools: { propose_action: buildProposeActionTool({ workspaceId, userId }) },
    maxSteps: 3,
  });

  return { reply: result.text };
}

async function applyProposal(proposal) {
  const { action, payload, workspaceId } = proposal;

  switch (action) {
    case "CREATE_TASK": {
      const [task] = await db
        .insert(schema.tasks)
        .values({
          workspaceId,
          projectId: payload.projectId,
          title: payload.title,
          description: payload.description,
          priority: payload.priority ?? "MEDIUM",
          assigneeId: payload.assigneeId ?? null,
          createdById: proposal.requestedById,
        })
        .returning();
      return { targetType: "task", targetId: task.id };
    }
    case "UPDATE_TASK": {
      const { taskId, ...patch } = payload;
      const [task] = await db
        .update(schema.tasks)
        .set(patch)
        .where(and(eq(schema.tasks.id, taskId), eq(schema.tasks.workspaceId, workspaceId)))
        .returning();
      return { targetType: "task", targetId: task?.id ?? taskId };
    }
    case "DELETE_TASK": {
      await db.delete(schema.tasks).where(and(eq(schema.tasks.id, payload.taskId), eq(schema.tasks.workspaceId, workspaceId)));
      return { targetType: "task", targetId: payload.taskId };
    }
    case "CREATE_PROJECT": {
      const [project] = await db
        .insert(schema.projects)
        .values({ workspaceId, name: payload.name, description: payload.description, createdById: proposal.requestedById })
        .returning();
      return { targetType: "project", targetId: project.id };
    }
    default:
      throw new Error(`Unknown proposal action: ${action}`);
  }
}

export async function reviewProposal({ proposal, reviewerId, approve }) {
  const status = approve ? "APPROVED" : "REJECTED";

  const [updated] = await db
    .update(schema.aiActionProposals)
    .set({ status, reviewedById: reviewerId, reviewedAt: new Date() })
    .where(eq(schema.aiActionProposals.id, proposal.id))
    .returning();

  if (approve) {
    const { targetType, targetId } = await applyProposal(proposal);
    await recordAudit({
      workspaceId: proposal.workspaceId,
      actorId: reviewerId,
      action: "ai_proposal.approved",
      targetType,
      targetId,
      metadata: { proposalId: proposal.id },
    });
  } else {
    await recordAudit({
      workspaceId: proposal.workspaceId,
      actorId: reviewerId,
      action: "ai_proposal.rejected",
      targetType: "ai_action_proposal",
      targetId: proposal.id,
    });
  }

  return updated;
}
