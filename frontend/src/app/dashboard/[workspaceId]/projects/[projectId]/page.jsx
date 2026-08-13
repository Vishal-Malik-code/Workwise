"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useTasks, useCreateTask, useUpdateTask } from "@/hooks/useTasks";
import { TaskCard } from "@/components/task-card";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

const COLUMNS = [
  { key: "TODO", label: "To do" },
  { key: "IN_PROGRESS", label: "In progress" },
  { key: "IN_REVIEW", label: "In review" },
  { key: "DONE", label: "Done" },
];

export default function ProjectBoardPage() {
  const { workspaceId, projectId } = useParams();
  const { data: tasks, isLoading } = useTasks(workspaceId, projectId);
  const createTask = useCreateTask(workspaceId, projectId);
  const updateTask = useUpdateTask(workspaceId, projectId);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [title, setTitle] = useState("");

  function handleCreate(e) {
    e.preventDefault();
    if (!title.trim()) return;
    createTask.mutate({ title }, { onSuccess: () => { setTitle(""); setDialogOpen(false); } });
  }

  function handleStatusChange(taskId, status) {
    updateTask.mutate({ taskId, status });
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Board</h1>
        <Button onClick={() => setDialogOpen(true)}>New task</Button>
      </div>

      {isLoading ? (
        <p className="text-white/50">Loading...</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {COLUMNS.map((col) => (
            <div key={col.key}>
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-white/40">
                {col.label} ({tasks?.filter((t) => t.status === col.key).length ?? 0})
              </h2>
              {tasks?.filter((t) => t.status === col.key).map((task) => (
                <TaskCard key={task.id} task={task} onStatusChange={handleStatusChange} />
              ))}
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen} title="New task">
        <form onSubmit={handleCreate} className="space-y-4">
          <Input placeholder="Task title" value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />
          <Button type="submit" disabled={createTask.isPending} className="w-full">
            {createTask.isPending ? "Creating..." : "Create task"}
          </Button>
        </form>
      </Dialog>
    </div>
  );
}
