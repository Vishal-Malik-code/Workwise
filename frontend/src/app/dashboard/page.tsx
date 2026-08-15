"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { useWorkspaces } from "@/features/workspaces/useWorkspaces";
import { CreateWorkspaceDialog } from "@/features/workspaces/CreateWorkspaceDialog";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { formatDate, initials } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { WorkspaceRole } from "@/types/api";

// A small, fixed palette of accent tints — the workspace name hashes into one
// so each workspace gets a stable, distinct-looking avatar color.
const AVATAR_TONES = [
  "bg-emerald-100 text-emerald-700",
  "bg-blue-100 text-blue-700",
  "bg-indigo-100 text-indigo-700",
  "bg-amber-100 text-amber-800",
  "bg-rose-100 text-rose-700",
  "bg-orange-100 text-orange-700",
  "bg-slate-200 text-slate-700",
];

function avatarTone(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return AVATAR_TONES[hash % AVATAR_TONES.length]!;
}

const ROLE_TONE: Record<WorkspaceRole, "neutral" | "info" | "accent" | "warning" | "orange" | "danger" | "success"> = {
  OWNER: "accent",
  ADMIN: "info",
  MANAGER: "success",
  MEMBER: "neutral",
  VIEWER: "neutral",
};

export default function DashboardPage() {
  const { data: workspaces, isLoading } = useWorkspaces();
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Your workspaces</h1>
          <p className="mt-1 text-sm text-muted">Pick a workspace to see its projects, tasks, and team.</p>
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      ) : workspaces?.length ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {workspaces.map((ws) => (
            <Link key={ws.id} href={`/dashboard/${ws.id}`}>
              <Card className="card-hover-lift group h-full p-5">
                <div className="flex items-start justify-between">
                  <div
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-lg text-sm font-semibold",
                      avatarTone(ws.name),
                    )}
                  >
                    {initials(ws.name)}
                  </div>
                  <StatusBadge tone={ROLE_TONE[ws.role]}>{ws.role}</StatusBadge>
                </div>
                <h3 className="mt-3 font-semibold text-foreground">{ws.name}</h3>
                <p className="text-xs text-muted">{ws.slug}</p>
                <p className="mt-3 text-xs text-muted">Created {formatDate(ws.createdAt)}</p>
              </Card>
            </Link>
          ))}

          <button type="button" onClick={() => setDialogOpen(true)} className="text-left">
            <Card className="card-hover-lift flex h-full min-h-[152px] flex-col items-center justify-center gap-2 border-dashed p-5 text-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-black/5 text-muted">
                <Plus className="h-5 w-5" />
              </div>
              <p className="text-sm font-medium text-foreground">Create a workspace</p>
              <p className="text-xs text-muted">Start a new space for a team or project.</p>
            </Card>
          </button>
        </div>
      ) : (
        <EmptyState
          title="No workspaces yet"
          description="Create your first workspace to start organizing projects and tasks."
          action={
            <button
              type="button"
              onClick={() => setDialogOpen(true)}
              className="text-sm font-medium text-accent hover:underline"
            >
              Create a workspace
            </button>
          }
        />
      )}

      <CreateWorkspaceDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}
