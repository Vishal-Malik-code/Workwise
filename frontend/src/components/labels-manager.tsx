"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useCreateLabel, useDeleteLabel, useLabels } from "@/features/labels/useLabels";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiError } from "@/lib/api-client";

const SWATCHES = ["#6366f1", "#22c55e", "#f59e0b", "#ef4444", "#06b6d4", "#a855f7", "#ec4899", "#6b7280"];

// Shared label CRUD UI, embedded by both the standalone labels page and the
// workspace settings page so the create/delete logic only lives in one place.
export function LabelsManager({ workspaceId }: { workspaceId: string }) {
  const { data: labels, isLoading } = useLabels(workspaceId);
  const createLabel = useCreateLabel(workspaceId);
  const deleteLabel = useDeleteLabel(workspaceId);
  const [name, setName] = useState("");
  const [color, setColor] = useState(SWATCHES[0]!);

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    createLabel.mutate(
      { name, color },
      {
        onSuccess: () => setName(""),
        onError: (err) => toast.error(err instanceof ApiError ? err.message : "Could not create label"),
      },
    );
  }

  function handleDelete(labelId: string) {
    deleteLabel.mutate(labelId, {
      onError: (err) => toast.error(err instanceof ApiError ? err.message : "Could not delete label"),
    });
  }

  return (
    <div>
      <form onSubmit={handleCreate} className="mb-4 flex flex-wrap items-center gap-2">
        <Input placeholder="Label name" value={name} onChange={(e) => setName(e.target.value)} className="max-w-xs" />
        <div className="flex gap-1.5">
          {SWATCHES.map((swatch) => (
            <button
              key={swatch}
              type="button"
              onClick={() => setColor(swatch)}
              aria-label={`Choose color ${swatch}`}
              className="h-6 w-6 rounded-full ring-offset-2 ring-offset-background transition-shadow"
              style={{ backgroundColor: swatch, boxShadow: color === swatch ? `0 0 0 2px ${swatch}` : "none" }}
            />
          ))}
        </div>
        <Button type="submit" disabled={createLabel.isPending}>
          {createLabel.isPending ? "Creating..." : "Create label"}
        </Button>
      </form>

      {isLoading ? (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-12" />
          ))}
        </div>
      ) : labels?.length ? (
        <div className="space-y-2">
          {labels.map((label) => (
            <Card key={label.id} className="flex items-center justify-between py-2.5">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full" style={{ backgroundColor: label.color }} />
                <span className="text-sm font-medium">{label.name}</span>
              </div>
              <Button variant="ghost" size="sm" onClick={() => handleDelete(label.id)}>
                Delete
              </Button>
            </Card>
          ))}
        </div>
      ) : (
        <p className="text-muted">No labels yet.</p>
      )}
    </div>
  );
}
