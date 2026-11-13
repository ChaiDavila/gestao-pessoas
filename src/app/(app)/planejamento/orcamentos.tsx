"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/native-select";
import { StatTile } from "@/components/stat-tile";
import { InfoBanner } from "@/components/info-banner";
import { formatarData } from "@/lib/date";
import { formatarMoeda } from "@/lib/formatacao";
import {
  MESES,
  type AcaoPlanejamento,
  type CategoriaPlanejamento,
  type DespesaPlanejamento,
} from "@/lib/planejamento";

const NAO_INFORMADO = "Não informado";

type Linha = {
  acao: AcaoPlanejamento;
  previsto: number | null; // null = não informado (ou atribuído a outro período)
  previstoNoPeriodo: boolean;
  realizado: number;
};

function moeda(v: number) {
  return formatarMoeda(v) ?? "R$ 0,00";
}

export function Orcamentos({
  ano,
  onMudarAno,
  acoes,
  despesasPorAcao,
  categoriasPorId,
  onAbrirAcao,
}: {
  ano: number;
  onMudarAno: (ano: number) => void;
  acoes: AcaoPlanejamento[];
  despesasPorAcao: Map<string, DespesaPlanejamento[]>;
  categoriasPorId: Map<string, CategoriaPlanejamento>;
  onAbrirAcao: (id: string) => void;
}) {
  // "" = ano inteiro; "0".."11" = mês específico
  const [mes, setMes] = useState("");

  const prefixo = mes === "" ? `${ano}-` : `${ano}-${String(Number(mes) + 1).padStart(2, "0")}-`;
  const noPeriodo = (data: string) => data.startsWith(prefixo);

  // Regras:
  // - Previsto: atribuído inteiro ao mês da data de início (sem rateio), contado uma vez.
  //   Ações canceladas não entram no previsto.
  // - Realizado: soma das despesas pela data de cada lançamento (inclusive de ações
  //   canceladas, porque o dinheiro foi gasto).
  const linhas: Linha[] = [];
  for (const acao of acoes) {
    const previstoNoPeriodo = acao.status !== "cancelada" && noPeriodo(acao.data_inicio);
    const realizado = (despesasPorAcao.get(acao.id) ?? [])
      .filter((d) => noPeriodo(d.data))
      .reduce((s, d) => s + d.valor, 0);
    if (!previstoNoPeriodo && realizado === 0) continue;
    linhas.push({
      acao,
      previsto: previstoNoPeriodo ? acao.orcamento_previsto : null,
      previstoNoPeriodo,
      realizado,
    });
  }
  linhas.sort((a, b) => a.acao.data_inicio.localeCompare(b.acao.data_inicio));

  const totalPrevisto = linhas.reduce((s, l) => s + (l.previsto ?? 0), 0);
  const totalRealizado = linhas.reduce((s, l) => s + l.realizado, 0);
  const saldo = totalPrevisto - totalRealizado;
  const semOrcamento = linhas.filter((l) => l.previstoNoPeriodo && l.previsto === null).length;

  const porCategoria = new Map<string, { previsto: number; realizado: number }>();
  for (const l of linhas) {
    const atual = porCategoria.get(l.acao.categoria_id) ?? { previsto: 0, realizado: 0 };
    atual.previsto += l.previsto ?? 0;
    atual.realizado += l.realizado;
    porCategoria.set(l.acao.categoria_id, atual);
  }
  const categoriasOrdenadas = [...porCategoria.entries()].sort(
    (a, b) => b[1].previsto + b[1].realizado - (a[1].previsto + a[1].realizado),
  );

  const rotuloPeriodo = mes === "" ? String(ano) : `${MESES[Number(mes)]} de ${ano}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" size="icon-sm" onClick={() => onMudarAno(ano - 1)} title="Ano anterior">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="min-w-20 text-center text-lg font-semibold text-foreground">{ano}</span>
        <Button variant="outline" size="icon-sm" onClick={() => onMudarAno(ano + 1)} title="Próximo ano">
          <ChevronRight className="h-4 w-4" />
        </Button>
        <NativeSelect value={mes} onChange={(e) => setMes(e.target.value)} className="ml-2 w-44" aria-label="Mês">
          <option value="">Ano inteiro</option>
          {MESES.map((m, i) => (
            <option key={m} value={String(i)}>
              {m}
            </option>
          ))}
        </NativeSelect>
      </div>

      <InfoBanner>
        O <strong>previsto</strong> de cada ação entra uma única vez, no mês da data de início
        (atividades de vários meses não são rateadas). O <strong>realizado</strong> é a soma das
        despesas pela data de cada lançamento. Ações canceladas não entram no previsto, mas
        despesas já lançadas nelas continuam no realizado.
      </InfoBanner>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile label="Total previsto" valor={moeda(totalPrevisto)} subtitulo={rotuloPeriodo} />
        <StatTile label="Total realizado" valor={moeda(totalRealizado)} subtitulo={rotuloPeriodo} />
        <StatTile
          label={saldo < 0 ? "Acima do previsto" : "Saldo (previsto − realizado)"}
          valor={moeda(Math.abs(saldo))}
          accent={saldo < 0}
          subtitulo={
            totalPrevisto > 0 ? `${Math.round((totalRealizado / totalPrevisto) * 100)}% do previsto utilizado` : undefined
          }
        />
        <StatTile
          label="Sem orçamento informado"
          valor={String(semOrcamento)}
          subtitulo="Ações sem valor previsto"
          explicacao="Ações do período com o campo Valor previsto em branco. É diferente de R$ 0,00, que significa ação sem custo confirmada."
        />
      </div>

      <section className="rounded-lg border border-border bg-card p-4">
        <h2 className="mb-3 text-sm font-semibold text-foreground">Por categoria · previsto × realizado</h2>
        {categoriasOrdenadas.length === 0 ? (
          <p className="py-2 text-sm text-muted-foreground">Nenhum valor previsto ou despesa em {rotuloPeriodo}.</p>
        ) : (
          <div className="space-y-4">
            {categoriasOrdenadas.map(([catId, v]) => {
              const cat = categoriasPorId.get(catId);
              const pct = v.previsto > 0 ? Math.min(100, (v.realizado / v.previsto) * 100) : v.realizado > 0 ? 100 : 0;
              const estourou = v.realizado > v.previsto;
              return (
                <div key={catId}>
                  <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
                    <span className="flex items-center gap-2 font-medium text-foreground">
                      <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: cat?.cor }} />
                      {cat?.nome ?? "Sem categoria"}
                    </span>
                    <span className={estourou ? "font-medium text-danger" : "text-muted-foreground"}>
                      {moeda(v.realizado)} de {moeda(v.previsto)}
                    </span>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${pct}%`, backgroundColor: estourou ? "var(--danger)" : cat?.cor }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="rounded-lg border border-border bg-card p-4">
        <h2 className="mb-3 text-sm font-semibold text-foreground">Detalhamento por ação</h2>
        <div className="overflow-x-auto rounded-md border border-border">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-3 py-2 font-medium">Ação</th>
                <th className="px-3 py-2 font-medium">Categoria</th>
                <th className="px-3 py-2 font-medium">Data</th>
                <th className="px-3 py-2 text-right font-medium">Previsto</th>
                <th className="px-3 py-2 text-right font-medium">Realizado</th>
                <th className="px-3 py-2 text-right font-medium">Diferença</th>
              </tr>
            </thead>
            <tbody>
              {linhas.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-3 py-6 text-center text-muted-foreground">
                    Nenhuma ação com valor previsto ou despesa em {rotuloPeriodo}.
                  </td>
                </tr>
              )}
              {linhas.map((l) => {
                const cat = categoriasPorId.get(l.acao.categoria_id);
                const dif = l.previsto !== null ? l.previsto - l.realizado : null;
                return (
                  <tr
                    key={l.acao.id}
                    onClick={() => onAbrirAcao(l.acao.id)}
                    className="cursor-pointer border-b border-border last:border-0 hover:bg-muted/30"
                  >
                    <td className="px-3 py-2 font-medium text-foreground">
                      {l.acao.titulo}
                      {l.acao.status === "cancelada" && (
                        <span className="ml-2 text-xs font-normal text-muted-foreground">(cancelada)</span>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <span className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ backgroundColor: cat?.cor }} />
                        {cat?.nome}
                      </span>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-muted-foreground">
                      {formatarData(l.acao.data_inicio)}
                      {l.acao.data_fim && ` a ${formatarData(l.acao.data_fim)}`}
                    </td>
                    <td className="px-3 py-2 text-right whitespace-nowrap">
                      {l.previstoNoPeriodo ? (
                        l.previsto === null ? (
                          <span className="text-muted-foreground">{NAO_INFORMADO}</span>
                        ) : (
                          moeda(l.previsto)
                        )
                      ) : (
                        <span className="text-xs text-muted-foreground" title="O previsto desta ação está no mês de início, fora do período filtrado.">
                          em {formatarData(l.acao.data_inicio).slice(3)}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-right whitespace-nowrap">{moeda(l.realizado)}</td>
                    <td
                      className={`px-3 py-2 text-right whitespace-nowrap ${dif !== null && dif < 0 ? "font-medium text-danger" : ""}`}
                    >
                      {dif === null ? "—" : moeda(dif)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            {linhas.length > 0 && (
              <tfoot className="border-t border-border bg-muted/30 font-semibold">
                <tr>
                  <td colSpan={3} className="px-3 py-2">
                    Total
                  </td>
                  <td className="px-3 py-2 text-right whitespace-nowrap">{moeda(totalPrevisto)}</td>
                  <td className="px-3 py-2 text-right whitespace-nowrap">{moeda(totalRealizado)}</td>
                  <td className={`px-3 py-2 text-right whitespace-nowrap ${saldo < 0 ? "text-danger" : ""}`}>
                    {moeda(saldo)}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </section>
    </div>
  );
}
