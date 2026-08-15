"use client";

import { forwardRef } from "react";
import { Tabs as RadixTabs } from "radix-ui";
import { cn } from "@/lib/utils";

export const Tabs = RadixTabs.Root;

export const TabsList = forwardRef<
  React.ElementRef<typeof RadixTabs.List>,
  React.ComponentPropsWithoutRef<typeof RadixTabs.List>
>(({ className, ...props }, ref) => (
  <RadixTabs.List
    ref={ref}
    className={cn("inline-flex items-center gap-1 rounded-lg bg-white/5 p-1", className)}
    {...props}
  />
));
TabsList.displayName = "TabsList";

export const TabsTrigger = forwardRef<
  React.ElementRef<typeof RadixTabs.Trigger>,
  React.ComponentPropsWithoutRef<typeof RadixTabs.Trigger>
>(({ className, ...props }, ref) => (
  <RadixTabs.Trigger
    ref={ref}
    className={cn(
      "rounded-md px-3 py-1.5 text-sm font-medium text-muted transition-colors data-[state=active]:bg-white/10 data-[state=active]:text-foreground",
      className,
    )}
    {...props}
  />
));
TabsTrigger.displayName = "TabsTrigger";

export const TabsContent = forwardRef<
  React.ElementRef<typeof RadixTabs.Content>,
  React.ComponentPropsWithoutRef<typeof RadixTabs.Content>
>(({ className, ...props }, ref) => (
  <RadixTabs.Content ref={ref} className={cn("mt-4 outline-none", className)} {...props} />
));
TabsContent.displayName = "TabsContent";
