"use client";

import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TaskDetailPanel } from "@/features/tasks/TaskDetailPanel";

/**
 * Standalone fallback route for direct links / refresh / back-button. The
 * primary interaction is the modal opened from the Kanban board
 * (see TaskDetailDialog), which renders the same TaskDetailPanel.
 */
export default function TaskDetailPage() {
  const { workspaceId, projectId, taskId } = useParams<{ workspaceId: string; projectId: string; taskId: string }>();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Task details</CardTitle>
      </CardHeader>
      <CardContent>
        <TaskDetailPanel workspaceId={workspaceId} projectId={projectId} taskId={taskId} />
      </CardContent>
    </Card>
  );
}
