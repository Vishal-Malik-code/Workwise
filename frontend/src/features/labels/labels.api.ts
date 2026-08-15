import { apiClient } from "@/lib/api-client";
import type { Label, TaskLabel } from "@/types/api";

export const labelsApi = {
  list: (workspaceId: string) => apiClient.get<{ labels: Label[] }>(`/workspaces/${workspaceId}/labels`),
  create: (workspaceId: string, body: { name: string; color?: string }) =>
    apiClient.post<{ label: Label }>(`/workspaces/${workspaceId}/labels`, body),
  remove: (workspaceId: string, labelId: string) =>
    apiClient.delete<void>(`/workspaces/${workspaceId}/labels/${labelId}`),
  attach: (workspaceId: string, labelId: string, taskId: string) =>
    apiClient.post<{ taskLabel: TaskLabel }>(`/workspaces/${workspaceId}/labels/${labelId}/tasks/${taskId}`),
  detach: (workspaceId: string, labelId: string, taskId: string) =>
    apiClient.delete<void>(`/workspaces/${workspaceId}/labels/${labelId}/tasks/${taskId}`),
  replaceForTask: (workspaceId: string, taskId: string, labelIds: string[]) =>
    apiClient.put<{ labels: Label[] }>(`/workspaces/${workspaceId}/labels/tasks/${taskId}`, { labelIds }),
};
