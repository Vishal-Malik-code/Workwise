import { forwardRef } from "react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface LoadingButtonProps extends ButtonProps {
  loading?: boolean;
}

export const LoadingButton = forwardRef<HTMLButtonElement, LoadingButtonProps>(
  ({ loading = false, disabled, children, className, ...props }, ref) => {
    return (
      <Button ref={ref} disabled={disabled || loading} className={cn(className)} {...props}>
        {loading && (
          <span
            aria-hidden="true"
            className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent"
          />
        )}
        {children}
      </Button>
    );
  },
);
LoadingButton.displayName = "LoadingButton";
