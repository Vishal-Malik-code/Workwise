"use client";

import { useParams } from "next/navigation";
import { LabelsManager } from "@/components/labels-manager";

export default function LabelsPage() {
  const { workspaceId } = useParams<{ workspaceId: string }>();

  return (
    <div>
      <h1 className="mb-6 text-xl font-semibold">Labels</h1>
      <LabelsManager workspaceId={workspaceId} />
    </div>
  );
}
