import { apiClient } from "@/lib/api-client";
import type { WorkspaceMember, WorkspaceRole } from "@/types/api";

export const membersApi = {
  list: (workspaceId: string) => apiClient.get<{ members: WorkspaceMember[] }>(`/workspaces/${workspaceId}/members`),
  add: (workspaceId: string, body: { email: string; role?: Exclude<WorkspaceRole, "OWNER"> }) =>
    apiClient.post<{ member: WorkspaceMember }>(`/workspaces/${workspaceId}/members`, body),
  updateRole: (workspaceId: string, memberId: string, role: WorkspaceRole) =>
    apiClient.patch<{ member: WorkspaceMember }>(`/workspaces/${workspaceId}/members/${memberId}`, { role }),
  remove: (workspaceId: string, memberId: string) =>
    apiClient.delete<void>(`/workspaces/${workspaceId}/members/${memberId}`),
};
