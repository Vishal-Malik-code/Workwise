import { apiClient } from "@/lib/api-client";
import type { Workspace, WorkspaceMember, WorkspaceWithRole } from "@/types/api";

export const workspacesApi = {
  list: () => apiClient.get<{ workspaces: WorkspaceWithRole[] }>("/workspaces"),
  create: (name: string) => apiClient.post<{ workspace: Workspace }>("/workspaces", { name }),
  get: (workspaceId: string) => apiClient.get<{ workspace: Workspace }>(`/workspaces/${workspaceId}`),
  update: (workspaceId: string, body: { name?: string }) =>
    apiClient.patch<{ workspace: Workspace }>(`/workspaces/${workspaceId}`, body),
  remove: (workspaceId: string, confirmationName: string) =>
    apiClient.delete<void>(`/workspaces/${workspaceId}`, { body: { confirmationName } }),
  transferOwner: (workspaceId: string, newOwnerMemberId: string) =>
    apiClient.patch<{ member: WorkspaceMember }>(`/workspaces/${workspaceId}/transfer-owner`, { newOwnerMemberId }),
};
