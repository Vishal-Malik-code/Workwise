"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { invitesApi } from "./invites.api";
import type { WorkspaceRole } from "@/types/api";

export function useInvites(workspaceId: string | undefined) {
  return useQuery({
    queryKey: ["workspaces", workspaceId, "invites"],
    queryFn: () => invitesApi.list(workspaceId as string),
    select: (data) => data.invites,
    enabled: !!workspaceId,
  });
}

export function useCreateInvite(workspaceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: { email: string; role?: Exclude<WorkspaceRole, "OWNER"> }) => invitesApi.create(workspaceId, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["workspaces", workspaceId, "invites"] }),
  });
}

export function useAcceptInvite() {
  return useMutation({ mutationFn: (token: string) => invitesApi.accept(token) });
}

export function useDeclineInvite() {
  return useMutation({ mutationFn: (token: string) => invitesApi.decline(token) });
}
