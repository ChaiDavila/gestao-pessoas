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
      {
        nome: string;
        cargo_nome: string | null;
        setor_nome: string | null;
        itens: ParticipacaoItem[];
      }
    >();
    for (const p of participacoes) {
      if (!mapa.has(p.colaborador_id)) {
        mapa.set(p.colaborador_id, {
          nome: p.colaborador_nome,
          cargo_nome: p.cargo_nome,
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
    <div className="overflow-x-auto rounded-lg border border-border bg-card">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-border text-xs uppercase text-muted-foreground">
          <tr>
            <th className="w-8 px-3 py-3" />
            <th className="px-3 py-3 font-medium">Colaborador</th>
            <th className="px-3 py-3 font-medium">Setor</th>
            <th className="px-3 py-3 font-medium">Treinamentos</th>
            <th className="px-3 py-3 font-medium">Horas totais</th>
            <th className="px-3 py-3" />
          </tr>
        </thead>
        <tbody>
          {porColaborador.map(([colaboradorId, info]) => (
            <LinhaColaborador
              key={colaboradorId}
              nome={info.nome}
              cargoNome={info.cargo_nome}
              setorNome={info.setor_nome}
              itens={info.itens}
            />
          ))}
          {porColaborador.length === 0 && (
            <tr>
              <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                Nenhum treinamento encontrado.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function LinhaColaborador({
  nome,
  cargoNome,
  setorNome,
  itens,
}: {
  nome: string;
  cargoNome: string | null;
  setorNome: string | null;
  itens: ParticipacaoItem[];
}) {
  const [aberto, setAberto] = useState(false);
  const horas = itens.reduce((s, i) => s + Number(i.carga_horaria || 0), 0);

  return (
    <>
      <tr
        className="cursor-pointer border-b border-border last:border-0 hover:bg-muted/30"
        onClick={() => setAberto((v) => !v)}
      >
        <td className="px-3 py-3 text-center text-muted-foreground">{aberto ? "▾" : "▸"}</td>
        <td className="px-3 py-3">
          <div className="flex items-center gap-3">
            <ColaboradorAvatar nome={nome} size="sm" />
            <div>
              <p className="font-medium text-foreground">{nome}</p>
              <p className="text-xs text-muted-foreground">{cargoNome ?? "—"}</p>
            </div>
          </div>
        </td>
        <td className="px-3 py-3 text-muted-foreground">{setorNome ?? "—"}</td>
        <td className="px-3 py-3 text-muted-foreground">{itens.length}</td>
        <td className="px-3 py-3 text-muted-foreground">{horas}h</td>
        <td className="px-3 py-3" />
      </tr>
      {aberto && (
        <tr className="border-b border-border bg-muted/20 last:border-0">
          <td />
          <td colSpan={5} className="p-4">
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
          </td>
        </tr>
      )}
    </>
  );
}
