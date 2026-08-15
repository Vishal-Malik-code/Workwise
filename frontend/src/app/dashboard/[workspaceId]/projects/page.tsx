"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { useCreateProject } from "@/features/projects/useProjects";
import { PortfolioWidget } from "@/features/dashboard/PortfolioWidget";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ApiError } from "@/lib/api-client";

export default function ProjectsPage() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const createProject = useCreateProject(workspaceId);
  const [name, setName] = useState("");

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    createProject.mutate(
      { name },
      {
        onSuccess: () => setName(""),
        onError: (err) => toast.error(err instanceof ApiError ? err.message : "Couldn't create the project."),
      },
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-semibold">Projects</h1>
        <form onSubmit={handleCreate} className="flex gap-2">
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
      </div>

      <PortfolioWidget workspaceId={workspaceId} />
    </div>
  );
}
