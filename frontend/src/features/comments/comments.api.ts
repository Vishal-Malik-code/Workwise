import { apiClient } from "@/lib/api-client";
import type { Comment } from "@/types/api";

// Comments are nested under tasks, which are nested under projects
// (backend/src/domains/tasks/route.ts mounts comments at
// /:taskId/comments beneath /workspaces/:workspaceId/projects/:projectId/tasks).
export const commentsApi = {
  list: (workspaceId: string, projectId: string, taskId: string) =>
    apiClient.get<{ comments: Comment[] }>(
      `/workspaces/${workspaceId}/projects/${projectId}/tasks/${taskId}/comments`,
    ),
  create: (workspaceId: string, projectId: string, taskId: string, body: string) =>
    apiClient.post<{ comment: Comment }>(
      `/workspaces/${workspaceId}/projects/${projectId}/tasks/${taskId}/comments`,
      { body },
    ),
  remove: (workspaceId: string, projectId: string, taskId: string, commentId: string) =>
    apiClient.delete<void>(
      `/workspaces/${workspaceId}/projects/${projectId}/tasks/${taskId}/comments/${commentId}`,
    ),
};
