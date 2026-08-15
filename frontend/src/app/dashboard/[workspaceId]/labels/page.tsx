"use client";

import { useParams } from "next/navigation";
import { LabelsManager } from "@/components/labels-manager";

export default function LabelsPage() {
  const { workspaceId } = useParams<{ workspaceId: string }>();

  return (
    <div>
      <p className="label-eyebrow mb-2">Workspace</p>
      <h1 className="mb-8 text-3xl font-bold uppercase tracking-tight text-foreground sm:text-4xl">Labels</h1>
      <LabelsManager workspaceId={workspaceId} />
    </div>
  );
}
