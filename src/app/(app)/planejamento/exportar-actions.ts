"use server";

import { getUsuarioAtual, podeVerTela } from "@/lib/auth";
import {
  getAcoesPlanejamento,
  getCategoriasPlanejamento,
  getDespesasPlanejamento,
} from "@/lib/data/planejamento";
import { gerarOrcamentoXlsx } from "@/lib/relatorio-orcamento";

// Excel do orçamento do ano inteiro, respeitando o filtro de categoria da tela. Retorna
// base64 (Server Actions não devolvem Buffer ao client), igual ao relatório de colaboradores.
export async function exportarOrcamentoXlsx(
  ano: number,
  categoriaId: string | null,
): Promise<{ error: string } | { ok: true; base64: string }> {
  const usuario = await getUsuarioAtual();
  if (!podeVerTela(usuario, "planejamento")) {
    return { error: "Você não tem acesso ao Planejamento." };
  }
  if (!Number.isInteger(ano) || ano < 2000 || ano > 2100) {
    return { error: "Ano inválido." };
  }

  const [acoes, despesas, categorias] = await Promise.all([
    getAcoesPlanejamento(),
    getDespesasPlanejamento(),
    getCategoriasPlanejamento(),
  ]);
  const acoesFiltradas = categoriaId ? acoes.filter((a) => a.categoria_id === categoriaId) : acoes;

  const base64 = await gerarOrcamentoXlsx({
    ano,
    filtroCategoria: categoriaId ? (categorias.find((c) => c.id === categoriaId)?.nome ?? null) : null,
    acoes: acoesFiltradas,
    despesas,
    categorias,
  });
  return { ok: true, base64 };
}
