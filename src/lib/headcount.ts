// Reconstrói headcount em datas passadas a partir de admissão + histórico real de
// desligamento/reativação — nunca a partir do status_rh atual (que só reflete o presente)
// nem do headcount de hoje projetado pra trás.

export type ColaboradorParaHeadcount = {
  id: string;
  data_admissao: string;
};

export type DesligamentoParaHeadcount = {
  colaborador_id: string;
  data: string;
  data_reativacao: string | null;
};

export function agruparDesligamentosPorColaborador(
  desligamentos: DesligamentoParaHeadcount[],
): Map<string, DesligamentoParaHeadcount[]> {
  const mapa = new Map<string, DesligamentoParaHeadcount[]>();
  for (const d of desligamentos) {
    if (!mapa.has(d.colaborador_id)) mapa.set(d.colaborador_id, []);
    mapa.get(d.colaborador_id)!.push(d);
  }
  return mapa;
}

/**
 * Estava ativo em `dataRef`? Olha o desligamento mais recente com data <= dataRef: se não
 * existe nenhum, a pessoa nunca tinha sido desligada até ali (ativa). Se existe e já foi
 * reativado até dataRef, ativa de novo. Cobre também múltiplos ciclos de desligamento e
 * recontratação, mesmo que hoje não exista nenhum caso assim nos dados.
 */
export function estavaAtivoEm(
  colaborador: ColaboradorParaHeadcount,
  desligamentosDoColaborador: DesligamentoParaHeadcount[],
  dataRef: string,
): boolean {
  if (colaborador.data_admissao > dataRef) return false;

  const relevantes = desligamentosDoColaborador
    .filter((d) => d.data <= dataRef)
    .sort((a, b) => b.data.localeCompare(a.data));

  if (relevantes.length === 0) return true;

  const ultimo = relevantes[0];
  return Boolean(ultimo.data_reativacao && ultimo.data_reativacao <= dataRef);
}

export function headcountEm<C extends ColaboradorParaHeadcount>(
  colaboradores: C[],
  desligamentosPorColaborador: Map<string, DesligamentoParaHeadcount[]>,
  dataRef: string,
): number {
  let total = 0;
  for (const c of colaboradores) {
    if (estavaAtivoEm(c, desligamentosPorColaborador.get(c.id) ?? [], dataRef)) total++;
  }
  return total;
}

/** Headcount médio = (headcount no início + headcount no fim) ÷ 2 — fórmula padrão de RH. */
export function headcountMedioNoPeriodo<C extends ColaboradorParaHeadcount>(
  colaboradores: C[],
  desligamentosPorColaborador: Map<string, DesligamentoParaHeadcount[]>,
  inicio: string,
  fim: string,
): number {
  const h1 = headcountEm(colaboradores, desligamentosPorColaborador, inicio);
  const h2 = headcountEm(colaboradores, desligamentosPorColaborador, fim);
  return (h1 + h2) / 2;
}
