"use client";

import { useMemo, useState } from "react";
import { ColaboradorAvatar } from "@/components/colaborador-avatar";
import { BotaoRemover } from "@/components/botao-remover";
import { formatarData } from "@/lib/date";
import { formatarMoeda } from "@/lib/formatacao";
import type { ParticipacaoItem } from "@/lib/data/treinamentos";
import { removerParticipacao } from "./actions";

export function PorColaboradorTab({
  participacoes,
}: {
  participacoes: ParticipacaoItem[];
}) {
  const porColaborador = useMemo(() => {
    const mapa = new Map<
      string,
      { nome: string; setor_nome: string | null; itens: ParticipacaoItem[] }
    >();
    for (const p of participacoes) {
      if (!mapa.has(p.colaborador_id)) {
        mapa.set(p.colaborador_id, {
          nome: p.colaborador_nome,
          setor_nome: p.setor_nome,
          itens: [],
        });
      }
      mapa.get(p.colaborador_id)!.itens.push(p);
    }
    return Array.from(mapa.entries()).sort((a, b) =>
      a[1].nome.localeCompare(b[1].nome),
    );
  }, [participacoes]);

  return (
    <div className="space-y-2">
      {porColaborador.map(([colaboradorId, info]) => (
        <LinhaColaborador
          key={colaboradorId}
          nome={info.nome}
          setorNome={info.setor_nome}
          itens={info.itens}
        />
      ))}
      {porColaborador.length === 0 && (
        <p className="rounded-lg border border-border p-6 text-center text-sm text-muted-foreground">
          Nenhum treinamento encontrado.
        </p>
      )}
    </div>
  );
}

function LinhaColaborador({
  nome,
  setorNome,
  itens,
}: {
  nome: string;
  setorNome: string | null;
  itens: ParticipacaoItem[];
}) {
  const [aberto, setAberto] = useState(false);
  const horas = itens.reduce((s, i) => s + Number(i.carga_horaria || 0), 0);

  return (
    <div className="rounded-lg border border-border">
      <button
        type="button"
        onClick={() => setAberto(!aberto)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left"
      >
        <ColaboradorAvatar nome={nome} size="sm" />
        <div className="flex-1">
          <p className="font-medium text-foreground">{nome}</p>
          <p className="text-xs text-muted-foreground">{setorNome ?? "—"}</p>
        </div>
        <p className="text-sm text-muted-foreground">
          {itens.length} treinamento(s) · {horas}h
        </p>
      </button>
      {aberto && (
        <div className="border-t border-border p-4">
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase text-muted-foreground">
              <tr>
                <th className="py-1 font-medium">Treinamento</th>
                <th className="py-1 font-medium">Tipo</th>
                <th className="py-1 font-medium">Data</th>
                <th className="py-1 font-medium">Carga horária</th>
                <th className="py-1" />
              </tr>
            </thead>
            <tbody>
              {itens.map((i) => (
                <tr key={i.participante_id} className="border-t border-border">
                  <td className="py-2">{i.treinamento_nome}</td>
                  <td className="py-2 text-muted-foreground">
                    {i.tipo === "NR" ? `NR (${i.nr_nome})` : i.categoria_nome ?? "Geral"}
                  </td>
                  <td className="py-2 text-muted-foreground">
                    {formatarData(i.data)}
                  </td>
                  <td className="py-2 text-muted-foreground">
                    {i.carga_horaria}h
                    {i.custo_total ? ` · ${formatarMoeda(i.custo_total)}` : ""}
                  </td>
                  <td className="py-2 text-right">
                    <BotaoRemover
                      action={() => removerParticipacao(i.participante_id)}
                      confirmar="Remover esta participação?"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
