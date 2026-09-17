"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { reativarColaborador, desativarColaborador } from "./actions";
import { DesligamentoDialog } from "./[id]/desligamento-dialog";

export function AcoesLinha({
  colaboradorId,
  statusRh,
  motivos,
}: {
  colaboradorId: string;
  statusRh: string;
  motivos: { id: string; motivo: string; tipo_padrao: string }[];
}) {
  return (
    <div className="flex justify-end gap-2">
      <Button
        variant="outline"
        size="sm"
        render={<Link href={`/colaboradores/${colaboradorId}?modo=editar`} />}
      >
        Editar
      </Button>
      {statusRh === "ativo" ? (
        <DesligamentoDialog
          desativarAction={desativarColaborador.bind(null, colaboradorId)}
          motivos={motivos}
          variant="destructive"
        />
      ) : (
        <form action={reativarColaborador.bind(null, colaboradorId)}>
          <Button type="submit" variant="outline" size="sm">
            Reativar
          </Button>
        </form>
      )}
    </div>
  );
}
