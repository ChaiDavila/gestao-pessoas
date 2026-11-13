import { createClient } from "@/lib/supabase/server";
import type {
  AcaoPlanejamento,
  CategoriaPlanejamento,
  DespesaPlanejamento,
  TarefaPlanejamento,
} from "@/lib/planejamento";

export async function getCategoriasPlanejamento(): Promise<CategoriaPlanejamento[]> {
  const supabase = await createClient();
  // Inclui categorias removidas (ativo=false) pra ações antigas continuarem com nome e cor;
  // o formulário só oferece as ativas.
  const { data, error } = await supabase
    .schema("rh")
    .from("config_categorias_planejamento")
    .select("id, nome, cor, ativo")
    .order("nome");
  if (error) throw new Error(error.message);
  return (data ?? []) as CategoriaPlanejamento[];
}

export async function getAcoesPlanejamento(): Promise<AcaoPlanejamento[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .schema("rh")
    .from("planejamento_acoes")
    .select(
      "id, titulo, descricao, categoria_id, tipo, data_inicio, data_fim, status, data_conclusao, orcamento_previsto, observacoes",
    )
    .eq("ativo", true)
    .order("data_inicio");
  if (error) throw new Error(error.message);
  return (data ?? []).map((a) => ({
    ...a,
    orcamento_previsto: a.orcamento_previsto == null ? null : Number(a.orcamento_previsto),
  })) as AcaoPlanejamento[];
}

export async function getTarefasPlanejamento(): Promise<TarefaPlanejamento[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .schema("rh")
    .from("planejamento_tarefas")
    .select("id, acao_id, descricao, prazo, concluida, concluida_em, ordem")
    .eq("ativo", true)
    .order("ordem");
  if (error) throw new Error(error.message);
  return (data ?? []) as TarefaPlanejamento[];
}

export async function getDespesasPlanejamento(): Promise<DespesaPlanejamento[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .schema("rh")
    .from("planejamento_despesas")
    .select("id, acao_id, data, descricao, valor")
    .eq("ativo", true)
    .order("data");
  if (error) throw new Error(error.message);
  return (data ?? []).map((d) => ({ ...d, valor: Number(d.valor) })) as DespesaPlanejamento[];
}
