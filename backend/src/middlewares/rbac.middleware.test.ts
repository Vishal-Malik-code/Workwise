import { test } from "node:test";
import assert from "node:assert/strict";
import type { Request, Response } from "express";
import { ROLE_RANK, requireWorkspaceRole } from "./rbac.middleware.js";

test("role hierarchy is ordered OWNER > ADMIN > MANAGER > MEMBER > VIEWER", () => {
  assert.ok(ROLE_RANK.OWNER > ROLE_RANK.ADMIN);
  assert.ok(ROLE_RANK.ADMIN > ROLE_RANK.MANAGER);
  assert.ok(ROLE_RANK.MANAGER > ROLE_RANK.MEMBER);
  assert.ok(ROLE_RANK.MEMBER > ROLE_RANK.VIEWER);
});

function mockRes() {
  return {
    statusCode: null as number | null,
    body: null as unknown,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(body: unknown) {
      this.body = body;
      return this;
    },
  };
}

test("requireWorkspaceRole allows a caller whose role meets the minimum", () => {
  const middleware = requireWorkspaceRole("MANAGER");
  const req = { membership: { role: "ADMIN" } } as unknown as Request;
  const res = mockRes() as unknown as Response;
  let calledNext = false;
  let errArg: unknown;
  middleware(req, res, (err?: unknown) => {
    calledNext = true;
    errArg = err;
  });
  assert.equal(calledNext, true);
  assert.equal(errArg, undefined);
});

test("requireWorkspaceRole rejects a caller whose role is below the minimum", () => {
  const middleware = requireWorkspaceRole("ADMIN");
  const req = { membership: { role: "MEMBER" } } as unknown as Request;
  const res = mockRes() as unknown as Response;
  let errArg: { statusCode?: number } | undefined;
  middleware(req, res, (err?: unknown) => {
    errArg = err as { statusCode?: number };
  });
  assert.equal(errArg?.statusCode, 403);
});
