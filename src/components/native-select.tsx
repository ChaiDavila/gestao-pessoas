import * as React from "react";
import { cn } from "@/lib/utils";

// Select nativo (não o componente shadcn/base-ui): garante compatibilidade direta com
// submissão de formulário via FormData nos Server Actions, sem depender do comportamento
// de progressive enhancement de um componente headless.
function NativeSelect({
  className,
  children,
  ...props
}: React.ComponentProps<"select">) {
  return (
    <select
      className={cn(
        "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
}

export { NativeSelect };
