import { Server } from "socket.io";
import { and, eq } from "drizzle-orm";
import { db, schema } from "../db/index.js";
import { verifyToken, AUTH_COOKIE_NAME } from "../utils/jwt.js";

function parseCookie(header, name) {
  if (!header) return null;
  const match = header.split(";").map((c) => c.trim()).find((c) => c.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.slice(name.length + 1)) : null;
}

export function createSocketServer(httpServer, corsOrigin) {
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
    socket.on("workspace:join", async (workspaceId, ack) => {
      const [membership] = await db
        .select({ id: schema.workspaceMembers.id })
        .from(schema.workspaceMembers)
        .where(and(eq(schema.workspaceMembers.workspaceId, workspaceId), eq(schema.workspaceMembers.userId, socket.userId)))
        .limit(1);

      if (!membership) {
        return ack?.({ ok: false, error: "Not a member of this workspace" });
      }

      socket.join(`workspace:${workspaceId}`);
      ack?.({ ok: true });
    });

    socket.on("workspace:leave", (workspaceId) => {
      socket.leave(`workspace:${workspaceId}`);
    });
  });

  return io;
}
