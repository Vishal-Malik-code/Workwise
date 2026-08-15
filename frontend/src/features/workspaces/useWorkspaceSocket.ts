"use client";

import { useEffect, useRef } from "react";
import { io, type Socket } from "socket.io-client";
import { useQueryClient } from "@tanstack/react-query";
import type { NotificationsChangedEvent, WorkspaceChangedEvent } from "@/types/api";

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

// Maps a workspace:changed event's `resource` to the React Query key(s) it
// should invalidate. Every resource also invalidates the workspace-scoped
// activity feed since every mutation is audit-logged.
function invalidateForResource(
  queryClient: ReturnType<typeof useQueryClient>,
  workspaceId: string,
  event: WorkspaceChangedEvent,
) {
  const base = ["workspaces", workspaceId] as const;

  switch (event.resource) {
    case "project":
      queryClient.invalidateQueries({ queryKey: [...base, "projects"] });
      break;
    case "task": {
      queryClient.invalidateQueries({ queryKey: [...base, "projects"] });
      // Task events don't always carry a projectId at this layer, so
      // invalidate broadly across all task lists for this workspace.
      queryClient.invalidateQueries({ queryKey: [...base], predicate: (q) => q.queryKey.includes("tasks") });
      break;
    }
    case "comment":
      queryClient.invalidateQueries({ queryKey: [...base], predicate: (q) => q.queryKey.includes("comments") });
      break;
    case "label":
      queryClient.invalidateQueries({ queryKey: [...base, "labels"] });
      queryClient.invalidateQueries({ queryKey: [...base], predicate: (q) => q.queryKey.includes("tasks") });
      break;
    case "member":
      queryClient.invalidateQueries({ queryKey: [...base, "members"] });
      break;
    case "invite":
      queryClient.invalidateQueries({ queryKey: [...base, "invites"] });
      break;
    case "assistant":
      queryClient.invalidateQueries({ queryKey: [...base, "pulse"] });
      queryClient.invalidateQueries({ queryKey: [...base], predicate: (q) => q.queryKey.includes("tasks") });
      break;
    default:
      break;
  }

  queryClient.invalidateQueries({ queryKey: [...base, "activity"] });
}

/**
 * Connects once per workspaceId, joins the workspace's realtime room, and
 * invalidates the relevant React Query caches on `workspace:changed`. Also
 * listens for `notifications:changed` on the user's own auto-joined room.
 */
export function useWorkspaceSocket(workspaceId: string | undefined) {
  const queryClient = useQueryClient();
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!workspaceId) return;

    const socket = io(SOCKET_URL, { withCredentials: true });
    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("workspace:join", workspaceId);
    });

    socket.on("workspace:changed", (event: WorkspaceChangedEvent) => {
      invalidateForResource(queryClient, workspaceId, event);
    });

    socket.on("notifications:changed", (_event: NotificationsChangedEvent) => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    });

    return () => {
      socket.emit("workspace:leave", workspaceId);
      socket.disconnect();
    };
  }, [workspaceId, queryClient]);

  return socketRef;
}
