import { generateText, tool } from "ai";
import { groq } from "@ai-sdk/groq";
import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { db, schema } from "../db/index.js";
import { recordAudit } from "./audit.service.js";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const TASK_PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"];
const TASK_STATUSES = ["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"];

// The model tends to write enum values in natural-language casing (e.g.
// "high" instead of "HIGH"). Normalize in place so a minor casing choice
// doesn't fail the whole proposal at approval time.
function normalizeEnumFields(payload) {
  if (typeof payload.priority === "string") payload.priority = payload.priority.toUpperCase();
  if (typeof payload.status === "string") payload.status = payload.status.toUpperCase();
}

const SYSTEM_PROMPT_TEMPLATE = (projects) => `You are Pulse, the workspace assistant for Workwise. You help members create and
update tasks by proposing changes. You never write to the database directly — every change you want to
make must go through the propose_action tool, which records a pending proposal for a human to approve.

When an action needs a projectId or taskId, you must use a real id from this workspace — never invent one
or use a project's name as its id. Existing projects in this workspace:
${projects.length ? projects.map((p) => `- id=${p.id} name="${p.name}"`).join("\n") : "(none yet)"}

Call propose_action at most once per requested change. Do not call it multiple times for the same request.`;

// Verifies that any project/task id referenced in a proposal payload is a
// real, well-formed id belonging to this workspace, before the proposal is
// ever stored — so a bad id fails fast for the model instead of surfacing as
// a raw DB error when a human later approves it.
async function validateProposalPayload(workspaceId, action, payload) {
  const isUuid = (v) => typeof v === "string" && UUID_RE.test(v);

  if (action === "CREATE_TASK" || action === "UPDATE_TASK") {
    if (payload.priority !== undefined && !TASK_PRIORITIES.includes(payload.priority)) {
      return `"${payload.priority}" is not a valid priority. Use one of: ${TASK_PRIORITIES.join(", ")}.`;
    }
  }
  if (action === "UPDATE_TASK") {
    if (payload.status !== undefined && !TASK_STATUSES.includes(payload.status)) {
      return `"${payload.status}" is not a valid status. Use one of: ${TASK_STATUSES.join(", ")}.`;
    }
  }

  if (action === "CREATE_TASK") {
    if (!isUuid(payload.projectId)) {
      return `"${payload.projectId}" is not a valid project id. Use the real id from the projects list, not the project's name.`;
    }
    const [project] = await db
      .select({ id: schema.projects.id })
      .from(schema.projects)
      .where(and(eq(schema.projects.id, payload.projectId), eq(schema.projects.workspaceId, workspaceId)))
      .limit(1);
    if (!project) return `No project with id ${payload.projectId} exists in this workspace.`;
  }

  if (action === "UPDATE_TASK" || action === "DELETE_TASK") {
    if (!isUuid(payload.taskId)) {
      return `"${payload.taskId}" is not a valid task id.`;
    }
    const [task] = await db
      .select({ id: schema.tasks.id })
      .from(schema.tasks)
      .where(and(eq(schema.tasks.id, payload.taskId), eq(schema.tasks.workspaceId, workspaceId)))
      .limit(1);
    if (!task) return `No task with id ${payload.taskId} exists in this workspace.`;
  }

  return null;
}

// Pulse's only "write" capability: stage a proposal. Nothing here touches
// the tasks/projects tables directly.
function buildProposeActionTool({ workspaceId, userId }) {
  // Some models emit more than one tool call for a single requested change
  // (e.g. via parallel tool calls). Dedupe identical calls within one
  // askPulse request so we don't create duplicate pending proposals.
  const seen = new Map();

  return tool({
    description: "Propose a mutation (creating or updating a task, or creating a project) for a human to review and approve.",
    parameters: z.object({
      action: z.enum(["CREATE_TASK", "UPDATE_TASK", "DELETE_TASK", "CREATE_PROJECT"]),
      summary: z.string().describe("One sentence, human-readable description of the proposed change"),
      payload: z.record(z.any()).describe("The data needed to apply the action, e.g. { projectId, title, priority }"),
    }),
    execute: async ({ action, summary, payload }) => {
      normalizeEnumFields(payload);

      const key = `${action}:${JSON.stringify(payload)}`;
      if (seen.has(key)) {
        return { proposalId: seen.get(key), status: "PENDING", note: "Duplicate call for the same change — reusing the existing proposal." };
      }

      const validationError = await validateProposalPayload(workspaceId, action, payload);
      if (validationError) {
        return { error: validationError };
      }

      const [proposal] = await db
        .insert(schema.aiActionProposals)
        .values({ workspaceId, requestedById: userId, action, summary, payload })
        .returning();

      seen.set(key, proposal.id);
      return { proposalId: proposal.id, status: "PENDING" };
    },
  });
}

export async function askPulse({ workspaceId, userId, message }) {
  const projects = await db
    .select({ id: schema.projects.id, name: schema.projects.name })
    .from(schema.projects)
    .where(eq(schema.projects.workspaceId, workspaceId));

  const result = await generateText({
    model: groq("llama-3.3-70b-versatile"),
    system: SYSTEM_PROMPT_TEMPLATE(projects),
    prompt: message,
    tools: { propose_action: buildProposeActionTool({ workspaceId, userId }) },
    maxSteps: 3,
  });

  return { reply: result.text };
}

async function applyProposal(tx, proposal) {
  const { action, payload, workspaceId } = proposal;

  switch (action) {
    case "CREATE_TASK": {
      const [task] = await tx
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
      const [task] = await tx
        .update(schema.tasks)
        .set(patch)
        .where(and(eq(schema.tasks.id, taskId), eq(schema.tasks.workspaceId, workspaceId)))
        .returning();
      return { targetType: "task", targetId: task?.id ?? taskId };
    }
    case "DELETE_TASK": {
      await tx.delete(schema.tasks).where(and(eq(schema.tasks.id, payload.taskId), eq(schema.tasks.workspaceId, workspaceId)));
      return { targetType: "task", targetId: payload.taskId };
    }
    case "CREATE_PROJECT": {
      const [project] = await tx
        .insert(schema.projects)
        .values({ workspaceId, name: payload.name, description: payload.description, createdById: proposal.requestedById })
        .returning();
      return { targetType: "project", targetId: project.id };
    }
    default:
      throw new Error(`Unknown proposal action: ${action}`);
  }
}

// Applying an approved proposal can fail (e.g. the referenced task was
// deleted since the proposal was made). Wrapping the status update and the
// apply in one transaction means a failed apply rolls back the status
// change too, instead of leaving the proposal stuck as APPROVED with
// nothing actually applied.
export async function reviewProposal({ proposal, reviewerId, approve }) {
  const status = approve ? "APPROVED" : "REJECTED";

  return db.transaction(async (tx) => {
    const [updated] = await tx
      .update(schema.aiActionProposals)
      .set({ status, reviewedById: reviewerId, reviewedAt: new Date() })
      .where(eq(schema.aiActionProposals.id, proposal.id))
      .returning();

    if (approve) {
      const { targetType, targetId } = await applyProposal(tx, proposal);
      await recordAudit({
        dbClient: tx,
        workspaceId: proposal.workspaceId,
        actorId: reviewerId,
        action: "ai_proposal.approved",
        targetType,
        targetId,
        metadata: { proposalId: proposal.id },
      });
    } else {
      await recordAudit({
        dbClient: tx,
        workspaceId: proposal.workspaceId,
        actorId: reviewerId,
        action: "ai_proposal.rejected",
        targetType: "ai_action_proposal",
        targetId: proposal.id,
      });
    }

    return updated;
  });
}
