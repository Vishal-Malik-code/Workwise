import { tool } from "ai";
import { z } from "zod";
import { and, desc, eq } from "drizzle-orm";
import { db, schema } from "../db/index.js";
import { resolveName } from "./resolution.js";

const PROPOSAL_TTL_MS = 15 * 60 * 1000;

// Groq sometimes emits `null` (instead of `{}`) as the arguments for a
// tool call, which fails Zod object validation outright. Coerce
// null/undefined to {} before validating so zero/optional-arg tool calls
// don't 500 the whole request.
function toolParams<T extends z.ZodRawShape>(shape: T) {
  return z.preprocess((v) => v ?? {}, z.object(shape)) as unknown as z.ZodObject<T>;
}

export interface ToolContext {
  workspaceId: string;
  userId: string;
}

// Read tools: workspace-scoped server-side via closure over `ctx`, never
// accept a raw workspaceId argument from the model.
export function buildReadTools(ctx: ToolContext) {
  return {
    findTasks: tool({
      description: "Search tasks in this workspace by title substring and/or status.",
      parameters: toolParams({
        titleContains: z.string().optional(),
        status: z.enum(["BACKLOG", "TODO", "IN_PROGRESS", "BLOCKED", "DONE"]).optional(),
      }),
      execute: async ({ status }) => {
        const rows = await db
          .select()
          .from(schema.tasks)
          .where(
            status
              ? and(eq(schema.tasks.workspaceId, ctx.workspaceId), eq(schema.tasks.status, status))
              : eq(schema.tasks.workspaceId, ctx.workspaceId),
          )
          .limit(25);
        return rows;
      },
    }),

    listProjects: tool({
      description:
        "List every project in this workspace, with its description and task counts by status. Use this to answer questions about how many projects exist or to get an overview before drilling into one.",
      parameters: toolParams({}),
      execute: async () => {
        const projects = await db
          .select()
          .from(schema.projects)
          .where(eq(schema.projects.workspaceId, ctx.workspaceId));
        const tasks = await db.select().from(schema.tasks).where(eq(schema.tasks.workspaceId, ctx.workspaceId));

        return {
          projectCount: projects.length,
          projects: projects.map((p) => {
            const projectTasks = tasks.filter((t) => t.projectId === p.id);
            const counts: Record<string, number> = {};
            for (const t of projectTasks) counts[t.status] = (counts[t.status] ?? 0) + 1;
            return {
              name: p.name,
              description: p.description ?? null,
              createdAt: p.createdAt,
              taskCount: projectTasks.length,
              counts,
            };
          }),
        };
      },
    }),

    getProjectSummary: tool({
      description: "Get one project's description and task counts by status, resolved by project name.",
      parameters: toolParams({ projectName: z.string() }),
      execute: async ({ projectName }) => {
        const projectId = await resolveName(ctx.workspaceId, "project", projectName);
        if (!projectId) return { error: `No project matching "${projectName}"` };
        const [project] = await db.select().from(schema.projects).where(eq(schema.projects.id, projectId));
        const rows = await db.select().from(schema.tasks).where(eq(schema.tasks.projectId, projectId));
        const counts: Record<string, number> = {};
        for (const t of rows) counts[t.status] = (counts[t.status] ?? 0) + 1;
        return {
          projectId,
          name: project?.name,
          description: project?.description ?? null,
          createdAt: project?.createdAt,
          taskCount: rows.length,
          counts,
        };
      },
    }),

    getWorkspaceMembers: tool({
      description: "List members of this workspace.",
      parameters: toolParams({}),
      execute: async () => {
        return db
          .select({ userId: schema.users.id, name: schema.users.name, role: schema.workspaceMembers.role })
          .from(schema.workspaceMembers)
          .innerJoin(schema.users, eq(schema.users.id, schema.workspaceMembers.userId))
          .where(eq(schema.workspaceMembers.workspaceId, ctx.workspaceId));
      },
    }),

    getRecentActivity: tool({
      description: "Get the most recent audit log entries for this workspace.",
      parameters: toolParams({ limit: z.number().int().min(1).max(50).default(10) }),
      execute: async ({ limit }) => {
        return db
          .select()
          .from(schema.auditLogs)
          .where(eq(schema.auditLogs.workspaceId, ctx.workspaceId))
          .orderBy(desc(schema.auditLogs.createdAt))
          .limit(limit);
      },
    }),
  };
}

// Write tools: the assistant never mutates task/project/comment tables
// directly. Each call only ever inserts a PENDING row into
// ai_action_proposals for a human to review.
export function buildWriteTools(ctx: ToolContext) {
  const seen = new Map<string, string>();

  async function stageProposal(action: "CREATE_TASK" | "UPDATE_TASK" | "ADD_COMMENT", summary: string, payload: Record<string, unknown>) {
    const key = `${action}:${JSON.stringify(payload)}`;
    if (seen.has(key)) {
      return { proposalId: seen.get(key), status: "PENDING", note: "Duplicate call for the same change — reusing the existing proposal." };
    }

    const expiresAt = new Date(Date.now() + PROPOSAL_TTL_MS);
    const [proposal] = await db
      .insert(schema.aiActionProposals)
      .values({ workspaceId: ctx.workspaceId, requestedById: ctx.userId, action, summary, payload, expiresAt })
      .returning();

    seen.set(key, proposal.id);
    return { proposalId: proposal.id, status: "PENDING" };
  }

  return {
    proposeCreateTask: tool({
      description: "Propose creating a task in a project (resolved by name), for a human to approve.",
      parameters: toolParams({
        projectName: z.string().describe("The project's name, not its id"),
        title: z.string(),
        description: z.string().optional(),
        priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
        assigneeName: z.string().optional().describe("Member's name or email, not their id"),
      }),
      execute: async ({ projectName, title, description, priority, assigneeName }) => {
        const projectId = await resolveName(ctx.workspaceId, "project", projectName);
        if (!projectId) return { error: `No project matching "${projectName}"` };

        let assigneeId: string | null = null;
        if (assigneeName) {
          assigneeId = await resolveName(ctx.workspaceId, "member", assigneeName);
          if (!assigneeId) return { error: `No member matching "${assigneeName}"` };
        }

        return stageProposal(
          "CREATE_TASK",
          `Create task "${title}" in ${projectName}`,
          { projectId, title, description, priority, assigneeId },
        );
      },
    }),

    proposeUpdateTask: tool({
      description: "Propose updating a task (resolved by title), for a human to approve.",
      parameters: toolParams({
        taskTitle: z.string().describe("The task's title, not its id"),
        status: z.enum(["BACKLOG", "TODO", "IN_PROGRESS", "BLOCKED", "DONE"]).optional(),
        priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
        assigneeName: z.string().optional().describe("Member's name or email, not their id"),
      }),
      execute: async ({ taskTitle, status, priority, assigneeName }) => {
        const taskId = await resolveName(ctx.workspaceId, "task", taskTitle);
        if (!taskId) return { error: `No task matching "${taskTitle}"` };

        let assigneeId: string | null | undefined;
        if (assigneeName) {
          assigneeId = await resolveName(ctx.workspaceId, "member", assigneeName);
          if (!assigneeId) return { error: `No member matching "${assigneeName}"` };
        }

        return stageProposal(
          "UPDATE_TASK",
          `Update task "${taskTitle}"`,
          { taskId, status, priority, assigneeId },
        );
      },
    }),

    proposeAddComment: tool({
      description: "Propose adding a comment to a task (resolved by title), for a human to approve.",
      parameters: toolParams({
        taskTitle: z.string(),
        body: z.string(),
      }),
      execute: async ({ taskTitle, body }) => {
        const taskId = await resolveName(ctx.workspaceId, "task", taskTitle);
        if (!taskId) return { error: `No task matching "${taskTitle}"` };

        return stageProposal("ADD_COMMENT", `Comment on "${taskTitle}"`, { taskId, body });
      },
    }),
  };
}
