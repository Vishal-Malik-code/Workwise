"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { projectsApi, type CreateProjectInput } from "./projects.api";

export function useProjects(workspaceId: string | undefined) {
  return useQuery({
    queryKey: ["workspaces", workspaceId, "projects"],
    queryFn: () => projectsApi.list(workspaceId as string),
    select: (data) => data.projects,
    enabled: !!workspaceId,
  });
}

export function useCreateProject(workspaceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateProjectInput) => projectsApi.create(workspaceId, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["workspaces", workspaceId, "projects"] }),
  });
}
