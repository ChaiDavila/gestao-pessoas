import { createClient } from "@/lib/supabase/server";

export async function getMotivosDesligamento() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .schema("rh")
    .from("config_motivos_desligamento")
    .select("id, motivo, tipo_padrao")
    .eq("ativo", true)
    .order("motivo");

  if (error) throw new Error(error.message);
  return data ?? [];
}

async function listar(tabela: string, colunas: string, ordem: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .schema("rh")
    .from(tabela)
    .select(colunas)
    .eq("ativo", true)
    .order(ordem);

  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as Record<string, unknown>[];
}

export async function getTodosCatalogos() {
  const [
    setores,
    cargos,
    niveis,
    eixos,
    motivosEvolucao,
    motivosDesligamento,
    formacoes,
    categoriasTreinamento,
    nrsCatalogo,
    tiposExame,
  ] = await Promise.all([
    listar("config_setores", "id, nome", "nome"),
    listar("config_cargos", "id, nome, cbo", "nome"),
    listar("config_niveis", "id, nome, ordem", "ordem"),
    listar("config_eixos", "id, nome", "nome"),
    listar("config_motivos_evolucao_salarial", "id, motivo", "motivo"),
    listar("config_motivos_desligamento", "id, motivo, tipo_padrao", "motivo"),
    listar("config_formacoes", "id, nome, ordem", "ordem"),
    listar("config_categorias_treinamento", "id, nome", "nome"),
    listar("config_nrs_catalogo", "id, nr, nome, periodicidade_meses", "nr"),
    listar("config_tipos_exame", "id, nome, periodicidade_meses", "nome"),
  ]);

  return {
    setores,
    cargos,
    niveis,
    eixos,
    motivosEvolucao,
    motivosDesligamento,
    formacoes,
    categoriasTreinamento,
    nrsCatalogo,
    tiposExame,
  };
}

export type PgrItem = {
  id: string;
  cargo_id: string;
  exame_id: string;
};

export async function getPgrCompleto() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .schema("rh")
    .from("config_exames_por_funcao")
    .select("id, cargo_id, exame_id")
    .eq("ativo", true);

  if (error) throw new Error(error.message);
  return (data ?? []) as PgrItem[];
}
