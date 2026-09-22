import type { ColaboradorDashboardItem } from "@/lib/data/dashboard";
import type { DesligamentoItem, DesligamentoHistoricoItem } from "@/lib/data/desligamentos";
import { hojeISO, type PeriodoResolvido } from "@/lib/date";
import {
  agruparDesligamentosPorColaborador,
  headcountEm,
} from "@/lib/headcount";

export type TurnoverFiltrosBase = {
  cargoId?: string;
  nivelId?: string;
  eixoId?: string;
  setorId?: string;
  gestorId?: string;
};

function aplicaFiltrosBase(c: ColaboradorDashboardItem, f: TurnoverFiltrosBase) {
  if (f.cargoId && c.cargo_id !== f.cargoId) return false;
  if (f.nivelId && c.nivel_id !== f.nivelId) return false;
  if (f.eixoId && c.eixo_id !== f.eixoId) return false;
  if (f.setorId && c.setor_id !== f.setorId) return false;
  if (f.gestorId && c.gestor_colaborador_id !== f.gestorId) return false;
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
 * Indicadores da tela Desligamentos, todos calculados com headcount reconstruído a partir
 * de admissão + histórico real de desligamento/reativação (ver src/lib/headcount.ts) — não
 * a partir do headcount atual nem do status_rh de hoje.
 *
 * - `desligamentosHistorico`: TODOS os desligamentos, sem filtro nenhum — só pra saber quem
 *   estava ativo em cada data (o histórico de uma pessoa não muda por causa de um filtro).
 * - `desligamentosNoRecorte`: já filtrado por cargo/nível/eixo/setor/gestor/tipo/motivo
 *   (mas não por período) — é o que entra no numerador de cada indicador.
 */
export function calcularIndicadoresDesligamentos(
  colaboradoresTodos: ColaboradorDashboardItem[],
  desligamentosHistorico: DesligamentoHistoricoItem[],
  desligamentosNoRecorte: DesligamentoItem[],
  filtrosBase: TurnoverFiltrosBase,
  periodo: PeriodoResolvido,
) {
  const colaboradores = colaboradoresTodos.filter((c) => aplicaFiltrosBase(c, filtrosBase));
  const desligamentosPorColaborador = agruparDesligamentosPorColaborador(desligamentosHistorico);
  const hoje = hojeISO();
  const anoAtual = Number(hoje.slice(0, 4));

  // --- indicadores do período selecionado ---
  const desligamentosDoPeriodo = desligamentosNoRecorte.filter(
    (d) => d.data >= periodo.inicio && d.data <= periodo.fim,
  );
  const headcountInicioPeriodo = headcountEm(colaboradores, desligamentosPorColaborador, periodo.inicio);
  const headcountFimPeriodo = headcountEm(colaboradores, desligamentosPorColaborador, periodo.fim);
  const headcountMedioPeriodo = (headcountInicioPeriodo + headcountFimPeriodo) / 2;
  const taxaPeriodo =
    headcountMedioPeriodo > 0
      ? Math.round((desligamentosDoPeriodo.length / headcountMedioPeriodo) * 1000) / 10
      : null;

  // --- evolução anual: histórico completo, ignora o filtro de período de propósito, pra
  // permitir comparar anos. Anos sem ninguém no recorte (headcount médio = 0) não entram —
  // "sem dados" é diferente de "0%".
  const anos = new Set<string>();
  for (const c of colaboradores) anos.add(c.data_admissao.slice(0, 4));
  for (const d of desligamentosNoRecorte) anos.add(d.data.slice(0, 4));

  const evolucaoAnual = Array.from(anos)
    .sort()
    .map((ano) => {
      const inicioAno = `${ano}-01-01`;
      const fimAno = Number(ano) === anoAtual ? hoje : `${ano}-12-31`;
      const hc1 = headcountEm(colaboradores, desligamentosPorColaborador, inicioAno);
      const hc2 = headcountEm(colaboradores, desligamentosPorColaborador, fimAno);
      const headcountMedio = (hc1 + hc2) / 2;
      const desligamentosDoAno = desligamentosNoRecorte.filter((d) => d.data.startsWith(ano));
      return {
        ano,
        desligamentos: desligamentosDoAno.length,
        headcountMedio,
        taxa:
          headcountMedio > 0
            ? Math.round((desligamentosDoAno.length / headcountMedio) * 1000) / 10
            : null,
        ids: desligamentosDoAno.map((d) => d.id),
      };
    })
    .filter((a) => a.headcountMedio > 0);

  // --- desligamentos por setor, dentro do período selecionado ---
  const colaboradoresPorSetor = new Map<string, ColaboradorDashboardItem[]>();
  for (const c of colaboradores) {
    const chave = c.setor_nome ?? "Sem setor";
    if (!colaboradoresPorSetor.has(chave)) colaboradoresPorSetor.set(chave, []);
    colaboradoresPorSetor.get(chave)!.push(c);
  }

  const porSetor = Array.from(colaboradoresPorSetor.entries())
    .map(([setor, colaboradoresDoSetor]) => {
      const hc1 = headcountEm(colaboradoresDoSetor, desligamentosPorColaborador, periodo.inicio);
      const hc2 = headcountEm(colaboradoresDoSetor, desligamentosPorColaborador, periodo.fim);
      const headcountMedio = (hc1 + hc2) / 2;
      const desligamentosDoSetor = desligamentosDoPeriodo.filter(
        (d) => (d.setor_nome ?? "Sem setor") === setor,
      );
      return {
        setor,
        desligamentos: desligamentosDoSetor.length,
        headcountMedio,
        taxa:
          headcountMedio > 0
            ? Math.round((desligamentosDoSetor.length / headcountMedio) * 1000) / 10
            : null,
        ids: desligamentosDoSetor.map((d) => d.id),
      };
    })
    .filter((s) => s.desligamentos > 0)
    .sort((a, b) => b.desligamentos - a.desligamentos);

  // --- tipo e motivo, dentro do período (mudaram de tela: vieram do Dashboard) ---
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
    headcountInicioPeriodo,
    headcountFimPeriodo,
    headcountMedioPeriodo,
    taxaPeriodo,
    evolucaoAnual,
    porSetor,
    porTipo,
    porMotivo,
  };
}
