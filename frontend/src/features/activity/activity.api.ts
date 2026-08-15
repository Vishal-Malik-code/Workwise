import { apiClient } from "@/lib/api-client";
import type { AuditLog, PaginatedResult, PaginationQuery } from "@/types/api";

export const activityApi = {
  list: (workspaceId: string, query: PaginationQuery = {}) =>
    apiClient.get<PaginatedResult<AuditLog>>(`/workspaces/${workspaceId}/activity`, { query }),
};
