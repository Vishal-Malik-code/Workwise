"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { assistantApi } from "./assistant.api";
import type { ProposalStatus } from "@/types/api";

export function useAssistantStatus(workspaceId: string | undefined) {
  return useQuery({
    queryKey: ["workspaces", workspaceId, "pulse", "status"],
    queryFn: () => assistantApi.getStatus(workspaceId as string),
    select: (data) => data.enabled,
    enabled: !!workspaceId,
    staleTime: 60_000,
  });
}

export function useProposals(workspaceId: string | undefined, status?: ProposalStatus) {
  return useQuery({
    queryKey: ["workspaces", workspaceId, "pulse", "proposals", status ?? "ALL"],
    queryFn: () => assistantApi.listProposals(workspaceId as string, status ? { status } : {}),
    select: (data) => data.items,
    enabled: !!workspaceId,
    refetchInterval: 15_000,
  });
}

export function useAskPulse(workspaceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (message: string) => assistantApi.chat(workspaceId, message),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["workspaces", workspaceId, "pulse", "proposals"] }),
  });
}

export function useDecideProposal(workspaceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ proposalId, approve }: { proposalId: string; approve: boolean }) =>
      assistantApi.decideProposal(workspaceId, proposalId, approve),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspaces", workspaceId, "pulse", "proposals"] });
      queryClient.invalidateQueries({ queryKey: ["workspaces", workspaceId], predicate: (q) => q.queryKey.includes("tasks") });
      queryClient.invalidateQueries({ queryKey: ["workspaces", workspaceId, "activity"] });
    },
  });
}
