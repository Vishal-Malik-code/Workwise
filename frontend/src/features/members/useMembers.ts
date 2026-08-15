"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { membersApi } from "./members.api";
import type { WorkspaceRole } from "@/types/api";

export function useMembers(workspaceId: string | undefined) {
  return useQuery({
    queryKey: ["workspaces", workspaceId, "members"],
    queryFn: () => membersApi.list(workspaceId as string),
    select: (data) => data.members,
    enabled: !!workspaceId,
  });
}

export function useAddMember(workspaceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: { email: string; role?: Exclude<WorkspaceRole, "OWNER"> }) => membersApi.add(workspaceId, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["workspaces", workspaceId, "members"] }),
  });
}

export function useUpdateMemberRole(workspaceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ memberId, role }: { memberId: string; role: WorkspaceRole }) =>
      membersApi.updateRole(workspaceId, memberId, role),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["workspaces", workspaceId, "members"] }),
  });
}

export function useRemoveMember(workspaceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (memberId: string) => membersApi.remove(workspaceId, memberId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["workspaces", workspaceId, "members"] }),
  });
}
