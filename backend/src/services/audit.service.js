import { db, schema } from "../db/index.js";

// Records a single audit_logs row for a mutating action. Fire-and-forget
// from the caller's perspective, but awaited so failures surface in tests.
// Pass dbClient (a transaction) to include the audit row in the same
// transaction as the mutation it's recording.
export async function recordAudit({ dbClient = db, workspaceId, actorId, action, targetType, targetId = null, metadata = null }) {
  await dbClient.insert(schema.auditLogs).values({
    workspaceId,
    actorId,
    action,
    targetType,
    targetId,
    metadata,
  });
}
