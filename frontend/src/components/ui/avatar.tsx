"use client";

import { forwardRef } from "react";
import { Avatar as RadixAvatar } from "radix-ui";
import { cn } from "@/lib/utils";

// Square, sharp-cornered avatar per the Swiss system rather than the default
// circular treatment — consistent with the rest of the geometric UI.
export const Avatar = forwardRef<
  React.ElementRef<typeof RadixAvatar.Root>,
  React.ComponentPropsWithoutRef<typeof RadixAvatar.Root>
>(({ className, ...props }, ref) => (
  <RadixAvatar.Root
    ref={ref}
    className={cn("relative flex h-9 w-9 shrink-0 overflow-hidden border border-border bg-surface", className)}
    {...props}
  />
));
Avatar.displayName = "Avatar";

export const AvatarImage = RadixAvatar.Image;

export const AvatarFallback = forwardRef<
  React.ElementRef<typeof RadixAvatar.Fallback>,
  React.ComponentPropsWithoutRef<typeof RadixAvatar.Fallback>
>(({ className, ...props }, ref) => (
  <RadixAvatar.Fallback
    ref={ref}
    className={cn("flex h-full w-full items-center justify-center text-xs font-semibold text-foreground", className)}
    {...props}
  />
));
AvatarFallback.displayName = "AvatarFallback";
