"use client";

import { useMutation, useQuery, useQueryClient, type QueryKey } from "@tanstack/react-query";
import { tasksApi, type CreateTaskInput, type UpdateTaskInput } from "./tasks.api";
import type { Task, TaskStatus } from "@/types/api";

function tasksKey(workspaceId: string, projectId: string): QueryKey {
  return ["workspaces", workspaceId, "projects", projectId, "tasks"];
}

export function useTasks(workspaceId: string | undefined, projectId: string | undefined) {
  return useQuery({
    queryKey: tasksKey(workspaceId ?? "", projectId ?? ""),
    queryFn: () => tasksApi.list(workspaceId as string, projectId as string),
    select: (data) => data.tasks,
    enabled: !!workspaceId && !!projectId,
  });
}

export function useTask(workspaceId: string | undefined, projectId: string | undefined, taskId: string | undefined) {
  return useQuery({
    queryKey: ["workspaces", workspaceId, "projects", projectId, "tasks", taskId],
    queryFn: () => tasksApi.get(workspaceId as string, projectId as string, taskId as string),
    select: (data) => data.task,
    enabled: !!workspaceId && !!projectId && !!taskId,
  });
}

export function useCreateTask(workspaceId: string, projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateTaskInput) => tasksApi.create(workspaceId, projectId, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: tasksKey(workspaceId, projectId) }),
  });
}

export function useDuplicateTask(workspaceId: string, projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (taskId: string) => tasksApi.duplicate(workspaceId, projectId, taskId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: tasksKey(workspaceId, projectId) }),
  });
}

export function useUpdateTask(workspaceId: string, projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, ...body }: UpdateTaskInput & { taskId: string }) =>
      tasksApi.update(workspaceId, projectId, taskId, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: tasksKey(workspaceId, projectId) }),
  });
}

export function useDeleteTask(workspaceId: string, projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (taskId: string) => tasksApi.remove(workspaceId, projectId, taskId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: tasksKey(workspaceId, projectId) }),
  });
}

interface MoveTaskVars {
  taskId: string;
  status: TaskStatus;
  position: number;
}

/**
 * Drag-and-drop status/position update with optimistic cache writes: the
 * Kanban board updates instantly on drop, then rolls back on failure.
 */
export function useMoveTask(workspaceId: string, projectId: string) {
  const queryClient = useQueryClient();
  const key = tasksKey(workspaceId, projectId);

  return useMutation({
    mutationFn: ({ taskId, status, position }: MoveTaskVars) =>
      tasksApi.updatePosition(workspaceId, projectId, taskId, { status, position }),
    onMutate: async (vars) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<{ tasks: Task[] }>(key);

      if (previous) {
        queryClient.setQueryData<{ tasks: Task[] }>(key, {
          tasks: previous.tasks.map((t) =>
            t.id === vars.taskId ? { ...t, status: vars.status, position: vars.position } : t,
          ),
        });
      }

      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(key, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: key });
    },
  });
}
