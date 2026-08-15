"use client";

import { useParams } from "next/navigation";
import { useWorkspaceSocket } from "@/features/workspaces/useWorkspaceSocket";

export default function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  useWorkspaceSocket(workspaceId);

  return <div>{children}</div>;
}
