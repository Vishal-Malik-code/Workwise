import { apiClient } from "@/lib/api-client";
import type { AiActionProposal, PaginatedResult, ProposalStatus } from "@/types/api";

export const assistantApi = {
  getStatus: (workspaceId: string) =>
    apiClient.get<{ enabled: boolean }>(`/workspaces/${workspaceId}/pulse/status`),
  chat: (workspaceId: string, message: string) =>
    apiClient.post<{ reply: string }>(`/workspaces/${workspaceId}/pulse/chat`, { message }),
  listProposals: (workspaceId: string, query: { status?: ProposalStatus; page?: number; limit?: number } = {}) =>
    apiClient.get<PaginatedResult<AiActionProposal>>(`/workspaces/${workspaceId}/pulse/proposals`, { query }),
  decideProposal: (workspaceId: string, proposalId: string, approve: boolean) =>
    apiClient.post<{ proposal: AiActionProposal }>(`/workspaces/${workspaceId}/pulse/proposals/${proposalId}/decide`, {
      approve,
    }),
};
