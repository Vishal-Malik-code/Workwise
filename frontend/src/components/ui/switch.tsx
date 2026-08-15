"use client";

import { forwardRef } from "react";
import { Switch as RadixSwitch } from "radix-ui";
import { cn } from "@/lib/utils";

export const Switch = forwardRef<
  React.ElementRef<typeof RadixSwitch.Root>,
  React.ComponentPropsWithoutRef<typeof RadixSwitch.Root>
>(({ className, ...props }, ref) => (
  <RadixSwitch.Root
    ref={ref}
    className={cn(
      "relative h-5 w-9 shrink-0 rounded-full bg-white/10 outline-none transition-colors data-[state=checked]:bg-accent disabled:opacity-50",
      className,
    )}
    {...props}
  >
    <RadixSwitch.Thumb className="block h-4 w-4 translate-x-0.5 rounded-full bg-white shadow transition-transform data-[state=checked]:translate-x-[18px]" />
  </RadixSwitch.Root>
));
Switch.displayName = "Switch";
