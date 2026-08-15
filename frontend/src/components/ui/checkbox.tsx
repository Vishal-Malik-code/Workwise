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
      "flex h-4 w-4 shrink-0 items-center justify-center rounded border border-border bg-white/5 data-[state=checked]:border-accent data-[state=checked]:bg-accent disabled:opacity-50",
      className,
    )}
    {...props}
  >
    <RadixCheckbox.Indicator>
      <Check className="h-3 w-3 text-white" />
    </RadixCheckbox.Indicator>
  </RadixCheckbox.Root>
));
Checkbox.displayName = "Checkbox";
