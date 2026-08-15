"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/features/auth/useAuth";
import { useMembers } from "@/features/members/useMembers";
import { useDeleteWorkspace, useTransferOwnership, useUpdateWorkspace, useWorkspace } from "@/features/workspaces/useWorkspaces";
import { LabelsManager } from "@/components/labels-manager";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ApiError } from "@/lib/api-client";

export default function SettingsPage() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { data: workspace, isLoading: isWorkspaceLoading } = useWorkspace(workspaceId);
  const { data: members } = useMembers(workspaceId);

  const currentRole = useMemo(
    () => members?.find((m) => m.userId === user?.id)?.role,
    [members, user?.id],
  );
  const isOwner = currentRole === "OWNER";

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <p className="label-eyebrow mb-2">Workspace</p>
        <h1 className="text-3xl font-bold uppercase tracking-tight text-foreground sm:text-4xl">Settings</h1>
      </div>

      <GeneralSettings workspaceId={workspaceId} isLoading={isWorkspaceLoading} name={workspace?.name} />

      <Card className="card-hover-lift">
        <CardHeader className="border-b border-border pb-4">
          <CardTitle className="text-sm font-semibold uppercase tracking-wide">Labels</CardTitle>
          <CardDescription>Manage labels used across projects and tasks in this workspace.</CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <LabelsManager workspaceId={workspaceId} />
        </CardContent>
      </Card>

      {isOwner && workspace ? <OwnershipSettings workspaceId={workspaceId} workspaceName={workspace.name} /> : null}

      {isOwner && workspace ? (
        <DangerZone workspaceId={workspaceId} workspaceName={workspace.name} onDeleted={() => router.push("/dashboard")} />
      ) : null}
    </div>
  );
}

function GeneralSettings({
  workspaceId,
  isLoading,
  name,
}: {
  workspaceId: string;
  isLoading: boolean;
  name: string | undefined;
}) {
  const updateWorkspace = useUpdateWorkspace(workspaceId);
  const [value, setValue] = useState(name ?? "");
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (name !== undefined && !dirty) {
      setValue(name);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!value.trim()) return;
    updateWorkspace.mutate(
      { name: value.trim() },
      {
        onSuccess: () => {
          setDirty(false);
          toast.success("Workspace name updated");
        },
        onError: (err) => toast.error(err instanceof ApiError ? err.message : "Could not update workspace"),
      },
    );
  }

  return (
    <Card className="card-hover-lift">
      <CardHeader className="border-b border-border pb-4">
        <CardTitle className="text-sm font-semibold uppercase tracking-wide">General</CardTitle>
        <CardDescription>Basic details about this workspace.</CardDescription>
      </CardHeader>
      <CardContent className="pt-4">
        {isLoading ? (
          <Skeleton className="h-10 w-full max-w-sm" />
        ) : (
          <form onSubmit={handleSubmit} className="flex max-w-sm flex-col gap-2">
            <Label htmlFor="workspace-name">Workspace name</Label>
            <div className="flex gap-2">
              <Input
                id="workspace-name"
                value={value}
                onChange={(e) => {
                  setValue(e.target.value);
                  setDirty(true);
                }}
              />
              <Button type="submit" disabled={updateWorkspace.isPending || !value.trim() || value === name}>
                {updateWorkspace.isPending ? "Saving..." : "Save"}
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}

function OwnershipSettings({ workspaceId, workspaceName }: { workspaceId: string; workspaceName: string }) {
  const { data: members } = useMembers(workspaceId);
  const transferOwnership = useTransferOwnership(workspaceId);
  const otherMembers = (members ?? []).filter((m) => m.role !== "OWNER");
  const [selectedMemberId, setSelectedMemberId] = useState<string | undefined>(undefined);
  const [open, setOpen] = useState(false);

  const selectedMember = otherMembers.find((m) => m.id === selectedMemberId);

  function handleConfirm() {
    if (!selectedMemberId) return;
    transferOwnership.mutate(selectedMemberId, {
      onSuccess: () => {
        setOpen(false);
        toast.success("Ownership transferred");
      },
      onError: (err) => toast.error(err instanceof ApiError ? err.message : "Could not transfer ownership"),
    });
  }

  return (
    <Card className="card-hover-lift">
      <CardHeader className="border-b border-border pb-4">
        <CardTitle className="text-sm font-semibold uppercase tracking-wide">Ownership</CardTitle>
        <CardDescription>Transfer ownership of {workspaceName} to another member.</CardDescription>
      </CardHeader>
      <CardContent className="pt-4">
        {otherMembers.length === 0 ? (
          <p className="text-sm text-muted">No other members to transfer ownership to.</p>
        ) : (
          <div className="flex max-w-sm items-center gap-2">
            <Select value={selectedMemberId} onValueChange={setSelectedMemberId}>
              <SelectTrigger className="w-56">
                <SelectValue placeholder="Select a member" />
              </SelectTrigger>
              <SelectContent>
                {otherMembers.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.name} ({m.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button variant="secondary" disabled={!selectedMemberId}>
                  Transfer ownership
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Transfer ownership</DialogTitle>
                  <DialogDescription>
                    {selectedMember
                      ? `${selectedMember.name} will become the owner of ${workspaceName}. You will be demoted to ADMIN.`
                      : "Choose a member above first."}
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="ghost" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleConfirm} disabled={transferOwnership.isPending || !selectedMemberId}>
                    {transferOwnership.isPending ? "Transferring..." : "Confirm transfer"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function DangerZone({
  workspaceId,
  workspaceName,
  onDeleted,
}: {
  workspaceId: string;
  workspaceName: string;
  onDeleted: () => void;
}) {
  const deleteWorkspace = useDeleteWorkspace();
  const [open, setOpen] = useState(false);
  const [confirmationName, setConfirmationName] = useState("");

  function handleDelete() {
    deleteWorkspace.mutate(
      { workspaceId, confirmationName },
      {
        onSuccess: () => {
          setOpen(false);
          toast.success("Workspace deleted");
          onDeleted();
        },
        onError: (err) => toast.error(err instanceof ApiError ? err.message : "Could not delete workspace"),
      },
    );
  }

  return (
    <Card className="border-destructive">
      <CardHeader className="border-b border-destructive/30 pb-4">
        <CardTitle className="text-sm font-semibold uppercase tracking-wide text-destructive">Danger zone</CardTitle>
        <CardDescription>Deleting a workspace permanently removes all its projects, tasks, and data.</CardDescription>
      </CardHeader>
      <CardContent className="pt-4">
        <Dialog
          open={open}
          onOpenChange={(next) => {
            setOpen(next);
            if (!next) setConfirmationName("");
          }}
        >
          <DialogTrigger asChild>
            <Button variant="danger">Delete workspace</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete {workspaceName}</DialogTitle>
              <DialogDescription>
                This action cannot be undone. Type <span className="font-semibold text-foreground">{workspaceName}</span> to
                confirm.
              </DialogDescription>
            </DialogHeader>
            <Input
              value={confirmationName}
              onChange={(e) => setConfirmationName(e.target.value)}
              placeholder={workspaceName}
              autoFocus
            />
            <DialogFooter>
              <Button variant="ghost" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={handleDelete}
                disabled={confirmationName !== workspaceName || deleteWorkspace.isPending}
              >
                {deleteWorkspace.isPending ? "Deleting..." : "Delete workspace"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
