import { and, eq, ilike } from "drizzle-orm";
import { db, schema } from "../db/index.js";
import type { ResolutionKind } from "./types.js";

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

// Fuzzy-matches a model-supplied name against real workspace-scoped rows so
// the model never has to (or gets to) supply raw UUIDs itself. Returns the
// matched id, or null if nothing matches confidently.
export async function resolveName(
  workspaceId: string,
  kind: ResolutionKind,
  name: string,
): Promise<string | null> {
  const needle = normalize(name);
  if (!needle) return null;

  if (kind === "project") {
    const rows = await db
      .select({ id: schema.projects.id, name: schema.projects.name })
      .from(schema.projects)
      .where(and(eq(schema.projects.workspaceId, workspaceId), ilike(schema.projects.name, `%${name}%`)));
    return pickBestMatch(rows, needle);
  }

  if (kind === "task") {
    const rows = await db
      .select({ id: schema.tasks.id, name: schema.tasks.title })
      .from(schema.tasks)
      .where(and(eq(schema.tasks.workspaceId, workspaceId), ilike(schema.tasks.title, `%${name}%`)));
    return pickBestMatch(rows, needle);
  }

  // member: match by user name or email
  const rows = await db
    .select({ id: schema.users.id, name: schema.users.name, email: schema.users.email })
    .from(schema.workspaceMembers)
    .innerJoin(schema.users, eq(schema.users.id, schema.workspaceMembers.userId))
    .where(eq(schema.workspaceMembers.workspaceId, workspaceId));

  const candidates = rows.filter(
    (r) => normalize(r.name).includes(needle) || normalize(r.email).includes(needle),
  );
  return pickBestMatch(
    candidates.map((c) => ({ id: c.id, name: c.name })),
    needle,
  );
}

function pickBestMatch(rows: { id: string; name: string }[], needle: string): string | null {
  if (rows.length === 0) return null;
  const exact = rows.find((r) => normalize(r.name) === needle);
  if (exact) return exact.id;
  if (rows.length === 1) return rows[0].id;
  // Ambiguous — prefer the shortest name containing the needle as the
  // closest match, but this is still a best-effort heuristic.
  return rows.sort((a, b) => a.name.length - b.name.length)[0].id;
}
