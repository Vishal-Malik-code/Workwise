import { desc, eq } from "drizzle-orm";
import { db, schema } from "../../db/index.js";
import type { DbClient } from "../../db/index.js";
import { getPagination, type PaginationInput } from "../../utils/pagination.js";

export interface RecordAuditInput {
  dbClient?: DbClient;
  workspaceId: string;
  actorId: string | null;
  action: string;
  targetType: string;
  targetId?: string | null;
  metadata?: Record<string, unknown> | null;
}

// Records a single audit_logs row for a mutating action. Pass dbClient (a
// transaction) to include the audit row in the same transaction as the
// mutation it's recording.
export async function recordAudit({
  dbClient = db,
  workspaceId,
  actorId,
  action,
  targetType,
  targetId = null,
  metadata = null,
}: RecordAuditInput): Promise<void> {
  await dbClient.insert(schema.auditLogs).values({
    workspaceId,
    actorId,
    action,
    targetType,
    targetId,
    metadata,
  });
}

export async function listActivity(workspaceId: string, pagination: PaginationInput) {
  const { limit, offset, page } = getPagination(pagination);

  const rows = await db
    .select()
    .from(schema.auditLogs)
    .where(eq(schema.auditLogs.workspaceId, workspaceId))
    .orderBy(desc(schema.auditLogs.createdAt))
    .limit(limit)
    .offset(offset);

  return { items: rows, page, limit };
}
