"use server";

import { getColaboradoresRelatorio, type ColaboradoresFiltros } from "@/lib/data/colaboradores";
import { gerarXlsx } from "@/lib/relatorio-colaboradores";

// Retorna o .xlsx como base64 — Server Actions não podem devolver Buffer diretamente pro
// client, então o dialog decodifica e monta o Blob do lado do navegador.
export async function gerarRelatorioXlsx(
  filtros: ColaboradoresFiltros,
  camposSelecionados: string[],
) {
  const linhas = await getColaboradoresRelatorio(filtros);
  return gerarXlsx(linhas, camposSelecionados);
}
