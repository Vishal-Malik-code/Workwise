import { test } from "node:test";
import assert from "node:assert/strict";
import { ROLE_RANK, requireRole } from "./rbac.js";

test("role hierarchy is ordered OWNER > ADMIN > MANAGER > MEMBER > VIEWER", () => {
  assert.ok(ROLE_RANK.OWNER > ROLE_RANK.ADMIN);
  assert.ok(ROLE_RANK.ADMIN > ROLE_RANK.MANAGER);
  assert.ok(ROLE_RANK.MANAGER > ROLE_RANK.MEMBER);
  assert.ok(ROLE_RANK.MEMBER > ROLE_RANK.VIEWER);
});

function mockRes() {
  return {
    statusCode: null,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
  };
}

test("requireRole allows a caller whose role meets the minimum", () => {
  const middleware = requireRole("MANAGER");
  const req = { membership: { role: "ADMIN" } };
  const res = mockRes();
  let calledNext = false;
  middleware(req, res, () => { calledNext = true; });
  assert.equal(calledNext, true);
  assert.equal(res.statusCode, null);
});

test("requireRole rejects a caller whose role is below the minimum", () => {
  const middleware = requireRole("ADMIN");
  const req = { membership: { role: "MEMBER" } };
  const res = mockRes();
  let calledNext = false;
  middleware(req, res, () => { calledNext = true; });
  assert.equal(calledNext, false);
  assert.equal(res.statusCode, 403);
});
