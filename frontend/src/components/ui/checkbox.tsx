"use client";

import { forwardRef } from "react";
import { Checkbox as RadixCheckbox } from "radix-ui";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export const Checkbox = forwardRef<
  React.ElementRef<typeof RadixCheckbox.Root>,
  React.ComponentPropsWithoutRef<typeof RadixCheckbox.Root>
>(({ className, ...props }, ref) => (
  <RadixCheckbox.Root
    ref={ref}
    className={cn(
      "flex h-4 w-4 shrink-0 items-center justify-center border border-border bg-background data-[state=checked]:border-accent data-[state=checked]:bg-accent disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background",
      className,
    )}
    {...props}
  >
    <RadixCheckbox.Indicator>
      <Check className="h-3 w-3 text-accent-foreground" />
    </RadixCheckbox.Indicator>
  </RadixCheckbox.Root>
));
Checkbox.displayName = "Checkbox";
