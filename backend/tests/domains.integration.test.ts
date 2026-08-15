import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import request from "supertest";
import { createApp } from "../src/app.js";
import { db, schema } from "../src/db/index.js";
import { eq } from "drizzle-orm";

let dbReachable = true;
try {
  await db.execute("select 1");
} catch {
  dbReachable = false;
  console.warn("[tests] DATABASE_URL is unreachable — skipping integration tests.");
}

const app = createApp({ corsOrigin: "http://localhost:3000" });
const agent = () => request(app);

function uniqueEmail(prefix: string) {
  return `${prefix}-${randomUUID()}@example.test`;
}

async function registerAndLogin(prefix: string) {
  const email = uniqueEmail(prefix);
  const password = "correct-horse-battery-staple";
  const res = await agent().post("/api/auth/register").send({ name: prefix, email, password });
  assert.equal(res.status, 201, JSON.stringify(res.body));
  const cookie = res.headers["set-cookie"];
  return { email, password, cookie, userId: res.body.data.user.id as string };
}

if (dbReachable) {
  test("auth: register, login, me", async () => {
    const { email, password, cookie } = await registerAndLogin("auth");

    const meRes = await agent().get("/api/auth/me").set("Cookie", cookie);
    assert.equal(meRes.status, 200);
    assert.equal(meRes.body.data.user.email, email);

    const loginRes = await agent().post("/api/auth/login").send({ email, password });
    assert.equal(loginRes.status, 200);
  });

  test("workspaces + projects: create, RBAC enforcement (MEMBER cannot create project)", async () => {
    const owner = await registerAndLogin("owner");
    const member = await registerAndLogin("member");

    const wsRes = await agent()
      .post("/api/workspaces")
      .set("Cookie", owner.cookie)
      .send({ name: `WS ${randomUUID()}` });
    assert.equal(wsRes.status, 201);
    const workspaceId = wsRes.body.data.workspace.id as string;

    const addRes = await agent()
      .post(`/api/workspaces/${workspaceId}/members`)
      .set("Cookie", owner.cookie)
      .send({ email: member.email, role: "MEMBER" });
    assert.equal(addRes.status, 201, JSON.stringify(addRes.body));

    // MEMBER lacks MANAGER rank, so project creation must be forbidden.
    const forbiddenRes = await agent()
      .post(`/api/workspaces/${workspaceId}/projects`)
      .set("Cookie", member.cookie)
      .send({ name: "Should fail" });
    assert.equal(forbiddenRes.status, 403);

    const projRes = await agent()
      .post(`/api/workspaces/${workspaceId}/projects`)
      .set("Cookie", owner.cookie)
      .send({ name: "Real project" });
    assert.equal(projRes.status, 201);
    const projectId = projRes.body.data.project.id as string;

    // Task CRUD by the owner.
    const taskRes = await agent()
      .post(`/api/workspaces/${workspaceId}/projects/${projectId}/tasks`)
      .set("Cookie", owner.cookie)
      .send({ title: "Do the thing" });
    assert.equal(taskRes.status, 201);
    const taskId = taskRes.body.data.task.id as string;

    const updateRes = await agent()
      .patch(`/api/workspaces/${workspaceId}/projects/${projectId}/tasks/${taskId}`)
      .set("Cookie", owner.cookie)
      .send({ status: "IN_PROGRESS" });
    assert.equal(updateRes.status, 200);
    assert.equal(updateRes.body.data.task.status, "IN_PROGRESS");

    const listRes = await agent()
      .get(`/api/workspaces/${workspaceId}/projects/${projectId}/tasks`)
      .set("Cookie", member.cookie);
    assert.equal(listRes.status, 200);
    assert.equal(listRes.body.data.tasks.length, 1);

    const deleteRes = await agent()
      .delete(`/api/workspaces/${workspaceId}/projects/${projectId}/tasks/${taskId}`)
      .set("Cookie", owner.cookie);
    assert.equal(deleteRes.status, 204);
  });

  test("tasks: duplicate copies fields and labels; labels: bulk replace", async () => {
    const owner = await registerAndLogin("dup-owner");

    const wsRes = await agent()
      .post("/api/workspaces")
      .set("Cookie", owner.cookie)
      .send({ name: `WS ${randomUUID()}` });
    const workspaceId = wsRes.body.data.workspace.id as string;

    const projRes = await agent()
      .post(`/api/workspaces/${workspaceId}/projects`)
      .set("Cookie", owner.cookie)
      .send({ name: "Dup project" });
    const projectId = projRes.body.data.project.id as string;

    const taskRes = await agent()
      .post(`/api/workspaces/${workspaceId}/projects/${projectId}/tasks`)
      .set("Cookie", owner.cookie)
      .send({ title: "Original task", description: "Some details", priority: "HIGH" });
    const taskId = taskRes.body.data.task.id as string;

    const label1Res = await agent()
      .post(`/api/workspaces/${workspaceId}/labels`)
      .set("Cookie", owner.cookie)
      .send({ name: "Bug" });
    const label1Id = label1Res.body.data.label.id as string;

    const label2Res = await agent()
      .post(`/api/workspaces/${workspaceId}/labels`)
      .set("Cookie", owner.cookie)
      .send({ name: "Urgent" });
    const label2Id = label2Res.body.data.label.id as string;

    const replaceRes = await agent()
      .put(`/api/workspaces/${workspaceId}/labels/tasks/${taskId}`)
      .set("Cookie", owner.cookie)
      .send({ labelIds: [label1Id, label2Id] });
    assert.equal(replaceRes.status, 200, JSON.stringify(replaceRes.body));
    assert.equal(replaceRes.body.data.labels.length, 2);

    const dupRes = await agent()
      .post(`/api/workspaces/${workspaceId}/projects/${projectId}/tasks/${taskId}/duplicate`)
      .set("Cookie", owner.cookie);
    assert.equal(dupRes.status, 201, JSON.stringify(dupRes.body));
    const duplicated = dupRes.body.data.task;
    assert.equal(duplicated.title, "Original task (copy)");
    assert.equal(duplicated.description, "Some details");
    assert.equal(duplicated.priority, "HIGH");
    assert.notEqual(duplicated.id, taskId);

    const replaceEmptyRes = await agent()
      .put(`/api/workspaces/${workspaceId}/labels/tasks/${taskId}`)
      .set("Cookie", owner.cookie)
      .send({ labelIds: [] });
    assert.equal(replaceEmptyRes.status, 200);
    assert.equal(replaceEmptyRes.body.data.labels.length, 0);

    const badReplaceRes = await agent()
      .put(`/api/workspaces/${workspaceId}/labels/tasks/${taskId}`)
      .set("Cookie", owner.cookie)
      .send({ labelIds: [randomUUID()] });
    assert.equal(badReplaceRes.status, 400);
  });

  test("cross-tenant isolation: member of workspace A cannot read workspace B", async () => {
    const ownerA = await registerAndLogin("ownerA");
    const ownerB = await registerAndLogin("ownerB");

    const wsBRes = await agent()
      .post("/api/workspaces")
      .set("Cookie", ownerB.cookie)
      .send({ name: `WS-B ${randomUUID()}` });
    const workspaceBId = wsBRes.body.data.workspace.id as string;

    const res = await agent().get(`/api/workspaces/${workspaceBId}`).set("Cookie", ownerA.cookie);
    assert.equal(res.status, 403);

    const membersRes = await agent().get(`/api/workspaces/${workspaceBId}/members`).set("Cookie", ownerA.cookie);
    assert.equal(membersRes.status, 403);
  });

  test("invites: create + accept flow", async () => {
    const owner = await registerAndLogin("inv-owner");
    const invitee = await registerAndLogin("inv-invitee");

    const wsRes = await agent()
      .post("/api/workspaces")
      .set("Cookie", owner.cookie)
      .send({ name: `WS ${randomUUID()}` });
    const workspaceId = wsRes.body.data.workspace.id as string;

    const inviteRes = await agent()
      .post(`/api/workspaces/${workspaceId}/invites`)
      .set("Cookie", owner.cookie)
      .send({ email: invitee.email, role: "MEMBER" });
    assert.equal(inviteRes.status, 201);
    const token = inviteRes.body.data.token as string;
    assert.ok(token, "raw token should be returned under NODE_ENV=test");

    const acceptRes = await agent().post(`/api/invites/${token}/accept`).set("Cookie", invitee.cookie);
    assert.equal(acceptRes.status, 200);

    const membersRes = await agent().get(`/api/workspaces/${workspaceId}/members`).set("Cookie", owner.cookie);
    const emails = membersRes.body.data.members.map((m: { email: string }) => m.email);
    assert.ok(emails.includes(invitee.email));
  });

  test("assistant proposals: create (direct insert), VIEWER cannot decide, MANAGER can approve", async () => {
    const owner = await registerAndLogin("ai-owner");
    const viewer = await registerAndLogin("ai-viewer");

    const wsRes = await agent()
      .post("/api/workspaces")
      .set("Cookie", owner.cookie)
      .send({ name: `WS ${randomUUID()}` });
    const workspaceId = wsRes.body.data.workspace.id as string;

    await agent()
      .post(`/api/workspaces/${workspaceId}/members`)
      .set("Cookie", owner.cookie)
      .send({ email: viewer.email, role: "VIEWER" });

    const projRes = await agent()
      .post(`/api/workspaces/${workspaceId}/projects`)
      .set("Cookie", owner.cookie)
      .send({ name: "AI project" });
    const projectId = projRes.body.data.project.id as string;

    // Bypass the LLM call and stage a proposal directly, exercising the
    // same decide() path the chat tool would trigger.
    const [proposal] = await db
      .insert(schema.aiActionProposals)
      .values({
        workspaceId,
        requestedById: owner.userId,
        action: "CREATE_TASK",
        summary: "Create a task",
        payload: { projectId, title: "AI-created task" },
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      })
      .returning();

    const viewerDecideRes = await agent()
      .post(`/api/workspaces/${workspaceId}/pulse/proposals/${proposal.id}/decide`)
      .set("Cookie", viewer.cookie)
      .send({ approve: true });
    assert.equal(viewerDecideRes.status, 403);

    const ownerDecideRes = await agent()
      .post(`/api/workspaces/${workspaceId}/pulse/proposals/${proposal.id}/decide`)
      .set("Cookie", owner.cookie)
      .send({ approve: true });
    assert.equal(ownerDecideRes.status, 200, JSON.stringify(ownerDecideRes.body));
    assert.equal(ownerDecideRes.body.data.proposal.status, "EXECUTED");

    const tasksRes = await agent()
      .get(`/api/workspaces/${workspaceId}/projects/${projectId}/tasks`)
      .set("Cookie", owner.cookie);
    assert.ok(tasksRes.body.data.tasks.some((t: { title: string }) => t.title === "AI-created task"));
  });
} else {
  test("skipped: DATABASE_URL unreachable", () => {
    assert.ok(true);
  });
}
