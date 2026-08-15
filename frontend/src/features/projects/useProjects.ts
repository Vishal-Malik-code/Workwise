"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { projectsApi, type CreateProjectInput, type UpdateProjectInput } from "./projects.api";

export function useProjects(workspaceId: string | undefined) {
  return useQuery({
    queryKey: ["workspaces", workspaceId, "projects"],
    queryFn: () => projectsApi.list(workspaceId as string),
    select: (data) => data.projects,
    enabled: !!workspaceId,
  });
}

export function useProject(workspaceId: string | undefined, projectId: string | undefined) {
  return useQuery({
    queryKey: ["workspaces", workspaceId, "projects", projectId],
    queryFn: () => projectsApi.get(workspaceId as string, projectId as string),
    select: (data) => data.project,
    enabled: !!workspaceId && !!projectId,
  });
}

export function useCreateProject(workspaceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateProjectInput) => projectsApi.create(workspaceId, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["workspaces", workspaceId, "projects"] }),
  });
}

export function useUpdateProject(workspaceId: string, projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: UpdateProjectInput) => projectsApi.update(workspaceId, projectId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspaces", workspaceId, "projects"] });
      queryClient.invalidateQueries({ queryKey: ["workspaces", workspaceId, "projects", projectId] });
    },
  });
}

export function useDeleteProject(workspaceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (projectId: string) => projectsApi.remove(workspaceId, projectId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["workspaces", workspaceId, "projects"] }),
  });
}
