import type { Server } from "socket.io";

// Small registry so domain services can emit socket events without importing
// socket.ts directly (which would create a circular dependency, since
// socket.ts itself depends on db/schema for membership checks).
let ioInstance: Server | null = null;

export function setIo(io: Server): void {
  ioInstance = io;
}

export function getIo(): Server | null {
  return ioInstance;
}
