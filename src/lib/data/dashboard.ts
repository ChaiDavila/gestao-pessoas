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
  salario_admissional: number | null;
  tipo_contrato: string;
};

export type HistoricoSalarialDashboardItem = {
  colaborador_id: string;
  data: string;
  salario_novo: number | null;
};

export type DesligamentoDashboardItem = {
  id: string;
  colaborador_id: string;
  colaborador_nome: string;
  data: string;
  tipo: string;
  motivo_nome: string | null;
  data_reativacao: string | null;
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
      "id, nome, cargo_id, cargo_nome, setor_id, setor_nome, nivel_id, eixo_id, gestor_colaborador_id, status_rh, sexo, data_nascimento, data_admissao, salario_atual, salario_admissional, tipo_contrato",
    );

  if (error) throw new Error(error.message);
  return (data ?? []) as ColaboradorDashboardItem[];
}

// Base para reconstruir o salário VIGENTE de cada colaborador em datas passadas (ver
// `salarioVigenteEm` em dashboard-indicadores.ts) — sem filtro nenhum, igual aos
// desligamentos: o filtro é aplicado depois, na hora de decidir quem conta em cada data.
export async function getHistoricoSalarialDashboard() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .schema("rh")
    .from("vw_historico_cargo_salarial")
    .select("colaborador_id, data, salario_novo");

  if (error) throw new Error(error.message);
  return (data ?? []) as HistoricoSalarialDashboardItem[];
}

export async function getDesligamentosDashboard() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .schema("rh")
    .from("vw_desligamentos")
    .select("id, colaborador_id, colaborador_nome, data, tipo, motivo_nome, data_reativacao")
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
