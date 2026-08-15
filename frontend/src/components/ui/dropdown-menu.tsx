"use client";

import { forwardRef } from "react";
import { DropdownMenu as RadixDropdownMenu } from "radix-ui";
import { Check, ChevronRight, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

export const DropdownMenu = RadixDropdownMenu.Root;
export const DropdownMenuTrigger = RadixDropdownMenu.Trigger;
export const DropdownMenuGroup = RadixDropdownMenu.Group;
export const DropdownMenuRadioGroup = RadixDropdownMenu.RadioGroup;

export const DropdownMenuContent = forwardRef<
  React.ElementRef<typeof RadixDropdownMenu.Content>,
  React.ComponentPropsWithoutRef<typeof RadixDropdownMenu.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
  <RadixDropdownMenu.Portal>
    <RadixDropdownMenu.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        "z-50 min-w-[10rem] overflow-hidden rounded-lg border border-border bg-background p-1 text-foreground shadow-xl",
        className,
      )}
      {...props}
    />
  </RadixDropdownMenu.Portal>
));
DropdownMenuContent.displayName = "DropdownMenuContent";

export const DropdownMenuItem = forwardRef<
  React.ElementRef<typeof RadixDropdownMenu.Item>,
  React.ComponentPropsWithoutRef<typeof RadixDropdownMenu.Item> & { inset?: boolean }
>(({ className, inset, ...props }, ref) => (
  <RadixDropdownMenu.Item
    ref={ref}
    className={cn(
      "relative flex cursor-pointer select-none items-center rounded-md px-2 py-1.5 text-sm outline-none transition-colors data-[highlighted]:bg-white/10 data-[disabled]:opacity-50",
      inset && "pl-8",
      className,
    )}
    {...props}
  />
));
DropdownMenuItem.displayName = "DropdownMenuItem";

export const DropdownMenuCheckboxItem = forwardRef<
  React.ElementRef<typeof RadixDropdownMenu.CheckboxItem>,
  React.ComponentPropsWithoutRef<typeof RadixDropdownMenu.CheckboxItem>
>(({ className, children, checked, ...props }, ref) => (
  <RadixDropdownMenu.CheckboxItem
    ref={ref}
    checked={checked}
    className={cn(
      "relative flex cursor-pointer select-none items-center rounded-md py-1.5 pl-8 pr-2 text-sm outline-none data-[highlighted]:bg-white/10",
      className,
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <RadixDropdownMenu.ItemIndicator>
        <Check className="h-4 w-4" />
      </RadixDropdownMenu.ItemIndicator>
    </span>
    {children}
  </RadixDropdownMenu.CheckboxItem>
));
DropdownMenuCheckboxItem.displayName = "DropdownMenuCheckboxItem";

export const DropdownMenuRadioItem = forwardRef<
  React.ElementRef<typeof RadixDropdownMenu.RadioItem>,
  React.ComponentPropsWithoutRef<typeof RadixDropdownMenu.RadioItem>
>(({ className, children, ...props }, ref) => (
  <RadixDropdownMenu.RadioItem
    ref={ref}
    className={cn(
      "relative flex cursor-pointer select-none items-center rounded-md py-1.5 pl-8 pr-2 text-sm outline-none data-[highlighted]:bg-white/10",
      className,
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <RadixDropdownMenu.ItemIndicator>
        <Circle className="h-2 w-2 fill-current" />
      </RadixDropdownMenu.ItemIndicator>
    </span>
    {children}
  </RadixDropdownMenu.RadioItem>
));
DropdownMenuRadioItem.displayName = "DropdownMenuRadioItem";

export const DropdownMenuLabel = forwardRef<
  React.ElementRef<typeof RadixDropdownMenu.Label>,
  React.ComponentPropsWithoutRef<typeof RadixDropdownMenu.Label> & { inset?: boolean }
>(({ className, inset, ...props }, ref) => (
  <RadixDropdownMenu.Label
    ref={ref}
    className={cn("px-2 py-1.5 text-xs font-semibold text-muted", inset && "pl-8", className)}
    {...props}
  />
));
DropdownMenuLabel.displayName = "DropdownMenuLabel";

export const DropdownMenuSeparator = forwardRef<
  React.ElementRef<typeof RadixDropdownMenu.Separator>,
  React.ComponentPropsWithoutRef<typeof RadixDropdownMenu.Separator>
>(({ className, ...props }, ref) => (
  <RadixDropdownMenu.Separator ref={ref} className={cn("-mx-1 my-1 h-px bg-border", className)} {...props} />
));
DropdownMenuSeparator.displayName = "DropdownMenuSeparator";

export const DropdownMenuSub = RadixDropdownMenu.Sub;
export const DropdownMenuSubTrigger = forwardRef<
  React.ElementRef<typeof RadixDropdownMenu.SubTrigger>,
  React.ComponentPropsWithoutRef<typeof RadixDropdownMenu.SubTrigger> & { inset?: boolean }
>(({ className, inset, children, ...props }, ref) => (
  <RadixDropdownMenu.SubTrigger
    ref={ref}
    className={cn(
      "flex cursor-pointer select-none items-center rounded-md px-2 py-1.5 text-sm outline-none data-[highlighted]:bg-white/10",
      inset && "pl-8",
      className,
    )}
    {...props}
  >
    {children}
    <ChevronRight className="ml-auto h-4 w-4" />
  </RadixDropdownMenu.SubTrigger>
));
DropdownMenuSubTrigger.displayName = "DropdownMenuSubTrigger";

export const DropdownMenuSubContent = forwardRef<
  React.ElementRef<typeof RadixDropdownMenu.SubContent>,
  React.ComponentPropsWithoutRef<typeof RadixDropdownMenu.SubContent>
>(({ className, ...props }, ref) => (
  <RadixDropdownMenu.SubContent
    ref={ref}
    className={cn("z-50 min-w-[8rem] overflow-hidden rounded-lg border border-border bg-background p-1 shadow-xl", className)}
    {...props}
  />
));
DropdownMenuSubContent.displayName = "DropdownMenuSubContent";
