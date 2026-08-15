"use client";

import Link from "next/link";
import { useProjects } from "@/features/projects/useProjects";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { formatDate } from "@/lib/format";

interface PortfolioWidgetProps {
  workspaceId: string | undefined;
}

export function PortfolioWidget({ workspaceId }: PortfolioWidgetProps) {
  const { data: projects, isLoading } = useProjects(workspaceId);

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <div>
          <CardTitle>Portfolio</CardTitle>
          <CardDescription>Every project in this workspace, at a glance.</CardDescription>
        </div>
      </CardHeader>

      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      ) : projects?.length ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {projects.map((project) => (
            <Link key={project.id} href={`/dashboard/${workspaceId}/projects/${project.id}`}>
              <div className="card-hover-lift h-full border border-border bg-background p-4">
                <h3 className="font-bold text-foreground">{project.name}</h3>
                {project.description ? (
                  <p className="mt-1 line-clamp-2 text-sm text-muted">{project.description}</p>
                ) : (
                  <p className="mt-1 text-sm text-muted">No description</p>
                )}
                <p className="mt-3 font-mono text-xs text-muted">Created {formatDate(project.createdAt)}</p>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No projects yet"
          description="Create your first project to start tracking work in this workspace."
        />
      )}
    </Card>
  );
}
