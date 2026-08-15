"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { useCreateInvite, useInvites } from "@/features/invites/useInvites";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ApiError } from "@/lib/api-client";
import { formatDate } from "@/lib/format";
import type { WorkspaceRole } from "@/types/api";

const ASSIGNABLE_ROLES: Exclude<WorkspaceRole, "OWNER">[] = ["ADMIN", "MANAGER", "MEMBER", "VIEWER"];

const STATUS_VARIANT: Record<string, "default" | "success" | "warning" | "danger"> = {
  PENDING: "warning",
  ACCEPTED: "success",
  DECLINED: "default",
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
      <h1 className="mb-6 text-xl font-semibold">Invites</h1>
      <p className="mb-6 max-w-xl text-sm text-muted">
        Invite people to this workspace by email. There is no outbound email delivery yet — after creating an
        invite, share its link with the invitee out of band.
      </p>

      <form onSubmit={handleCreate} className="mb-8 flex flex-wrap gap-2">
        <Input
          type="email"
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="max-w-xs"
        />
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
        <div className="space-y-2">
          {invites.map((invite) => (
            <Card key={invite.id} className="flex items-center justify-between py-3">
              <div>
                <p className="font-medium">{invite.email}</p>
                <p className="text-xs text-muted">
                  {invite.role} · expires {formatDate(invite.expiresAt)}
                </p>
              </div>
              <Badge variant={STATUS_VARIANT[invite.status] ?? "default"}>{invite.status}</Badge>
            </Card>
          ))}
        </div>
      ) : (
        <p className="text-muted">No pending invites.</p>
      )}
    </div>
  );
}
