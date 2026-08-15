import { apiClient } from "@/lib/api-client";
import type { WorkspaceInvite, WorkspaceRole } from "@/types/api";

export const invitesApi = {
  list: (workspaceId: string) => apiClient.get<{ invites: WorkspaceInvite[] }>(`/workspaces/${workspaceId}/invites`),
  create: (workspaceId: string, body: { email: string; role?: Exclude<WorkspaceRole, "OWNER"> }) =>
    apiClient.post<{ invite: WorkspaceInvite; token?: string }>(`/workspaces/${workspaceId}/invites`, body),
  accept: (token: string) => apiClient.post<{ workspaceId: string }>(`/invites/${token}/accept`),
  decline: (token: string) => apiClient.post<{ workspaceId: string }>(`/invites/${token}/decline`),
};
