"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/status-badge";
import { formatarData } from "@/lib/date";
import { formatarMoeda } from "@/lib/formatacao";
import { situacaoVencimento, type SituacaoVencimento } from "@/lib/vencimento";
import type { ParticipacaoItem, NrColaboradorItem } from "@/lib/data/treinamentos";

// "Sem registro" é uma pendência (NR acompanhada que nunca foi feita) — mesma regra do
// módulo Treinamentos (ver src/app/(app)/treinamentos/nr-tab.tsx).
function situacaoNr(item: NrColaboradorItem): SituacaoVencimento {
  if (!item.treinamento_id) return { tone: "danger", texto: "Sem registro" };
  return situacaoVencimento(item.data_vencimento) ?? { tone: "success", texto: "Sem vencimento" };
}

export function TreinamentosTab({
  nome,
  participacoes,
  nrAcompanhamento,
}: {
  nome: string;
  participacoes: ParticipacaoItem[];
  nrAcompanhamento: NrColaboradorItem[];
}) {
  const gerais = useMemo(
    () => participacoes.filter((p) => p.tipo === "geral").sort((a, b) => b.data.localeCompare(a.data)),
    [participacoes],
  );

  const historicoPorNr = useMemo(() => {
    const mapa = new Map<string, ParticipacaoItem[]>();
    for (const p of participacoes) {
      if (p.tipo !== "NR" || !p.nr_numero) continue;
      if (!mapa.has(p.nr_numero)) mapa.set(p.nr_numero, []);
      mapa.get(p.nr_numero)!.push(p);
    }
    for (const lista of mapa.values()) {
      lista.sort((a, b) => b.data.localeCompare(a.data));
    }
    return mapa;
  }, [participacoes]);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          Mesmos registros do módulo Treinamentos — qualquer alteração feita
          ali aparece aqui, e vice-versa.
        </p>
        <Link href={`/treinamentos?busca=${encodeURIComponent(nome)}`}>
          <Button type="button" variant="outline" size="sm">
            Ver e editar em Treinamentos
          </Button>
        </Link>
      </div>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-foreground">
          Treinamentos obrigatórios (NR)
        </h3>
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border text-xs uppercase text-muted-foreground">
              <tr>
                <th className="w-8 px-4 py-2" />
                <th className="px-4 py-2 font-medium">Curso</th>
                <th className="px-4 py-2 font-medium">Prazo</th>
                <th className="px-4 py-2 font-medium">Situação</th>
              </tr>
            </thead>
            <tbody>
              {nrAcompanhamento.map((item) => (
                <LinhaNr
                  key={item.nr_numero}
                  item={item}
                  historico={historicoPorNr.get(item.nr_numero) ?? []}
                />
              ))}
              {nrAcompanhamento.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-muted-foreground">
                    Nenhuma NR acompanhada — a função não exige nenhuma, ou o
                    acompanhamento foi desligado individualmente.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-foreground">Treinamentos gerais</h3>
        <p className="text-xs text-muted-foreground">
          Sem situação de pendência — treinamentos gerais não geram alerta.
        </p>
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-2 font-medium">Curso</th>
                <th className="px-4 py-2 font-medium">Categoria</th>
                <th className="px-4 py-2 font-medium">Data</th>
                <th className="px-4 py-2 font-medium">Carga horária</th>
              </tr>
            </thead>
            <tbody>
              {gerais.map((p) => (
                <tr key={p.participante_id} className="border-b border-border last:border-0">
                  <td className="px-4 py-2">{p.treinamento_nome}</td>
                  <td className="px-4 py-2 text-muted-foreground">{p.categoria_nome ?? "Sem categoria"}</td>
                  <td className="px-4 py-2 text-muted-foreground">{formatarData(p.data)}</td>
                  <td className="px-4 py-2 text-muted-foreground">
                    {p.carga_horaria}h
                    {p.custo_total ? ` · ${formatarMoeda(p.custo_total)}` : ""}
                  </td>
                </tr>
              ))}
              {gerais.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-muted-foreground">
                    Nenhum treinamento geral registrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function LinhaNr({
  item,
  historico,
}: {
  item: NrColaboradorItem;
  historico: ParticipacaoItem[];
}) {
  const [aberto, setAberto] = useState(false);
  const situacao = situacaoNr(item);

  return (
    <>
      <tr
        className="cursor-pointer border-b border-border last:border-0 hover:bg-muted/30"
        onClick={() => setAberto((v) => !v)}
      >
        <td className="px-4 py-2 text-center text-muted-foreground">{aberto ? "▾" : "▸"}</td>
        <td className="px-4 py-2">
          {item.nr} — {item.nr_nome}
        </td>
        <td className="px-4 py-2 text-muted-foreground">{formatarData(item.data_vencimento)}</td>
        <td className="px-4 py-2">
          {item.acompanhar ? (
            <StatusBadge tone={situacao.tone}>{situacao.texto}</StatusBadge>
          ) : (
            <StatusBadge tone="neutral">Sem acompanhamento</StatusBadge>
          )}
        </td>
      </tr>
      {aberto && (
        <tr className="border-b border-border bg-muted/20 last:border-0">
          <td />
          <td colSpan={3} className="p-4">
            <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
              Histórico de renovações
            </p>
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="py-1 font-medium">Data</th>
                  <th className="py-1 font-medium">Vencimento</th>
                  <th className="py-1 font-medium">Carga horária</th>
                  <th className="py-1 font-medium">Instrutor</th>
                </tr>
              </thead>
              <tbody>
                {historico.map((h) => (
                  <tr key={h.participante_id} className="border-t border-border">
                    <td className="py-1.5">{formatarData(h.data)}</td>
                    <td className="py-1.5 text-muted-foreground">{formatarData(h.data_vencimento)}</td>
                    <td className="py-1.5 text-muted-foreground">{h.carga_horaria}h</td>
                    <td className="py-1.5 text-muted-foreground">{h.instrutor ?? "—"}</td>
                  </tr>
                ))}
                {historico.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-1.5 text-muted-foreground">
                      Nenhum curso registrado ainda.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </td>
        </tr>
      )}
    </>
  );
}
