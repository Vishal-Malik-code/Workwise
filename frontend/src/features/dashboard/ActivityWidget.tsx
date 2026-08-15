"use client";

import Link from "next/link";
import { useActivity } from "@/features/activity/useActivity";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { formatRelativeTime, titleCase } from "@/lib/format";

interface ActivityWidgetProps {
  workspaceId: string | undefined;
}

const RECENT_LIMIT = 6;

export function ActivityWidget({ workspaceId }: ActivityWidgetProps) {
  const { data, isLoading } = useActivity(workspaceId, { page: 1, limit: RECENT_LIMIT });

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <div>
          <CardTitle>Recent activity</CardTitle>
          <CardDescription>What's happened lately in this workspace.</CardDescription>
        </div>
        {workspaceId && (
          <Link href={`/dashboard/${workspaceId}/activity`} className="text-sm text-accent hover:underline">
            View all
          </Link>
        )}
      </CardHeader>

      {isLoading ? (
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-12" />
          ))}
        </div>
      ) : data?.items.length ? (
        <ul className="divide-y divide-border border-t border-border">
          {data.items.map((log) => (
            <li key={log.id} className="flex items-center justify-between gap-3 px-2 py-3">
              <div className="flex min-w-0 items-center gap-2">
                <Badge variant="orange">{titleCase(log.action.replace(/\./g, "_"))}</Badge>
                <span className="truncate text-sm text-foreground/80">
                  {log.targetType}
                  {log.targetId ? ` · ${log.targetId.slice(0, 8)}` : ""}
                </span>
              </div>
              <span className="shrink-0 font-mono text-xs text-muted">{formatRelativeTime(log.createdAt)}</span>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState title="No activity yet" description="Actions taken in this workspace will show up here." />
      )}
    </Card>
  );
}
