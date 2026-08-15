import { Server } from "socket.io";
import type { Server as HttpServer } from "node:http";
import { and, eq } from "drizzle-orm";
import { db, schema } from "./db/index.js";
import { verifyToken } from "./utils/jwt.js";
import { AUTH_COOKIE_NAME } from "./utils/auth-cookie.js";
import { setIo } from "./utils/io-registry.js";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function parseCookie(header: string | undefined, name: string): string | null {
  if (!header) return null;
  const match = header
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.slice(name.length + 1)) : null;
}

declare module "socket.io" {
  interface Socket {
    userId: string;
  }
}

export function createSocketServer(httpServer: HttpServer, corsOrigin: string): Server {
  const io = new Server(httpServer, {
    cors: { origin: corsOrigin, credentials: true },
  });

  io.use((socket, next) => {
    try {
      const token = parseCookie(socket.handshake.headers.cookie, AUTH_COOKIE_NAME);
      if (!token) return next(new Error("unauthenticated"));
      const payload = verifyToken(token);
      socket.userId = payload.sub;
      next();
    } catch {
      next(new Error("unauthenticated"));
    }
  });

  io.on("connection", (socket) => {
    // Every authenticated connection auto-joins its personal room so
    // notifications can be pushed without an explicit subscribe step.
    socket.join(`user:${socket.userId}`);

    socket.on("workspace:join", async (workspaceId: string, ack?: (res: unknown) => void) => {
      if (typeof workspaceId !== "string" || !UUID_RE.test(workspaceId)) {
        socket.emit("workspace:error", { error: "Invalid workspaceId" });
        return ack?.({ ok: false, error: "Invalid workspaceId" });
      }

      const [membership] = await db
        .select({ id: schema.workspaceMembers.id })
        .from(schema.workspaceMembers)
        .where(and(eq(schema.workspaceMembers.workspaceId, workspaceId), eq(schema.workspaceMembers.userId, socket.userId)))
        .limit(1);

      if (!membership) {
        socket.emit("workspace:error", { error: "Not a member of this workspace" });
        return ack?.({ ok: false, error: "Not a member of this workspace" });
      }

      socket.join(`workspace:${workspaceId}`);
      socket.emit("workspace:joined", { workspaceId });
      ack?.({ ok: true });
    });

    socket.on("workspace:leave", (workspaceId: string) => {
      socket.leave(`workspace:${workspaceId}`);
      socket.emit("workspace:left", { workspaceId });
    });
  });

  setIo(io);

  return io;
}
