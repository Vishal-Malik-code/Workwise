import { db, schema } from "../db/index.js";

// Records a single audit_logs row for a mutating action. Fire-and-forget
// from the caller's perspective, but awaited so failures surface in tests.
export async function recordAudit({ workspaceId, actorId, action, targetType, targetId = null, metadata = null }) {
  await db.insert(schema.auditLogs).values({
    workspaceId,
    actorId,
    action,
    targetType,
    targetId,
    metadata,
  });
}
