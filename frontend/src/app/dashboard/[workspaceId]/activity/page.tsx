"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useActivity } from "@/features/activity/useActivity";
import { Card } from "@/components/ui/card";
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
      <h1 className="mb-6 text-xl font-semibold">Activity</h1>

      {isLoading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      ) : data?.items.length ? (
        <div className="space-y-2">
          {data.items.map((log) => (
            <Card key={log.id} className="py-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Badge variant="accent">{titleCase(log.action.replace(/\./g, "_"))}</Badge>
                  <span className="text-sm text-foreground/80">
                    {log.targetType}
                    {log.targetId ? ` · ${log.targetId.slice(0, 8)}` : ""}
                  </span>
                </div>
                <span className="text-xs text-muted">{formatDateTime(log.createdAt)}</span>
              </div>
              {log.metadata && Object.keys(log.metadata).length > 0 && (
                <DiffView metadata={log.metadata} />
              )}
            </Card>
          ))}
        </div>
      ) : (
        <p className="text-muted">No activity recorded yet.</p>
      )}

      <div className="mt-6 flex items-center justify-between">
        <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
          Previous
        </Button>
        <span className="text-xs text-muted">Page {page}</span>
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
      <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
        <pre className="overflow-x-auto rounded-md bg-red-500/10 p-2 text-red-300">
          {JSON.stringify(metadata.oldValue ?? null, null, 2)}
        </pre>
        <pre className="overflow-x-auto rounded-md bg-emerald-500/10 p-2 text-emerald-300">
          {JSON.stringify(metadata.newValue ?? null, null, 2)}
        </pre>
      </div>
    );
  }

  return (
    <pre className="mt-2 overflow-x-auto rounded-md bg-black/30 p-2 text-xs text-muted">
      {JSON.stringify(metadata, null, 2)}
    </pre>
  );
}
