"use client";

import { Button } from "@/components/ui/button";

export function ExcluirColaboradorButton({
  action,
  nome,
}: {
  action: () => Promise<void>;
  nome: string;
}) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        const confirmado = window.confirm(
          `Excluir ${nome} definitivamente? Isso remove também dependentes, formações, ASO, exames, histórico salarial e participação em treinamentos. Esta ação não pode ser desfeita.`,
        );
        if (!confirmado) e.preventDefault();
      }}
    >
      <Button type="submit" variant="destructive">
        Excluir
      </Button>
    </form>
  );
}
