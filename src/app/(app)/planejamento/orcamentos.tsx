"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/native-select";
import { StatTile } from "@/components/stat-tile";
import { formatarData } from "@/lib/date";
import { formatarMoeda } from "@/lib/formatacao";
import {
  MESES,
  ehVerba,
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

type LinhaVerba = {
  verba: AcaoPlanejamento;
  previsto: number | null;
  gastoAno: number;
  gastoPeriodo: number;
  doAno: boolean;
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
  onNovaVerba,
}: {
  ano: number;
  onMudarAno: (ano: number) => void;
  acoes: AcaoPlanejamento[];
  despesasPorAcao: Map<string, DespesaPlanejamento[]>;
  categoriasPorId: Map<string, CategoriaPlanejamento>;
  onAbrirAcao: (id: string) => void;
  onNovaVerba?: () => void;
}) {
  // "" = ano inteiro; "0".."11" = mês específico
  const [mes, setMes] = useState("");
  const anoInteiro = mes === "";

  const prefixo = anoInteiro ? `${ano}-` : `${ano}-${String(Number(mes) + 1).padStart(2, "0")}-`;
  const noPeriodo = (data: string) => data.startsWith(prefixo);
  const somaDespesas = (id: string, filtro: (data: string) => boolean) =>
    (despesasPorAcao.get(id) ?? []).filter((d) => filtro(d.data)).reduce((s, d) => s + d.valor, 0);

  // Regras das ações (pontuais e com período):
  // - Previsto: atribuído inteiro ao mês da data de início (sem rateio), contado uma vez.
  //   Ações canceladas não entram no previsto.
  // - Realizado: soma das despesas pela data de cada lançamento (inclusive de ações
  //   canceladas, porque o dinheiro foi gasto).
  const linhas: Linha[] = [];
  // Regras das verbas anuais:
  // - Previsto: só entra com "Ano inteiro" selecionado (sem rateio mensal, por decisão da
  //   área: as compras não seguem um ritmo mensal).
  // - Realizado: igual às ações, pela data de cada compra.
  const verbas: LinhaVerba[] = [];

  for (const acao of acoes) {
    if (ehVerba(acao)) {
      const doAno = acao.data_inicio.startsWith(`${ano}-`);
      const gastoPeriodo = somaDespesas(acao.id, noPeriodo);
      if (!doAno && gastoPeriodo === 0) continue;
      verbas.push({
        verba: acao,
        previsto: acao.orcamento_previsto,
        gastoAno: somaDespesas(acao.id, (d) => d.startsWith(`${ano}-`)),
        gastoPeriodo,
        doAno,
      });
      continue;
    }
    const previstoNoPeriodo = acao.status !== "cancelada" && noPeriodo(acao.data_inicio);
    const realizado = somaDespesas(acao.id, noPeriodo);
    if (!previstoNoPeriodo && realizado === 0) continue;
    linhas.push({
      acao,
      previsto: previstoNoPeriodo ? acao.orcamento_previsto : null,
      previstoNoPeriodo,
      realizado,
    });
  }
  linhas.sort((a, b) => a.acao.data_inicio.localeCompare(b.acao.data_inicio));
  verbas.sort((a, b) => a.verba.titulo.localeCompare(b.verba.titulo));

  const previstoVerba = (v: LinhaVerba) => (anoInteiro && v.doAno ? (v.previsto ?? 0) : 0);

  const acoesPrevisto = linhas.reduce((s, l) => s + (l.previsto ?? 0), 0);
  const acoesRealizado = linhas.reduce((s, l) => s + l.realizado, 0);
  const totalPrevisto = acoesPrevisto + verbas.reduce((s, v) => s + previstoVerba(v), 0);
  const totalRealizado = acoesRealizado + verbas.reduce((s, v) => s + v.gastoPeriodo, 0);
  const saldo = totalPrevisto - totalRealizado;
  const semOrcamento = linhas.filter((l) => l.previstoNoPeriodo && l.previsto === null).length;

  const porCategoria = new Map<string, { previsto: number; realizado: number }>();
  const somarCategoria = (catId: string, previsto: number, realizado: number) => {
    const atual = porCategoria.get(catId) ?? { previsto: 0, realizado: 0 };
    atual.previsto += previsto;
    atual.realizado += realizado;
    porCategoria.set(catId, atual);
  };
  for (const l of linhas) somarCategoria(l.acao.categoria_id, l.previsto ?? 0, l.realizado);
  for (const v of verbas) somarCategoria(v.verba.categoria_id, previstoVerba(v), v.gastoPeriodo);
  const categoriasOrdenadas = [...porCategoria.entries()]
    .filter(([, v]) => v.previsto > 0 || v.realizado > 0)
    .sort((a, b) => b[1].previsto + b[1].realizado - (a[1].previsto + a[1].realizado));

  const rotuloPeriodo = anoInteiro ? String(ano) : `${MESES[Number(mes)]} de ${ano}`;

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

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile
          label="Total previsto"
          valor={moeda(totalPrevisto)}
          subtitulo={anoInteiro ? rotuloPeriodo : `${rotuloPeriodo} · sem verbas anuais`}
        />
        <StatTile label="Total realizado" valor={moeda(totalRealizado)} subtitulo={rotuloPeriodo} />
        <StatTile
          label={saldo < 0 ? "Acima do previsto" : "Saldo (previsto − realizado)"}
          valor={moeda(Math.abs(saldo))}
          accent={saldo < 0}
          subtitulo={
            totalPrevisto > 0 ? `${Math.round((totalRealizado / totalPrevisto) * 100)}% do previsto utilizado` : undefined
          }
          explicacao={
            anoInteiro
              ? undefined
              : "Com um mês selecionado, o previsto não inclui as verbas anuais, mas o realizado inclui as compras delas naquele mês."
          }
        />
        <StatTile
          label="Sem orçamento informado"
          valor={String(semOrcamento)}
          subtitulo="Ações sem valor previsto"
          explicacao="Ações do período com o campo Valor previsto em branco. É diferente de R$ 0,00, que significa ação sem custo confirmada."
        />
      </div>

      {/* Por categoria */}
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

      {/* Verbas anuais */}
      <section className="rounded-lg border border-border bg-card p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Verbas anuais · {ano}</h2>
            <p className="text-xs text-muted-foreground">
              Orçamentos do ano sem data de evento (ex.: aniversariantes do mês). Cada compra é lançada como despesa.
            </p>
          </div>
          {onNovaVerba && (
            <Button size="sm" variant="outline" onClick={onNovaVerba}>
              + Nova verba anual
            </Button>
          )}
        </div>
        {verbas.length === 0 ? (
          <p className="py-2 text-sm text-muted-foreground">Nenhuma verba anual cadastrada para {ano}.</p>
        ) : (
          <div className="overflow-x-auto rounded-md border border-border">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 font-medium">Verba</th>
                  <th className="px-3 py-2 font-medium">Categoria</th>
                  <th className="px-3 py-2 text-right font-medium">Previsto no ano</th>
                  {!anoInteiro && <th className="px-3 py-2 text-right font-medium">Gasto em {MESES[Number(mes)].toLowerCase()}</th>}
                  <th className="px-3 py-2 text-right font-medium">Gasto no ano</th>
                  <th className="px-3 py-2 text-right font-medium">Saldo</th>
                  <th className="w-40 px-3 py-2 font-medium">Uso</th>
                </tr>
              </thead>
              <tbody>
                {verbas.map((v) => {
                  const cat = categoriasPorId.get(v.verba.categoria_id);
                  const saldoVerba = v.previsto !== null ? v.previsto - v.gastoAno : null;
                  const pct = v.previsto ? Math.min(100, (v.gastoAno / v.previsto) * 100) : 0;
                  const estourou = saldoVerba !== null && saldoVerba < 0;
                  return (
                    <tr
                      key={v.verba.id}
                      onClick={() => onAbrirAcao(v.verba.id)}
                      className="cursor-pointer border-b border-border last:border-0 hover:bg-muted/30"
                    >
                      <td className="px-3 py-2 font-medium text-foreground">
                        {v.verba.titulo}
                        {!v.doAno && (
                          <span className="ml-2 text-xs font-normal text-muted-foreground">
                            (verba de {v.verba.data_inicio.slice(0, 4)})
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        <span className="flex items-center gap-2">
                          <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ backgroundColor: cat?.cor }} />
                          {cat?.nome}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-right whitespace-nowrap">
                        {v.previsto === null ? <span className="text-muted-foreground">{NAO_INFORMADO}</span> : moeda(v.previsto)}
                      </td>
                      {!anoInteiro && <td className="px-3 py-2 text-right whitespace-nowrap">{moeda(v.gastoPeriodo)}</td>}
                      <td className="px-3 py-2 text-right whitespace-nowrap">{moeda(v.gastoAno)}</td>
                      <td className={`px-3 py-2 text-right whitespace-nowrap ${estourou ? "font-medium text-danger" : ""}`}>
                        {saldoVerba === null ? "—" : moeda(saldoVerba)}
                      </td>
                      <td className="px-3 py-2">
                        {v.previsto ? (
                          <div className="flex items-center gap-2">
                            <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                              <div
                                className="h-full rounded-full"
                                style={{ width: `${pct}%`, backgroundColor: estourou ? "var(--danger)" : cat?.cor }}
                              />
                            </div>
                            <span className="w-10 text-right text-xs text-muted-foreground">
                              {Math.round((v.gastoAno / v.previsto) * 100)}%
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
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
                    Total das ações {verbas.length > 0 && <span className="font-normal text-muted-foreground">(sem as verbas anuais)</span>}
                  </td>
                  <td className="px-3 py-2 text-right whitespace-nowrap">{moeda(acoesPrevisto)}</td>
                  <td className="px-3 py-2 text-right whitespace-nowrap">{moeda(acoesRealizado)}</td>
                  <td className={`px-3 py-2 text-right whitespace-nowrap ${acoesPrevisto - acoesRealizado < 0 ? "text-danger" : ""}`}>
                    {moeda(acoesPrevisto - acoesRealizado)}
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
