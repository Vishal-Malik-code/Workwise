"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useProjects, useCreateProject } from "@/hooks/useProjects";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function WorkspacePage() {
  const { workspaceId } = useParams();
  const { data: projects, isLoading } = useProjects(workspaceId);
  const createProject = useCreateProject(workspaceId);
  const [name, setName] = useState("");

  function handleCreate(e) {
    e.preventDefault();
    if (!name.trim()) return;
    createProject.mutate({ name }, { onSuccess: () => setName("") });
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Projects</h1>
        <Link href={`/dashboard/${workspaceId}/members`} className="text-sm text-indigo-400">
          Manage members
        </Link>
      </div>

      <form onSubmit={handleCreate} className="mb-8 flex gap-2">
        <Input
          placeholder="New project name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="max-w-xs"
        />
        <Button type="submit" disabled={createProject.isPending}>
          {createProject.isPending ? "Creating..." : "Create project"}
        </Button>
      </form>

      {isLoading ? (
        <p className="text-white/50">Loading...</p>
      ) : projects?.length ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => (
            <Link key={p.id} href={`/dashboard/${workspaceId}/projects/${p.id}`}>
              <Card className="transition-colors hover:border-indigo-400/50">
                <h3 className="font-semibold">{p.name}</h3>
                {p.description && <p className="mt-1 text-sm text-white/50">{p.description}</p>}
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <p className="text-white/50">No projects yet — create one above.</p>
      )}
    </div>
  );
}
