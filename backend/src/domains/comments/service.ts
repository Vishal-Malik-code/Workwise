import { and, eq } from "drizzle-orm";
import { db, schema } from "../../db/index.js";
import { AppError } from "../../utils/AppError.js";
import { recordAudit } from "../activity/service.js";
import { emitWorkspaceEvent } from "../../utils/socketEvents.js";
import { createNotification } from "../notifications/service.js";

// Very small @mention detector: looks for @token sequences in the comment
// body and matches them against workspace members' first names or their
// full name with spaces stripped (case-insensitive). Intentionally simple —
// no fuzzy matching, no mention markup on the frontend yet.
function findMentionedUserIds(
  body: string,
  members: Array<{ userId: string; name: string }>,
): string[] {
  const tokens = [...body.matchAll(/@([a-zA-Z0-9_.]+)/g)].map((m) => m[1]!.toLowerCase());
  if (tokens.length === 0) return [];

  const matched = new Set<string>();
  for (const member of members) {
    const firstName = member.name.trim().split(/\s+/)[0]?.toLowerCase();
    const compact = member.name.replace(/\s+/g, "").toLowerCase();
    if (tokens.some((t) => t === firstName || t === compact)) {
      matched.add(member.userId);
    }
  }
  return [...matched];
}

export async function createComment(workspaceId: string, taskId: string, authorId: string, body: string) {
  const [task] = await db
    .select({ id: schema.tasks.id, title: schema.tasks.title, assigneeId: schema.tasks.assigneeId })
    .from(schema.tasks)
    .where(and(eq(schema.tasks.id, taskId), eq(schema.tasks.workspaceId, workspaceId)))
    .limit(1);
  if (!task) throw AppError.notFound("Task not found");

  const [comment] = await db.insert(schema.comments).values({ taskId, authorId, body }).returning();

  await recordAudit({
    workspaceId,
    actorId: authorId,
    action: "comment.created",
    targetType: "comment",
    targetId: comment.id,
    metadata: { taskId },
  });

  emitWorkspaceEvent(workspaceId, "comment", "created", { comment, taskId });

  if (task.assigneeId && task.assigneeId !== authorId) {
    try {
      await createNotification({
        userId: task.assigneeId,
        workspaceId,
        type: "COMMENT_ADDED",
        payload: { taskId, taskTitle: task.title, commentId: comment.id, actorId: authorId },
      });
    } catch (err) {
      console.error("Failed to create COMMENT_ADDED notification", err);
    }
  }

  if (body.includes("@")) {
    try {
      const members = await db
        .select({ userId: schema.workspaceMembers.userId, name: schema.users.name })
        .from(schema.workspaceMembers)
        .innerJoin(schema.users, eq(schema.users.id, schema.workspaceMembers.userId))
        .where(eq(schema.workspaceMembers.workspaceId, workspaceId));

      const mentionedIds = findMentionedUserIds(body, members).filter(
        (userId) => userId !== authorId && userId !== task.assigneeId,
      );

      for (const userId of mentionedIds) {
        await createNotification({
          userId,
          workspaceId,
          type: "COMMENT_MENTION",
          payload: { taskId, taskTitle: task.title, commentId: comment.id, actorId: authorId },
        });
      }
    } catch (err) {
      console.error("Failed to create COMMENT_MENTION notification", err);
    }
  }

  return comment;
}

export async function listComments(workspaceId: string, taskId: string) {
  const [task] = await db
    .select({ id: schema.tasks.id })
    .from(schema.tasks)
    .where(and(eq(schema.tasks.id, taskId), eq(schema.tasks.workspaceId, workspaceId)))
    .limit(1);
  if (!task) throw AppError.notFound("Task not found");

  return db.select().from(schema.comments).where(eq(schema.comments.taskId, taskId));
}

export async function deleteComment(workspaceId: string, actorId: string, taskId: string, commentId: string) {
  const [deleted] = await db
    .delete(schema.comments)
    .where(and(eq(schema.comments.id, commentId), eq(schema.comments.taskId, taskId)))
    .returning();
  if (!deleted) throw AppError.notFound("Comment not found");

  await recordAudit({
    workspaceId,
    actorId,
    action: "comment.deleted",
    targetType: "comment",
    targetId: commentId,
  });

  emitWorkspaceEvent(workspaceId, "comment", "deleted", { commentId, taskId });
}
