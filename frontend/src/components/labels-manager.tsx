"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useCreateLabel, useDeleteLabel, useLabels } from "@/features/labels/useLabels";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiError } from "@/lib/api-client";
import { cn } from "@/lib/utils";

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
      <form onSubmit={handleCreate} className="mb-6 flex flex-wrap items-end gap-4 border border-border p-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="label-name">Label name</Label>
          <Input
            id="label-name"
            placeholder="Label name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="max-w-xs"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Color</Label>
          <div className="flex gap-1.5">
            {SWATCHES.map((swatch) => (
              <button
                key={swatch}
                type="button"
                onClick={() => setColor(swatch)}
                aria-label={`Choose color ${swatch}`}
                className={cn(
                  "h-6 w-6 border transition-shadow",
                  color === swatch ? "border-foreground ring-2 ring-foreground ring-offset-2 ring-offset-background" : "border-border",
                )}
                style={{ backgroundColor: swatch }}
              />
            ))}
          </div>
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
        <div className="divide-y divide-border border border-border">
          {labels.map((label) => (
            <div key={label.id} className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="h-3 w-3 border border-border" style={{ backgroundColor: label.color }} />
                <span className="text-sm font-medium text-foreground">{label.name}</span>
              </div>
              <Button variant="ghost" size="sm" onClick={() => handleDelete(label.id)}>
                Delete
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-muted">No labels yet.</p>
      )}
    </div>
  );
}
