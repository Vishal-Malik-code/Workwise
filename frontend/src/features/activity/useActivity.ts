"use client";

import { useQuery } from "@tanstack/react-query";
import { activityApi } from "./activity.api";
import type { PaginationQuery } from "@/types/api";

export function useActivity(workspaceId: string | undefined, query: PaginationQuery = {}) {
  return useQuery({
    queryKey: ["workspaces", workspaceId, "activity", query],
    queryFn: () => activityApi.list(workspaceId as string, query),
    enabled: !!workspaceId,
    placeholderData: (prev) => prev,
  });
}
