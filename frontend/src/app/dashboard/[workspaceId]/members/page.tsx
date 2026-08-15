"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { useMembers, useRemoveMember, useUpdateMemberRole } from "@/features/members/useMembers";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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

  const roleBreakdown = useMemo(() => {
    const counts = new Map<WorkspaceRole, number>();
    for (const m of members ?? []) {
      counts.set(m.role, (counts.get(m.role) ?? 0) + 1);
    }
    const order: WorkspaceRole[] = ["OWNER", "ADMIN", "MANAGER", "MEMBER", "VIEWER"];
    const rows = order
      .filter((role) => counts.has(role))
      .map((role) => ({ role, count: counts.get(role) ?? 0 }));
    const total = rows.reduce((sum, r) => sum + r.count, 0);
    return { rows, total };
  }, [members]);

  return (
    <div className="space-y-6">
      <div>
        <p className="label-eyebrow mb-2">Members</p>
        <h1 className="text-4xl font-bold uppercase tracking-tight text-foreground sm:text-5xl">Members</h1>
      </div>

      <form onSubmit={handleInvite} className="flex gap-2">
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
        <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members?.map((m) => (
                <TableRow key={m.id}>
                  <TableCell>
                    <p className="font-medium text-foreground">{m.name}</p>
                    <p className="text-sm text-muted">{m.email}</p>
                  </TableCell>
                  <TableCell>
                    <Badge variant={m.role === "OWNER" ? "orange" : "default"}>{m.role}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {m.role === "OWNER" ? (
                      <span className="text-xs uppercase tracking-wide text-muted">No actions</span>
                    ) : (
                      <div className="flex items-center justify-end gap-2">
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
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <Card className="h-fit">
            <p className="label-eyebrow mb-4">Role breakdown</p>
            <div className="divide-y divide-border">
              {roleBreakdown.rows.map(({ role, count }) => (
                <div key={role} className="flex items-center justify-between py-2 text-sm">
                  <span className="uppercase tracking-wide text-muted">{role}</span>
                  <span className="font-mono text-foreground">{count}</span>
                </div>
              ))}
            </div>
            <div className="mt-2 flex items-center justify-between border-t border-border pt-3">
              <span className="text-sm font-bold uppercase tracking-wide text-foreground">Total</span>
              <span className="font-mono text-sm font-bold text-foreground">{roleBreakdown.total}</span>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
