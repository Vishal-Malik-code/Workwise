import { Card } from "@/components/ui/card";

const PRIORITY_COLOR = {
  LOW: "text-white/40",
  MEDIUM: "text-blue-400",
  HIGH: "text-amber-400",
  URGENT: "text-red-400",
};

export function TaskCard({ task, onStatusChange }) {
  return (
    <Card className="mb-3 p-3">
      <p className="text-sm font-medium">{task.title}</p>
      {task.description && <p className="mt-1 text-xs text-white/50 line-clamp-2">{task.description}</p>}
      <div className="mt-3 flex items-center justify-between">
        <span className={`text-xs font-medium ${PRIORITY_COLOR[task.priority]}`}>{task.priority}</span>
        <select
          value={task.status}
          onChange={(e) => onStatusChange(task.id, e.target.value)}
          className="rounded border border-white/10 bg-transparent text-xs text-white/70"
        >
          <option className="bg-[#111319]" value="TODO">To do</option>
          <option className="bg-[#111319]" value="IN_PROGRESS">In progress</option>
          <option className="bg-[#111319]" value="IN_REVIEW">In review</option>
          <option className="bg-[#111319]" value="DONE">Done</option>
        </select>
      </div>
    </Card>
  );
}
