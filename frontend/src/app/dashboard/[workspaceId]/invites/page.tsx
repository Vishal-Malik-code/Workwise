"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { useCreateInvite, useInvites } from "@/features/invites/useInvites";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { StatusBadge, type StatusBadgeTone } from "@/components/shared/StatusBadge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ApiError } from "@/lib/api-client";
import { formatDate } from "@/lib/format";
import type { WorkspaceRole } from "@/types/api";

const ASSIGNABLE_ROLES: Exclude<WorkspaceRole, "OWNER">[] = ["ADMIN", "MANAGER", "MEMBER", "VIEWER"];

const STATUS_TONE: Record<string, StatusBadgeTone> = {
  PENDING: "warning",
  ACCEPTED: "success",
  DECLINED: "neutral",
  EXPIRED: "danger",
};

export default function InvitesPage() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const { data: invites, isLoading } = useInvites(workspaceId);
  const createInvite = useCreateInvite(workspaceId);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Exclude<WorkspaceRole, "OWNER">>("MEMBER");

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    createInvite.mutate(
      { email, role },
      {
        onSuccess: (data) => {
          setEmail("");
          toast.success(
            data.token ? `Invite created — share this link manually: /invites/${data.token}` : "Invite created",
          );
        },
        onError: (err) => toast.error(err instanceof ApiError ? err.message : "Could not create invite"),
      },
    );
  }

  return (
    <div>
      <p className="label-eyebrow mb-2">Workspace</p>
      <h1 className="mb-3 text-3xl font-bold uppercase tracking-tight text-foreground sm:text-4xl">Invites</h1>
      <p className="mb-6 max-w-xl text-sm text-muted">
        Invite people to this workspace by email. There is no outbound email delivery yet — after creating an
        invite, share its link with the invitee out of band.
      </p>

      <form onSubmit={handleCreate} className="mb-8 flex flex-wrap items-end gap-4 border border-border p-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="invite-email">Email address</Label>
          <Input
            id="invite-email"
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="max-w-xs"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Role</Label>
          <Select value={role} onValueChange={(v) => setRole(v as Exclude<WorkspaceRole, "OWNER">)}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ASSIGNABLE_ROLES.map((r) => (
                <SelectItem key={r} value={r}>
                  {r}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button type="submit" disabled={createInvite.isPending}>
          {createInvite.isPending ? "Sending..." : "Send invite"}
        </Button>
      </form>

      {isLoading ? (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      ) : invites?.length ? (
        <div className="divide-y divide-border border border-border">
          {invites.map((invite) => (
            <div key={invite.id} className="flex items-center justify-between gap-4 px-4 py-3">
              <div>
                <p className="text-sm font-medium text-foreground">{invite.email}</p>
                <p className="mt-0.5 font-mono text-xs text-muted">
                  {invite.role} &middot; expires {formatDate(invite.expiresAt)}
                </p>
              </div>
              <StatusBadge tone={STATUS_TONE[invite.status] ?? "neutral"}>{invite.status}</StatusBadge>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-muted">No pending invites.</p>
      )}
    </div>
  );
}
