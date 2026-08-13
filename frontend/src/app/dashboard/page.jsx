"use client";

import { useState } from "react";
import Link from "next/link";
import { useWorkspaces, useCreateWorkspace } from "@/hooks/useWorkspaces";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function DashboardPage() {
  const { data: workspaces, isLoading } = useWorkspaces();
  const createWorkspace = useCreateWorkspace();
  const [name, setName] = useState("");

  function handleCreate(e) {
    e.preventDefault();
    if (!name.trim()) return;
    createWorkspace.mutate(name, { onSuccess: () => setName("") });
  }

  return (
    <div>
      <h1 className="mb-6 text-xl font-semibold">Your workspaces</h1>

      <form onSubmit={handleCreate} className="mb-8 flex gap-2">
        <Input
          placeholder="New workspace name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="max-w-xs"
        />
        <Button type="submit" disabled={createWorkspace.isPending}>
          {createWorkspace.isPending ? "Creating..." : "Create workspace"}
        </Button>
      </form>

      {isLoading ? (
        <p className="text-white/50">Loading...</p>
      ) : workspaces?.length ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {workspaces.map((ws) => (
            <Link key={ws.id} href={`/dashboard/${ws.id}`}>
              <Card className="transition-colors hover:border-indigo-400/50">
                <h3 className="font-semibold">{ws.name}</h3>
                <p className="mt-1 text-xs uppercase tracking-wide text-white/40">{ws.role}</p>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <p className="text-white/50">No workspaces yet — create one above.</p>
      )}
    </div>
  );
}
