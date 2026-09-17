"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";

export function BotaoRemover({
  action,
  confirmar = "Remover este registro?",
}: {
  action: () => Promise<void>;
  confirmar?: string;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      disabled={pending}
      onClick={() => {
        if (!window.confirm(confirmar)) return;
        startTransition(() => {
          action();
        });
      }}
    >
      Remover
    </Button>
  );
}
