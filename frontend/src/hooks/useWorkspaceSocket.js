"use client";

import { useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { useQueryClient } from "@tanstack/react-query";

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

// Joins the workspace's realtime room and invalidates task queries whenever
// another member's change is broadcast, so open boards stay in sync.
export function useWorkspaceSocket(workspaceId) {
  const queryClient = useQueryClient();
  const socketRef = useRef(null);

  useEffect(() => {
    if (!workspaceId) return;

    const socket = io(SOCKET_URL, { withCredentials: true });
    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("workspace:join", workspaceId);
    });

    function invalidateTasks() {
      queryClient.invalidateQueries({ queryKey: ["workspaces", workspaceId] });
    }

    socket.on("task:updated", invalidateTasks);
    socket.on("task:deleted", invalidateTasks);

    return () => {
      socket.emit("workspace:leave", workspaceId);
      socket.disconnect();
    };
  }, [workspaceId, queryClient]);

  return socketRef;
}
