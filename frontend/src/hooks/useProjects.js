"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function useProjects(workspaceId) {
  return useQuery({
    queryKey: ["workspaces", workspaceId, "projects"],
    queryFn: () => api.listProjects(workspaceId),
    select: (data) => data.projects,
    enabled: !!workspaceId,
  });
}

export function useCreateProject(workspaceId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body) => api.createProject(workspaceId, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["workspaces", workspaceId, "projects"] }),
  });
}
