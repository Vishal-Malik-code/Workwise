import { apiClient } from "@/lib/api-client";
import type { Project } from "@/types/api";

export interface CreateProjectInput {
  name: string;
  description?: string;
}

export interface UpdateProjectInput {
  name?: string;
  description?: string | null;
}

export const projectsApi = {
  list: (workspaceId: string) => apiClient.get<{ projects: Project[] }>(`/workspaces/${workspaceId}/projects`),
  create: (workspaceId: string, body: CreateProjectInput) =>
    apiClient.post<{ project: Project }>(`/workspaces/${workspaceId}/projects`, body),
  get: (workspaceId: string, projectId: string) =>
    apiClient.get<{ project: Project }>(`/workspaces/${workspaceId}/projects/${projectId}`),
  update: (workspaceId: string, projectId: string, body: UpdateProjectInput) =>
    apiClient.patch<{ project: Project }>(`/workspaces/${workspaceId}/projects/${projectId}`, body),
  remove: (workspaceId: string, projectId: string) =>
    apiClient.delete<void>(`/workspaces/${workspaceId}/projects/${projectId}`),
};
