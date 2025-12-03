import { cn } from "@/lib/utils";
import type { HTMLAttributes, PropsWithChildren } from "react";

export function Flex({ children, className, row, col, ...props }: PropsWithChildren<HTMLAttributes<HTMLDivElement> & { col?: boolean; row?: boolean }>) {
  return (
    <div {...props} className={cn("w-full flex", className, { "flex-row": row, "flex-col": col })}>
      {children}
    </div>
  )
}