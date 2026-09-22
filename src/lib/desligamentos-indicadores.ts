import type { DesligamentoItem } from "@/lib/data/desligamentos";
import type { PeriodoResolvido } from "@/lib/date";

function agrupar(itens: { chave: string; id: string }[]) {
  const mapa = new Map<string, string[]>();
  for (const item of itens) {
    if (!mapa.has(item.chave)) mapa.set(item.chave, []);
    mapa.get(item.chave)!.push(item.id);
  }
  return Array.from(mapa.entries()).map(([chave, ids]) => ({ chave, valor: ids.length, ids }));
}

/**
 * Indicadores da tela Desligamentos. Todos contam registros — nenhum usa headcount nem
 * taxa relativa ao tamanho do quadro (decisão deliberada: numa empresa pequena com poucos
 * desligamentos, uma taxa sobre headcount some ou distorce fácil; a quantidade é a
 * informação principal em todos os cards e gráficos).
 *
 * `desligamentosNoRecorte`: já filtrado por cargo/nível/eixo/setor/gestor/tipo/motivo (mas
 * não por período) — é o universo de onde tudo aqui é calculado.
 */
export function calcularIndicadoresDesligamentos(
  desligamentosNoRecorte: DesligamentoItem[],
  periodo: PeriodoResolvido,
) {
  const anoAtual = new Date().getFullYear();

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
  for (let ano = primeiroAno; ano <= anoAtual; ano++) {
    const doAno = desligamentosNoRecorte.filter((d) => d.data.startsWith(String(ano)));
    evolucaoAnual.push({ ano: String(ano), desligamentos: doAno.length, ids: doAno.map((d) => d.id) });
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
    porSetor,
    porTipo,
    porMotivo,
  };
}
