import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface ErrorPanelProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorPanel({ title = "Something went wrong", message, onRetry, className }: ErrorPanelProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm",
        className,
      )}
    >
      <p className="font-medium text-red-300">{title}</p>
      <p className="text-red-200/80">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          Retry
        </Button>
      )}
    </div>
  );
}
