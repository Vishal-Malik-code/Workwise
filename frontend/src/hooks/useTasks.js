"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function useTasks(workspaceId, projectId) {
  return useQuery({
    queryKey: ["workspaces", workspaceId, "projects", projectId, "tasks"],
    queryFn: () => api.listTasks(workspaceId, projectId),
    select: (data) => data.tasks,
    enabled: !!workspaceId && !!projectId,
  });
}

export function useCreateTask(workspaceId, projectId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body) => api.createTask(workspaceId, projectId, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["workspaces", workspaceId, "projects", projectId, "tasks"] }),
  });
}

export function useUpdateTask(workspaceId, projectId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, ...body }) => api.updateTask(workspaceId, projectId, taskId, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["workspaces", workspaceId, "projects", projectId, "tasks"] }),
  });
}
