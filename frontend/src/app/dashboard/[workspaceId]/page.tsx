"use client";

import { useParams } from "next/navigation";
import { PulsePanel } from "@/features/assistant/PulsePanel";
import { OverviewStatsWidget } from "@/features/dashboard/OverviewStatsWidget";
import { PortfolioWidget } from "@/features/dashboard/PortfolioWidget";
import { ActivityWidget } from "@/features/dashboard/ActivityWidget";

export default function WorkspacePage() {
  const { workspaceId } = useParams<{ workspaceId: string }>();

  return (
    <div className="space-y-6">
      <div>
        <p className="label-eyebrow mb-2">Workspace overview</p>
        <h1 className="text-4xl font-bold uppercase tracking-tight text-foreground sm:text-5xl">Overview</h1>
      </div>

      <OverviewStatsWidget workspaceId={workspaceId} />

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <PortfolioWidget workspaceId={workspaceId} />
        <ActivityWidget workspaceId={workspaceId} />
      </div>

      <div className="max-w-xl">
        <PulsePanel workspaceId={workspaceId} />
      </div>
    </div>
  );
}
