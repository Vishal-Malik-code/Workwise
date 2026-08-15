import { and, eq, lt, isNull, sql } from "drizzle-orm";
import { db, schema } from "../db/index.js";
import type { RiskItem } from "./types.js";

const STALE_PROJECT_DAYS = 14;
const OVERLOADED_TASK_COUNT = 8;
const DUE_SOON_DAYS = 3;

// Deterministic DB queries (never the LLM) so the assistant can summarize
// risks but never invent them.
export async function deriveRisks(workspaceId: string): Promise<RiskItem[]> {
  const now = new Date();
  const risks: RiskItem[] = [];

  const overdue = await db
    .select({ id: schema.tasks.id, title: schema.tasks.title, dueDate: schema.tasks.dueDate })
    .from(schema.tasks)
    .where(
      and(
        eq(schema.tasks.workspaceId, workspaceId),
        lt(schema.tasks.dueDate, now),
        sql`${schema.tasks.status} != 'DONE'`,
      ),
    );
  for (const t of overdue) {
    risks.push({
      type: "OVERDUE_TASK",
      summary: `"${t.title}" is overdue`,
      targetType: "task",
      targetId: t.id,
      detail: { dueDate: t.dueDate },
    });
  }

  const blocked = await db
    .select({ id: schema.tasks.id, title: schema.tasks.title })
    .from(schema.tasks)
    .where(and(eq(schema.tasks.workspaceId, workspaceId), eq(schema.tasks.status, "BLOCKED")));
  for (const t of blocked) {
    risks.push({ type: "BLOCKED_TASK", summary: `"${t.title}" is blocked`, targetType: "task", targetId: t.id });
  }

  const urgentUnassigned = await db
    .select({ id: schema.tasks.id, title: schema.tasks.title })
    .from(schema.tasks)
    .where(
      and(
        eq(schema.tasks.workspaceId, workspaceId),
        eq(schema.tasks.priority, "URGENT"),
        isNull(schema.tasks.assigneeId),
        sql`${schema.tasks.status} != 'DONE'`,
      ),
    );
  for (const t of urgentUnassigned) {
    risks.push({
      type: "URGENT_UNASSIGNED",
      summary: `"${t.title}" is urgent but unassigned`,
      targetType: "task",
      targetId: t.id,
    });
  }

  const dueSoon = new Date(now.getTime() + DUE_SOON_DAYS * 24 * 60 * 60 * 1000);
  const backlogDueSoon = await db
    .select({ id: schema.tasks.id, title: schema.tasks.title, dueDate: schema.tasks.dueDate })
    .from(schema.tasks)
    .where(
      and(
        eq(schema.tasks.workspaceId, workspaceId),
        eq(schema.tasks.status, "BACKLOG"),
        lt(schema.tasks.dueDate, dueSoon),
        sql`${schema.tasks.dueDate} is not null`,
      ),
    );
  for (const t of backlogDueSoon) {
    risks.push({
      type: "BACKLOG_DUE_SOON",
      summary: `"${t.title}" is still in the backlog but due soon`,
      targetType: "task",
      targetId: t.id,
      detail: { dueDate: t.dueDate },
    });
  }

  const staleCutoff = new Date(now.getTime() - STALE_PROJECT_DAYS * 24 * 60 * 60 * 1000);
  const projects = await db
    .select({ id: schema.projects.id, name: schema.projects.name, updatedAt: schema.projects.updatedAt })
    .from(schema.projects)
    .where(eq(schema.projects.workspaceId, workspaceId));
  for (const p of projects) {
    if (p.updatedAt < staleCutoff) {
      risks.push({
        type: "STALE_PROJECT",
        summary: `Project "${p.name}" has had no updates in ${STALE_PROJECT_DAYS}+ days`,
        targetType: "project",
        targetId: p.id,
      });
    }
  }

  const memberLoads = await db
    .select({ userId: schema.tasks.assigneeId, count: sql<number>`count(*)::int` })
    .from(schema.tasks)
    .where(
      and(
        eq(schema.tasks.workspaceId, workspaceId),
        sql`${schema.tasks.status} != 'DONE'`,
        sql`${schema.tasks.assigneeId} is not null`,
      ),
    )
    .groupBy(schema.tasks.assigneeId);
  for (const m of memberLoads) {
    if (m.userId && m.count >= OVERLOADED_TASK_COUNT) {
      risks.push({
        type: "OVERLOADED_MEMBER",
        summary: `A member has ${m.count} open tasks assigned`,
        targetType: "member",
        targetId: m.userId,
        detail: { openTaskCount: m.count },
      });
    }
  }

  return risks;
}
