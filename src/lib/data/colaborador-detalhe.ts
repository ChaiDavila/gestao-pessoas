import { createClient } from "@/lib/supabase/server";

export type FormacaoRow = {
  id: string;
  curso: string | null;
  instituicao: string | null;
  ano_conclusao: number | null;
  status: string;
  criado_em: string;
  nivel_id: string;
  config_formacoes: { nome: string } | null;
};

export type HistoricoRow = {
  id: string;
  data: string;
  cargo_anterior: string | null;
  cargo_novo: string | null;
  salario_anterior: number | null;
  salario_novo: number | null;
  motivo_id: string | null;
  config_motivos_evolucao_salarial: { motivo: string } | null;
};

export type ExameComplementarRow = {
  id: string;
  exame_id: string;
  data: string;
  data_vencimento: string | null;
  config_tipos_exame: { nome: string } | null;
};

export async function getDependentes(colaboradorId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .schema("rh")
    .from("dependentes")
    .select("id, nome, parentesco, data_nascimento, sexo")
    .eq("colaborador_id", colaboradorId)
    .eq("ativo", true)
    .order("data_nascimento", { ascending: true });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getFormacoes(colaboradorId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .schema("rh")
    .from("formacoes")
    .select(
      "id, curso, instituicao, ano_conclusao, status, criado_em, nivel_id, config_formacoes(nome)",
    )
    .eq("colaborador_id", colaboradorId)
    .eq("ativo", true)
    .order("criado_em", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as FormacaoRow[];
}

export async function getHistoricoSalarial(colaboradorId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .schema("rh")
    .from("historico_cargo_salarial")
    .select(
      "id, data, cargo_anterior, cargo_novo, salario_anterior, salario_novo, motivo_id, config_motivos_evolucao_salarial(motivo)",
    )
    .eq("colaborador_id", colaboradorId)
    .eq("ativo", true)
    .order("data", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as HistoricoRow[];
}

export async function getAsoRegistros(colaboradorId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .schema("rh")
    .from("aso_registros")
    .select("id, tipo_exame, data, resultado, data_vencimento")
    .eq("colaborador_id", colaboradorId)
    .eq("ativo", true)
    .order("data", { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getExamesComplementares(colaboradorId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .schema("rh")
    .from("exames_complementares_registros")
    .select("id, exame_id, data, data_vencimento, config_tipos_exame(nome)")
    .eq("colaborador_id", colaboradorId)
    .eq("ativo", true)
    .order("data", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as ExameComplementarRow[];
}

export async function getConfigFormacoes() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .schema("rh")
    .from("config_formacoes")
    .select("id, nome")
    .eq("ativo", true)
    .order("ordem");

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getConfigTiposExame() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .schema("rh")
    .from("config_tipos_exame")
    .select("id, nome, periodicidade_meses")
    .eq("ativo", true)
    .order("nome");

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getMotivosEvolucaoSalarial() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .schema("rh")
    .from("config_motivos_evolucao_salarial")
    .select("id, motivo")
    .eq("ativo", true)
    .order("motivo");

  if (error) throw new Error(error.message);
  return data ?? [];
}
