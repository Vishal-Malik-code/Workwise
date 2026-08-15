"use client";

import { forwardRef } from "react";
import { Switch as RadixSwitch } from "radix-ui";
import { cn } from "@/lib/utils";

// Exception to the sharp-corners rule: the track and thumb keep a small radius
// so the control still reads as a toggle switch at a glance, per the brief's
// allowance for this one control.
export const Switch = forwardRef<
  React.ElementRef<typeof RadixSwitch.Root>,
  React.ComponentPropsWithoutRef<typeof RadixSwitch.Root>
>(({ className, ...props }, ref) => (
  <RadixSwitch.Root
    ref={ref}
    className={cn(
      "relative h-5 w-9 shrink-0 rounded-full border border-border bg-surface outline-none transition-colors data-[state=checked]:border-accent data-[state=checked]:bg-accent disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background",
      className,
    )}
    {...props}
  >
    <RadixSwitch.Thumb className="block h-3.5 w-3.5 translate-x-0.5 rounded-full bg-white transition-transform data-[state=checked]:translate-x-[18px]" />
  </RadixSwitch.Root>
));
Switch.displayName = "Switch";
