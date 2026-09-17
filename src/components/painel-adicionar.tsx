"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function PainelAdicionar({
  rotulo,
  children,
}: {
  rotulo: string;
  children: (fechar: () => void) => React.ReactNode;
}) {
  const [aberto, setAberto] = useState(false);

  if (!aberto) {
    return (
      <Button variant="outline" size="sm" onClick={() => setAberto(true)}>
        {rotulo}
      </Button>
    );
  }

  return <>{children(() => setAberto(false))}</>;
}
