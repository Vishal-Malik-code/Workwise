"use client";

import { forwardRef } from "react";
import { Label as RadixLabel } from "radix-ui";
import { cn } from "@/lib/utils";

export const Label = forwardRef<
  React.ElementRef<typeof RadixLabel.Root>,
  React.ComponentPropsWithoutRef<typeof RadixLabel.Root>
>(({ className, ...props }, ref) => (
  <RadixLabel.Root
    ref={ref}
    className={cn("text-sm font-medium leading-none text-foreground peer-disabled:opacity-50", className)}
    {...props}
  />
));
Label.displayName = "Label";
