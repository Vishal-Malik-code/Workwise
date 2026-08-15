import type { Server } from "socket.io";
import { getIo } from "./io-registry.js";

export interface WorkspaceEventPayload {
  resource: string;
  action: string;
  [key: string]: unknown;
}

function resolveIo(io?: Server | null): Server | null {
  return io ?? getIo();
}

export function emitWorkspaceEvent(
  workspaceId: string,
  resource: string,
  action: string,
  payload: Record<string, unknown> = {},
  io?: Server | null,
): void {
  const socketIo = resolveIo(io);
  if (!socketIo) return;
  socketIo.to(`workspace:${workspaceId}`).emit("workspace:changed", {
    resource,
    action,
    workspaceId,
    ...payload,
  });
}

export function emitUserEvent(
  userId: string,
  resource: string,
  action: string,
  payload: Record<string, unknown> = {},
  io?: Server | null,
): void {
  const socketIo = resolveIo(io);
  if (!socketIo) return;
  socketIo.to(`user:${userId}`).emit("notifications:changed", {
    resource,
    action,
    userId,
    ...payload,
  });
}
