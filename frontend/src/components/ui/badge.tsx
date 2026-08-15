import type { HTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

// Every tone pairs a flat white fill with a distinct border/text color — sharp,
// bordered "tag" styling per the Swiss system rather than soft rounded pills.
// Tone-to-color mapping is preserved from the prior system so callers (e.g.
// StatusBadge) keep working unchanged.
export const badgeVariants = cva(
  "inline-flex items-center gap-1 border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
  {
    variants: {
      variant: {
        default: "border-border text-muted bg-white",
        outline: "border-border text-foreground bg-transparent",
        accent: "border-indigo-300 text-indigo-700 bg-white",
        info: "border-blue-300 text-blue-700 bg-white",
        success: "border-emerald-300 text-emerald-700 bg-white",
        warning: "border-amber-400 text-amber-800 bg-white",
        orange: "border-accent text-accent bg-white",
        danger: "border-destructive text-destructive bg-white",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
