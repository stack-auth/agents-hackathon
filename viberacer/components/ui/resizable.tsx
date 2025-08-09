"use client";

import * as React from "react";
import {
  PanelGroup as BasePanelGroup,
  Panel as BasePanel,
  PanelResizeHandle,
} from "react-resizable-panels";

function cn(...classes: Array<string | undefined | false | null>) {
  return classes.filter(Boolean).join(" ");
}

export function ResizablePanelGroup({
  className,
  ...props
}: React.ComponentProps<typeof BasePanelGroup>) {
  return (
    <BasePanelGroup className={cn("h-full w-full", className)} {...props} />
  );
}

export function ResizablePanel({
  className,
  ...props
}: React.ComponentProps<typeof BasePanel>) {
  return <BasePanel className={cn("h-full", className)} {...props} />;
}

export function ResizableHandle({ className }: { className?: string }) {
  return (
    <PanelResizeHandle
      className={cn(
        "group relative flex w-px select-none items-center justify-center px-1",
        "after:absolute after:inset-y-0 after:left-1/2 after:w-1 after:-translate-x-1/2 after:rounded-full after:bg-zinc-300 dark:after:bg-zinc-700",
        "hover:after:bg-zinc-400 dark:hover:after:bg-zinc-600",
        className
      )}
    >
      <div className="pointer-events-none z-10 h-8 w-0.5 rounded bg-zinc-400 opacity-0 transition-opacity group-hover:opacity-100 dark:bg-zinc-600" />
    </PanelResizeHandle>
  );
}

