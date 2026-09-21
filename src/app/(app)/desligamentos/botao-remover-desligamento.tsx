"use client";

import { BotaoRemover } from "@/components/botao-remover";
import { removerDesligamento } from "./actions";

export function BotaoRemoverDesligamento({
  desligamentoId,
  confirmar,
}: {
  desligamentoId: string;
  confirmar: string;
}) {
  return (
    <BotaoRemover action={() => removerDesligamento(desligamentoId)} confirmar={confirmar} />
  );
}
