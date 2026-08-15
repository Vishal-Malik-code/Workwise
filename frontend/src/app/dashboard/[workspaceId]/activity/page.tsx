"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useActivity } from "@/features/activity/useActivity";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDateTime, titleCase } from "@/lib/format";

export default function ActivityPage() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const [page, setPage] = useState(1);
  const limit = 20;
  const { data, isLoading, isPlaceholderData } = useActivity(workspaceId, { page, limit });

  return (
    <div>
      <p className="label-eyebrow mb-2">Workspace</p>
      <h1 className="mb-8 text-3xl font-bold uppercase tracking-tight text-foreground sm:text-4xl">Activity</h1>

      {isLoading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      ) : data?.items.length ? (
        <div className="divide-y divide-border border border-border">
          {data.items.map((log) => (
            <div key={log.id} className="px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Badge variant="accent">{titleCase(log.action.replace(/\./g, "_"))}</Badge>
                  <span className="text-sm text-foreground/80">
                    {log.targetType}
                    {log.targetId ? ` · ${log.targetId.slice(0, 8)}` : ""}
                  </span>
                </div>
                <span className="font-mono text-xs text-muted">{formatDateTime(log.createdAt)}</span>
              </div>
              {log.metadata && Object.keys(log.metadata).length > 0 && (
                <DiffView metadata={log.metadata} />
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-muted">No activity recorded yet.</p>
      )}

      <div className="mt-6 flex items-center justify-between">
        <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
          Previous
        </Button>
        <span className="font-mono text-xs text-muted">Page {page}</span>
        <Button
          variant="outline"
          size="sm"
          disabled={isPlaceholderData || (data ? data.items.length < limit : true)}
          onClick={() => setPage((p) => p + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}

function DiffView({ metadata }: { metadata: Record<string, unknown> }) {
  const hasOldNew = "oldValue" in metadata || "newValue" in metadata;

  if (hasOldNew) {
    return (
      <div className="mt-3 grid grid-cols-2 gap-2 font-mono text-xs">
        <pre className="overflow-x-auto border border-destructive/40 bg-destructive/5 p-2 text-destructive">
          {JSON.stringify(metadata.oldValue ?? null, null, 2)}
        </pre>
        <pre className="overflow-x-auto border border-border bg-surface p-2 text-foreground">
          {JSON.stringify(metadata.newValue ?? null, null, 2)}
        </pre>
      </div>
    );
  }

  return (
    <pre className="mt-3 overflow-x-auto border border-border bg-surface p-2 font-mono text-xs text-muted">
      {JSON.stringify(metadata, null, 2)}
    </pre>
  );
}
