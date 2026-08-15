"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { useMembers, useRemoveMember, useUpdateMemberRole } from "@/features/members/useMembers";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ApiError } from "@/lib/api-client";
import { useCreateInvite } from "@/features/invites/useInvites";
import type { WorkspaceRole } from "@/types/api";

const ASSIGNABLE_ROLES: Exclude<WorkspaceRole, "OWNER">[] = ["ADMIN", "MANAGER", "MEMBER", "VIEWER"];

export default function MembersPage() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const { data: members, isLoading } = useMembers(workspaceId);
  const createInvite = useCreateInvite(workspaceId);
  const updateRole = useUpdateMemberRole(workspaceId);
  const removeMember = useRemoveMember(workspaceId);
  const [email, setEmail] = useState("");

  function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    createInvite.mutate(
      { email, role: "MEMBER" },
      {
        onSuccess: () => {
          setEmail("");
          toast.success("Invite sent");
        },
        onError: (err) => toast.error(err instanceof ApiError ? err.message : "Could not invite member"),
      },
    );
  }

  function handleRoleChange(memberId: string, role: WorkspaceRole) {
    updateRole.mutate(
      { memberId, role },
      { onError: (err) => toast.error(err instanceof ApiError ? err.message : "Could not update role") },
    );
  }

  function handleRemove(memberId: string) {
    removeMember.mutate(memberId, {
      onError: (err) => toast.error(err instanceof ApiError ? err.message : "Could not remove member"),
    });
  }

  return (
    <div>
      <h1 className="mb-6 text-xl font-semibold">Members</h1>

      <form onSubmit={handleInvite} className="mb-8 flex gap-2">
        <Input
          type="email"
          placeholder="Invite by email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="max-w-xs"
        />
        <Button type="submit" disabled={createInvite.isPending}>
          Send invite
        </Button>
      </form>

      {isLoading ? (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {members?.map((m) => (
            <Card key={m.id} className="flex items-center justify-between py-3">
              <div>
                <p className="font-medium">{m.name}</p>
                <p className="text-sm text-muted">{m.email}</p>
              </div>
              <div className="flex items-center gap-2">
                {m.role === "OWNER" ? (
                  <span className="text-xs uppercase tracking-wide text-muted">Owner</span>
                ) : (
                  <>
                    <Select value={m.role} onValueChange={(role) => handleRoleChange(m.id, role as WorkspaceRole)}>
                      <SelectTrigger className="h-8 w-32 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ASSIGNABLE_ROLES.map((role) => (
                          <SelectItem key={role} value={role}>
                            {role}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button variant="ghost" size="sm" onClick={() => handleRemove(m.id)}>
                      Remove
                    </Button>
                  </>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
