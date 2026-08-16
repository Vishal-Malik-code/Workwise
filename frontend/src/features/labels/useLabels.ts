"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { labelsApi } from "./labels.api";

export function useLabels(workspaceId: string | undefined) {
  return useQuery({
    queryKey: ["workspaces", workspaceId, "labels"],
    queryFn: () => labelsApi.list(workspaceId as string),
    select: (data) => data.labels,
    enabled: !!workspaceId,
  });
}

export function useCreateLabel(workspaceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: { name: string; color?: string }) => labelsApi.create(workspaceId, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["workspaces", workspaceId, "labels"] }),
  });
}

export function useDeleteLabel(workspaceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (labelId: string) => labelsApi.remove(workspaceId, labelId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["workspaces", workspaceId, "labels"] }),
  });
}

export function useAttachLabel(workspaceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ labelId, taskId }: { labelId: string; taskId: string }) =>
      labelsApi.attach(workspaceId, labelId, taskId),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["workspaces", workspaceId], predicate: (q) => q.queryKey.includes("tasks") }),
  });
}

