import { cn } from "@/lib/utils";
import type { PropsWithChildren, HTMLAttributes } from "react";

export function ScrollArea({ children, className, ...props }: PropsWithChildren<HTMLAttributes<HTMLDivElement>>) {
  return (
    <div {...props} className={cn("flex flex-col gap-4 items-center overflow-auto p-2 w-full", className)}>
      {children}
    </div>
  )
}