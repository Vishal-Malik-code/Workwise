"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function useWorkspaces() {
  return useQuery({
    queryKey: ["workspaces"],
    queryFn: api.listWorkspaces,
    select: (data) => data.workspaces,
  });
}

export function useCreateWorkspace() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (name) => api.createWorkspace({ name }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["workspaces"] }),
  });
}

export function useMembers(workspaceId) {
  return useQuery({
    queryKey: ["workspaces", workspaceId, "members"],
    queryFn: () => api.listMembers(workspaceId),
    select: (data) => data.members,
    enabled: !!workspaceId,
  });
}
