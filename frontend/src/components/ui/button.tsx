import { forwardRef } from "react";
import type { ButtonHTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap uppercase tracking-wide text-xs font-semibold transition-colors disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background active:translate-y-px",
  {
    variants: {
      variant: {
        primary: "bg-accent text-accent-foreground border border-accent hover:bg-foreground hover:border-foreground",
        secondary: "bg-white text-foreground border border-border hover:border-foreground",
        ghost: "bg-transparent text-foreground border border-transparent hover:border-border hover:bg-surface",
        danger: "bg-destructive text-white border border-destructive hover:bg-foreground hover:border-foreground",
        outline: "border border-foreground bg-transparent text-foreground hover:bg-foreground hover:text-background",
      },
      size: {
        sm: "h-8 px-3 text-[11px]",
        md: "h-10 px-4",
        lg: "h-11 px-6 text-sm",
        icon: "h-9 w-9 p-0",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return <button ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />;
  },
);
Button.displayName = "Button";
