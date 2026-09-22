import type { ColaboradorDashboardItem } from "@/lib/data/dashboard";
import type { DesligamentoItem, DesligamentoHistoricoItem } from "@/lib/data/desligamentos";
import { hojeISO, type PeriodoResolvido } from "@/lib/date";
import { agruparDesligamentosPorColaborador, headcountEm } from "@/lib/headcount";

export type TurnoverFiltrosBase = {
  cargoId?: string[];
  nivelId?: string[];
  eixoId?: string[];
  setorId?: string[];
  gestorId?: string[];
};

function aplicaFiltrosBase(c: ColaboradorDashboardItem, f: TurnoverFiltrosBase) {
  if (f.cargoId?.length && !f.cargoId.includes(c.cargo_id ?? "")) return false;
  if (f.nivelId?.length && !f.nivelId.includes(c.nivel_id ?? "")) return false;
  if (f.eixoId?.length && !f.eixoId.includes(c.eixo_id ?? "")) return false;
  if (f.setorId?.length && !f.setorId.includes(c.setor_id ?? "")) return false;
  if (f.gestorId?.length && !f.gestorId.includes(c.gestor_colaborador_id ?? "")) return false;
  return true;
}

function agrupar(itens: { chave: string; id: string }[]) {
  const mapa = new Map<string, string[]>();
  for (const item of itens) {
    if (!mapa.has(item.chave)) mapa.set(item.chave, []);
    mapa.get(item.chave)!.push(item.id);
  }
  return Array.from(mapa.entries()).map(([chave, ids]) => ({ chave, valor: ids.length, ids }));
}

/**
 * Indicadores da tela Desligamentos. Cards, distribuição por setor e tabela contam
 * registros (decisão deliberada: numa empresa pequena com poucos desligamentos, uma taxa
 * sobre headcount distorce fácil). A única exceção é a taxa de turnover ANUAL (gráfico de
 * linha à parte, complementar ao de quantidade) — aí sim o headcount do ano importa, e é
 * reconstruído a partir de admissão + histórico real de desligamento/reativação (ver
 * src/lib/headcount.ts), nunca a partir do headcount atual.
 *
 * `desligamentosNoRecorte`: já filtrado por cargo/nível/eixo/setor/gestor/tipo/motivo (mas
 * não por período) — é o universo de onde tudo aqui é calculado.
 */
export function calcularIndicadoresDesligamentos(
  colaboradoresTodos: ColaboradorDashboardItem[],
  desligamentosHistorico: DesligamentoHistoricoItem[],
  desligamentosNoRecorte: DesligamentoItem[],
  filtrosBase: TurnoverFiltrosBase,
  periodo: PeriodoResolvido,
) {
  const anoAtual = new Date().getFullYear();
  const colaboradores = colaboradoresTodos.filter((c) => aplicaFiltrosBase(c, filtrosBase));
  const desligamentosPorColaborador = agruparDesligamentosPorColaborador(desligamentosHistorico);

  const desligamentosDoPeriodo = desligamentosNoRecorte.filter(
    (d) => d.data >= periodo.inicio && d.data <= periodo.fim,
  );

  const primeiroAno =
    desligamentosNoRecorte.length > 0
      ? Math.min(...desligamentosNoRecorte.map((d) => Number(d.data.slice(0, 4))))
      : anoAtual;

  const ultimoDesligamento =
    desligamentosNoRecorte.length > 0
      ? desligamentosNoRecorte.reduce((maisRecente, d) => (d.data > maisRecente.data ? d : maisRecente))
          .data
      : null;

  const desligamentosAnoAtual = desligamentosNoRecorte.filter((d) =>
    d.data.startsWith(String(anoAtual)),
  );

  // Evolução anual: histórico completo, ignora o filtro de período de propósito (pra
  // permitir comparar anos). Só entram os anos a partir do primeiro desligamento — anos
  // anteriores não têm o que mostrar e não devem aparecer como zero.
  const evolucaoAnual: { ano: string; desligamentos: number; ids: string[] }[] = [];
  const taxaAnual: { ano: string; taxa: number | null; headcountMedio: number }[] = [];
  for (let ano = primeiroAno; ano <= anoAtual; ano++) {
    const doAno = desligamentosNoRecorte.filter((d) => d.data.startsWith(String(ano)));
    evolucaoAnual.push({ ano: String(ano), desligamentos: doAno.length, ids: doAno.map((d) => d.id) });

    const inicioAno = `${ano}-01-01`;
    const fimAno = ano === anoAtual ? hojeISO() : `${ano}-12-31`;
    const hc1 = headcountEm(colaboradores, desligamentosPorColaborador, inicioAno);
    const hc2 = headcountEm(colaboradores, desligamentosPorColaborador, fimAno);
    const headcountMedio = (hc1 + hc2) / 2;
    taxaAnual.push({
      ano: String(ano),
      headcountMedio,
      taxa: headcountMedio > 0 ? Math.round((doAno.length / headcountMedio) * 1000) / 10 : null,
    });
  }

  // Distribuição por setor, dentro do período selecionado — percentual é a fatia do
  // próprio total de desligamentos do período, não uma taxa sobre headcount do setor.
  const porSetorMapa = new Map<string, string[]>();
  for (const d of desligamentosDoPeriodo) {
    const chave = d.setor_nome ?? "Sem setor";
    if (!porSetorMapa.has(chave)) porSetorMapa.set(chave, []);
    porSetorMapa.get(chave)!.push(d.id);
  }
  const totalNoPeriodo = desligamentosDoPeriodo.length;
  const porSetor = Array.from(porSetorMapa.entries())
    .map(([setor, ids]) => ({
      setor,
      desligamentos: ids.length,
      percentualDoPeriodo: totalNoPeriodo > 0 ? Math.round((ids.length / totalNoPeriodo) * 1000) / 10 : 0,
      ids,
    }))
    .sort((a, b) => b.desligamentos - a.desligamentos);

  const porTipo = agrupar(
    desligamentosDoPeriodo.map((d) => ({
      chave: d.tipo === "voluntario" ? "Voluntário" : "Involuntário",
      id: d.id,
    })),
  );
  const porMotivo = agrupar(
    desligamentosDoPeriodo.map((d) => ({ chave: d.motivo_nome ?? "Sem motivo", id: d.id })),
  ).sort((a, b) => b.valor - a.valor);

  return {
    desligamentosNoPeriodo: desligamentosDoPeriodo.length,
    desligamentosNoPeriodoIds: desligamentosDoPeriodo.map((d) => d.id),
    primeiroAno,
    ultimoDesligamento,
    anoAtual,
    desligamentosAnoAtual: desligamentosAnoAtual.length,
    evolucaoAnual,
    taxaAnual,
    porSetor,
    porTipo,
    porMotivo,
  };
}
