"use client";

import type { ReactNode } from "react";
import { useProjects } from "@/features/projects/useProjects";
import { useMembers } from "@/features/members/useMembers";
import { useActivity } from "@/features/activity/useActivity";
import { useInvites } from "@/features/invites/useInvites";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface OverviewStatsWidgetProps {
  workspaceId: string | undefined;
}

interface StatTileProps {
  label: string;
  value: ReactNode;
  isLoading: boolean;
}

function StatTile({ label, value, isLoading }: StatTileProps) {
  return (
    <div className={cn("glass-card rounded-xl border border-border p-4")}>
      <p className="text-xs font-medium uppercase tracking-wide text-muted">{label}</p>
      {isLoading ? (
        <Skeleton className="mt-2 h-7 w-12" />
      ) : (
        <p className="mt-1 text-2xl font-semibold text-foreground">{value}</p>
      )}
    </div>
  );
}

export function OverviewStatsWidget({ workspaceId }: OverviewStatsWidgetProps) {
  const { data: projects, isLoading: projectsLoading } = useProjects(workspaceId);
  const { data: members, isLoading: membersLoading } = useMembers(workspaceId);
  const { data: activity, isLoading: activityLoading } = useActivity(workspaceId, { page: 1, limit: 20 });
  const { data: invites, isLoading: invitesLoading } = useInvites(workspaceId);
  const pendingInvites = invites?.filter((invite) => invite.status === "PENDING").length ?? 0;

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <StatTile label="Projects" value={projects?.length ?? 0} isLoading={projectsLoading} />
      <StatTile label="Members" value={members?.length ?? 0} isLoading={membersLoading} />
      <StatTile label="Recent events" value={activity?.items.length ?? 0} isLoading={activityLoading} />
      <StatTile label="Pending invites" value={pendingInvites} isLoading={invitesLoading} />
    </div>
  );
}
