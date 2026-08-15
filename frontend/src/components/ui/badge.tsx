import type { HTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

// Every tone pairs a soft, light background tint with a strongly-contrasting,
// saturated foreground text color — never the same hue value for both, so
// text stays legible regardless of where the badge renders.
export const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
  {
    variants: {
      variant: {
        default: "bg-slate-200/70 text-slate-700",
        outline: "border border-border text-foreground",
        accent: "bg-indigo-100 text-indigo-700",
        info: "bg-blue-100 text-blue-700",
        success: "bg-emerald-100 text-emerald-700",
        warning: "bg-amber-100 text-amber-800",
        orange: "bg-orange-100 text-orange-700",
        danger: "bg-rose-100 text-rose-700",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
