import { apiClient } from "@/lib/api-client";
import type { Task, TaskPriority, TaskStatus } from "@/types/api";

export interface CreateTaskInput {
  title: string;
  description?: string;
  priority?: TaskPriority;
  status?: TaskStatus;
  assigneeId?: string | null;
  dueDate?: string | null;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string | null;
  status?: TaskStatus;
  priority?: TaskPriority;
  assigneeId?: string | null;
  position?: number;
  dueDate?: string | null;
}

export const tasksApi = {
  list: (workspaceId: string, projectId: string) =>
    apiClient.get<{ tasks: Task[] }>(`/workspaces/${workspaceId}/projects/${projectId}/tasks`),
  create: (workspaceId: string, projectId: string, body: CreateTaskInput) =>
    apiClient.post<{ task: Task }>(`/workspaces/${workspaceId}/projects/${projectId}/tasks`, body),
  get: (workspaceId: string, projectId: string, taskId: string) =>
    apiClient.get<{ task: Task }>(`/workspaces/${workspaceId}/projects/${projectId}/tasks/${taskId}`),
  update: (workspaceId: string, projectId: string, taskId: string, body: UpdateTaskInput) =>
    apiClient.patch<{ task: Task }>(`/workspaces/${workspaceId}/projects/${projectId}/tasks/${taskId}`, body),
  updatePosition: (
    workspaceId: string,
    projectId: string,
    taskId: string,
    body: { position: number; status?: TaskStatus },
  ) =>
    apiClient.patch<{ task: Task }>(
      `/workspaces/${workspaceId}/projects/${projectId}/tasks/${taskId}/position`,
      body,
    ),
  remove: (workspaceId: string, projectId: string, taskId: string) =>
    apiClient.delete<void>(`/workspaces/${workspaceId}/projects/${projectId}/tasks/${taskId}`),
  duplicate: (workspaceId: string, projectId: string, taskId: string) =>
    apiClient.post<{ task: Task }>(`/workspaces/${workspaceId}/projects/${projectId}/tasks/${taskId}/duplicate`),
};
