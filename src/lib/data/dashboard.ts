import { createClient } from "@/lib/supabase/server";

export type ColaboradorDashboardItem = {
  id: string;
  nome: string;
  cargo_id: string | null;
  cargo_nome: string | null;
  setor_id: string | null;
  setor_nome: string | null;
  nivel_id: string | null;
  eixo_id: string | null;
  gestor_colaborador_id: string | null;
  status_rh: string;
  sexo: string | null;
  data_nascimento: string | null;
  data_admissao: string;
  salario_atual: number | null;
};

export type DesligamentoDashboardItem = {
  id: string;
  colaborador_id: string;
  colaborador_nome: string;
  data: string;
  tipo: string;
  motivo_nome: string | null;
};

export type FormacaoAtualItem = {
  colaborador_id: string;
  nivel_nome: string;
  ordem: number;
};

export async function getColaboradoresDashboard() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .schema("rh")
    .from("vw_colaboradores")
    .select(
      "id, nome, cargo_id, cargo_nome, setor_id, setor_nome, nivel_id, eixo_id, gestor_colaborador_id, status_rh, sexo, data_nascimento, data_admissao, salario_atual",
    );

  if (error) throw new Error(error.message);
  return (data ?? []) as ColaboradorDashboardItem[];
}

export async function getDesligamentosDashboard() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .schema("rh")
    .from("vw_desligamentos")
    .select("id, colaborador_id, colaborador_nome, data, tipo, motivo_nome")
    .eq("ativo", true);

  if (error) throw new Error(error.message);
  return (data ?? []) as DesligamentoDashboardItem[];
}

export async function getFormacaoAtualTodos() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .schema("rh")
    .from("vw_formacao_atual")
    .select("colaborador_id, nivel_nome, ordem");

  if (error) throw new Error(error.message);
  return (data ?? []) as FormacaoAtualItem[];
}
