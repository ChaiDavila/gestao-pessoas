"use server";

import { getColaboradoresRelatorio, type ColaboradoresFiltros } from "@/lib/data/colaboradores";
import { gerarCsv } from "@/lib/relatorio-colaboradores";

export async function gerarRelatorioCsv(
  filtros: ColaboradoresFiltros,
  camposSelecionados: string[],
) {
  const linhas = await getColaboradoresRelatorio(filtros);
  return gerarCsv(linhas, camposSelecionados);
}
