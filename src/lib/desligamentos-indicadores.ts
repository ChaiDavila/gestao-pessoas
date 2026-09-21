import type { ColaboradorDashboardItem } from "@/lib/data/dashboard";
import type { DesligamentoItem } from "@/lib/data/desligamentos";

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

/**
 * Turnover histórico completo (todos os anos, sem filtro de período), para a tela de
 * Desligamentos. Os filtros de cargo/nível/eixo/setor/gestor recortam quem entra na conta
 * do headcount; `desligamentosFiltrados` já vem filtrado (inclusive por tipo/motivo) de
 * `getDesligamentos`.
 *
 * "Taxa de turnover geral" = total de desligamentos no recorte ÷ headcount médio do
 * período todo (média do headcount de cada ano) — não é a média das taxas anuais, que
 * distorceria o resultado numa empresa que cresceu de poucas pessoas pra dezenas.
 */
export function calcularTurnoverGeral(
  colaboradoresTodos: ColaboradorDashboardItem[],
  desligamentosFiltrados: DesligamentoItem[],
  filtrosBase: TurnoverFiltrosBase,
) {
  const colaboradores = colaboradoresTodos.filter((c) => aplicaFiltrosBase(c, filtrosBase));

  const anosComDados = new Set<string>();
  for (const c of colaboradores) anosComDados.add(c.data_admissao.slice(0, 4));
  for (const d of desligamentosFiltrados) anosComDados.add(d.data.slice(0, 4));
  const anosOrdenados = Array.from(anosComDados).sort();

  const headcountPorAno = anosOrdenados.map(
    (ano) => colaboradores.filter((c) => c.data_admissao <= `${ano}-12-31`).length,
  );

  const turnoverPorAno = anosOrdenados.map((ano, i) => {
    const desligadosNoAno = desligamentosFiltrados.filter((d) => d.data.startsWith(ano)).length;
    const headcount = headcountPorAno[i];
    return headcount > 0 ? Math.round((desligadosNoAno / headcount) * 1000) / 10 : 0;
  });

  const headcountMedio =
    headcountPorAno.length > 0
      ? headcountPorAno.reduce((s, v) => s + v, 0) / headcountPorAno.length
      : 0;
  const taxaGeral =
    headcountMedio > 0 ? (desligamentosFiltrados.length / headcountMedio) * 100 : 0;

  return {
    anosOrdenados,
    turnoverPorAno,
    headcountMedio,
    taxaGeral,
    totalDesligamentos: desligamentosFiltrados.length,
  };
}
