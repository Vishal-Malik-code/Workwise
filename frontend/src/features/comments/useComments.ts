"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { commentsApi } from "./comments.api";

export function useComments(workspaceId: string | undefined, projectId: string | undefined, taskId: string | undefined) {
  return useQuery({
    queryKey: ["workspaces", workspaceId, "projects", projectId, "tasks", taskId, "comments"],
    queryFn: () => commentsApi.list(workspaceId as string, projectId as string, taskId as string),
    select: (data) => data.comments,
    enabled: !!workspaceId && !!projectId && !!taskId,
  });
}

export function useCreateComment(workspaceId: string, projectId: string, taskId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: string) => commentsApi.create(workspaceId, projectId, taskId, body),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["workspaces", workspaceId, "projects", projectId, "tasks", taskId, "comments"] }),
  });
}

export function useDeleteComment(workspaceId: string, projectId: string, taskId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (commentId: string) => commentsApi.remove(workspaceId, projectId, taskId, commentId),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["workspaces", workspaceId, "projects", projectId, "tasks", taskId, "comments"] }),
  });
}
