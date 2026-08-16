import { eq } from "drizzle-orm";
import { db, schema } from "../../db/index.js";
import { hashPassword } from "../../utils/password.js";
import { createWorkspace } from "../workspaces/service.js";
import { addMember } from "../members/service.js";
import { createProject } from "../projects/service.js";
import { createTask } from "../tasks/service.js";
import { createLabel, attachLabel } from "../labels/service.js";
import { createComment } from "../comments/service.js";
import { createInvite } from "../invites/service.js";

interface DemoPerson {
  name: string;
  email: string;
}

const DEMO_TEAM: DemoPerson[] = [
  { name: "Alex Chen", email: "alex.chen@demo.workwise.app" },
  { name: "Priya Sharma", email: "priya.sharma@demo.workwise.app" },
  { name: "Jordan Lee", email: "jordan.lee@demo.workwise.app" },
  { name: "Sam Osei", email: "sam.osei@demo.workwise.app" },
];

async function findOrCreateDemoUser(person: DemoPerson) {
  const [existing] = await db.select().from(schema.users).where(eq(schema.users.email, person.email)).limit(1);
  if (existing) return existing;

  const passwordHash = await hashPassword(`demo-teammate-${Date.now()}-${Math.random()}`);
  const [user] = await db
    .insert(schema.users)
    .values({ name: person.name, email: person.email, passwordHash })
    .returning();
  return user;
}

function daysFromNow(days: number): string {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
}

/**
 * Wipes and rebuilds the guest account's workspaces so every demo login
 * starts from the same pristine, feature-complete state. Workspace deletion
 * cascades through projects/tasks/comments/labels/invites/audit logs, so
 * this is safe to call on every login.
 */
export async function seedDemoWorkspaces(guestUserId: string) {
  const owned = await db
    .select({ id: schema.workspaces.id })
    .from(schema.workspaces)
    .where(eq(schema.workspaces.ownerId, guestUserId));
  for (const ws of owned) {
    await db.delete(schema.workspaces).where(eq(schema.workspaces.id, ws.id));
  }

  const [alex, priya, jordan, sam] = await Promise.all(DEMO_TEAM.map(findOrCreateDemoUser));

  // Workspace 1: guest + 1 teammate (2 people) — a small, focused team
  const ws1 = await createWorkspace(guestUserId, "Product Launch");
  await addMember(ws1.id, guestUserId, alex.email, "ADMIN");

  const ws1Labels = await Promise.all([
    createLabel(ws1.id, guestUserId, "Frontend", "#2563eb"),
    createLabel(ws1.id, guestUserId, "Urgent", "#dc2626"),
  ]);
  const ws1Project = await createProject(ws1.id, guestUserId, {
    name: "Launch Checklist",
    description: "Everything that has to ship before the public launch.",
  });
  const ws1TaskA = await createTask(ws1.id, ws1Project.id, guestUserId, {
    title: "Finalize pricing page copy",
    description: "Lock the three-tier pricing copy with legal sign-off.",
    status: "IN_PROGRESS",
    priority: "HIGH",
    assigneeId: alex.id,
    dueDate: daysFromNow(3),
  });
  await createTask(ws1.id, ws1Project.id, guestUserId, {
    title: "Fix mobile nav overlap",
    description: "Nav drawer overlaps the hero CTA below 375px width.",
    status: "TODO",
    priority: "URGENT",
    assigneeId: guestUserId,
    dueDate: daysFromNow(-1),
  });
  await createTask(ws1.id, ws1Project.id, guestUserId, {
    title: "Write launch announcement",
    status: "BACKLOG",
    priority: "MEDIUM",
  });
  const ws1Done = await createTask(ws1.id, ws1Project.id, guestUserId, {
    title: "Set up analytics tracking",
    status: "DONE",
    priority: "LOW",
    assigneeId: alex.id,
  });
  await attachLabel(ws1.id, guestUserId, ws1TaskA.id, ws1Labels[0].id);
  await attachLabel(ws1.id, guestUserId, ws1TaskA.id, ws1Labels[1].id);
  await createComment(ws1.id, ws1TaskA.id, alex.id, "Legal signed off on tiers 1 and 2, waiting on enterprise wording.");
  await createComment(ws1.id, ws1TaskA.id, guestUserId, "Sounds good, ping me when tier 3 is ready for review.");
  await createComment(ws1.id, ws1Done.id, guestUserId, "Confirmed events are firing correctly in prod.");
  await createInvite(ws1.id, guestUserId, "morgan.taylor@demo.workwise.app", "MEMBER");

  // Workspace 2: guest + 2 teammates (3 people)
  const ws2 = await createWorkspace(guestUserId, "Marketing Ops");
  await addMember(ws2.id, guestUserId, priya.email, "MANAGER");
  await addMember(ws2.id, guestUserId, jordan.email, "MEMBER");

  const ws2Labels = await Promise.all([
    createLabel(ws2.id, guestUserId, "Content", "#7c3aed"),
    createLabel(ws2.id, guestUserId, "Design", "#059669"),
  ]);
  const ws2Project = await createProject(ws2.id, guestUserId, {
    name: "Q3 Campaign",
    description: "Cross-channel campaign for the Q3 feature push.",
  });
  const ws2TaskA = await createTask(ws2.id, ws2Project.id, guestUserId, {
    title: "Draft social media calendar",
    status: "IN_PROGRESS",
    priority: "MEDIUM",
    assigneeId: jordan.id,
    dueDate: daysFromNow(5),
  });
  await createTask(ws2.id, ws2Project.id, guestUserId, {
    title: "Design email header graphics",
    status: "BLOCKED",
    priority: "HIGH",
    assigneeId: priya.id,
  });
  await createTask(ws2.id, ws2Project.id, guestUserId, {
    title: "Review campaign budget",
    status: "TODO",
    priority: "MEDIUM",
    assigneeId: guestUserId,
    dueDate: daysFromNow(7),
  });
  const ws2Done = await createTask(ws2.id, ws2Project.id, guestUserId, {
    title: "Approve campaign brief",
    status: "DONE",
    priority: "LOW",
    assigneeId: priya.id,
  });
  await attachLabel(ws2.id, guestUserId, ws2TaskA.id, ws2Labels[0].id);
  await createComment(ws2.id, ws2TaskA.id, priya.id, "Can we push the Instagram posts a week earlier?");
  await createComment(ws2.id, ws2TaskA.id, jordan.id, "Sure, updating the calendar now.");
  await createInvite(ws2.id, guestUserId, "casey.morgan@demo.workwise.app", "VIEWER");
  void ws2Done;
  void ws2Labels;

  // Workspace 3: guest + all 3 teammates (4 people)
  const ws3 = await createWorkspace(guestUserId, "Platform Engineering");
  await addMember(ws3.id, guestUserId, alex.email, "ADMIN");
  await addMember(ws3.id, guestUserId, priya.email, "MEMBER");
  await addMember(ws3.id, guestUserId, sam.email, "VIEWER");

  const ws3Labels = await Promise.all([
    createLabel(ws3.id, guestUserId, "Backend", "#ea580c"),
    createLabel(ws3.id, guestUserId, "Infra", "#0891b2"),
  ]);
  const ws3Project = await createProject(ws3.id, guestUserId, {
    name: "API v2 Migration",
    description: "Migrate all internal services onto the v2 API surface.",
  });
  const ws3TaskA = await createTask(ws3.id, ws3Project.id, guestUserId, {
    title: "Migrate auth service to v2",
    status: "IN_PROGRESS",
    priority: "URGENT",
    assigneeId: alex.id,
    dueDate: daysFromNow(2),
  });
  await createTask(ws3.id, ws3Project.id, guestUserId, {
    title: "Write migration runbook",
    status: "TODO",
    priority: "MEDIUM",
    assigneeId: sam.id,
  });
  await createTask(ws3.id, ws3Project.id, guestUserId, {
    title: "Load test v2 endpoints",
    status: "BACKLOG",
    priority: "HIGH",
    assigneeId: priya.id,
  });
  const ws3Blocked = await createTask(ws3.id, ws3Project.id, guestUserId, {
    title: "Deprecate v1 webhook handlers",
    status: "BLOCKED",
    priority: "MEDIUM",
    assigneeId: guestUserId,
  });
  const ws3Done = await createTask(ws3.id, ws3Project.id, guestUserId, {
    title: "Stand up v2 staging environment",
    status: "DONE",
    priority: "HIGH",
    assigneeId: alex.id,
  });
  await attachLabel(ws3.id, guestUserId, ws3TaskA.id, ws3Labels[0].id);
  await attachLabel(ws3.id, guestUserId, ws3TaskA.id, ws3Labels[1].id);
  await createComment(ws3.id, ws3TaskA.id, alex.id, "Token refresh flow is migrated, working on session handling next.");
  await createComment(ws3.id, ws3Blocked.id, guestUserId, "Blocked until the v1 client SDK is fully retired.");
  await createComment(ws3.id, ws3Done.id, priya.id, "Staging looks stable, ready for the next phase.");

  // Pending AI proposal so the Pulse approve/reject UI has something to show.
  await db.insert(schema.aiActionProposals).values({
    workspaceId: ws3.id,
    requestedById: guestUserId,
    action: "CREATE_TASK",
    summary: `Create task "Add rate limiting to v2 gateway" in ${ws3Project.name}`,
    payload: { projectId: ws3Project.id, title: "Add rate limiting to v2 gateway", priority: "MEDIUM" },
    expiresAt: new Date(Date.now() + 15 * 60 * 1000),
  });

  void ws3Done;
  void ws3Labels;
}
