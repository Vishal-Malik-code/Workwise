import { cn } from "@/lib/utils";
import { TONE_FILL_CLASS, type StatusBadgeTone } from "@/components/shared/StatusBadge";

export interface SegmentedProgressBarProps {
  /** Count this bar represents (e.g. tasks in a given status). */
  value: number;
  /** Total against which `value` is measured (e.g. total tasks). */
  max: number;
  tone: StatusBadgeTone;
  /** Number of segments the bar is divided into. */
  segments?: number;
  className?: string;
}

/**
 * Thin horizontal bar of small rectangular segments — the filled fraction
 * (using the same tone system as StatusBadge) shows `value`'s share of
 * `max`. Purely presentational: derives its fill from data already fetched.
 */
export function SegmentedProgressBar({ value, max, tone, segments = 10, className }: SegmentedProgressBarProps) {
  const ratio = max > 0 ? value / max : 0;
  const filled = Math.min(segments, Math.round(ratio * segments));

  return (
    <div className={cn("flex items-center gap-px", className)} role="img" aria-label={`${value} of ${max}`}>
      {Array.from({ length: segments }, (_, i) => (
        <span key={i} className={cn("h-1 flex-1", i < filled ? TONE_FILL_CLASS[tone] : "bg-border")} />
      ))}
    </div>
  );
}
