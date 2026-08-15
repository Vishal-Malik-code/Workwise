"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { TaskDetailPanel } from "./TaskDetailPanel";

export interface TaskDetailDialogProps {
  workspaceId: string;
  projectId: string;
  taskId: string | null;
  onOpenChange: (open: boolean) => void;
}

/** Opens task detail as a modal over the Kanban board, reusing the same form/comments panel as the standalone route. */
export function TaskDetailDialog({ workspaceId, projectId, taskId, onOpenChange }: TaskDetailDialogProps) {
  return (
    <Dialog open={!!taskId} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Task details</DialogTitle>
        </DialogHeader>
        {taskId && (
          <TaskDetailPanel
            workspaceId={workspaceId}
            projectId={projectId}
            taskId={taskId}
            onClose={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
