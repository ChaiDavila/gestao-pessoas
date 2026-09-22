import { createClient } from "@/lib/supabase/server";

export type DesligamentoItem = {
  id: string;
  colaborador_id: string;
  colaborador_nome: string;
  cargo_id: string | null;
  cargo_nome: string | null;
  nivel_id: string | null;
  eixo_id: string | null;
  setor_id: string | null;
  setor_nome: string | null;
  gestor_colaborador_id: string | null;
  status_rh: string;
  data: string;
  tipo: string;
  motivo_id: string | null;
  motivo_nome: string | null;
  descricao: string | null;
  data_reativacao: string | null;
};

export type DesligamentosFiltros = {
  cargoId?: string[];
  nivelId?: string[];
  eixoId?: string[];
  setorId?: string[];
  gestorId?: string[];
  status?: string;
  tipo?: string;
  motivoId?: string[];
};

export async function getDesligamentos(filtros: DesligamentosFiltros = {}) {
  const supabase = await createClient();
  let query = supabase
    .schema("rh")
    .from("vw_desligamentos")
    .select(
      "id, colaborador_id, colaborador_nome, cargo_id, cargo_nome, nivel_id, eixo_id, setor_id, setor_nome, gestor_colaborador_id, status_rh, data, tipo, motivo_id, motivo_nome, descricao, data_reativacao",
    )
    .eq("ativo", true)
    .order("data", { ascending: false });

  if (filtros.cargoId?.length) query = query.in("cargo_id", filtros.cargoId);
  if (filtros.nivelId?.length) query = query.in("nivel_id", filtros.nivelId);
  if (filtros.eixoId?.length) query = query.in("eixo_id", filtros.eixoId);
  if (filtros.setorId?.length) query = query.in("setor_id", filtros.setorId);
  if (filtros.gestorId?.length) query = query.in("gestor_colaborador_id", filtros.gestorId);
  if (filtros.status) query = query.eq("status_rh", filtros.status);
  if (filtros.tipo) query = query.eq("tipo", filtros.tipo);
  if (filtros.motivoId?.length) query = query.in("motivo_id", filtros.motivoId);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []) as DesligamentoItem[];
}

export type DesligamentoHistoricoItem = {
  colaborador_id: string;
  data: string;
  data_reativacao: string | null;
};

// Histórico bruto de TODOS os desligamentos, sem nenhum filtro de tela — usado só pra
// reconstruir quem estava ativo em datas passadas (headcount histórico, pra taxa de
// turnover anual). Não confundir com getDesligamentos(), que respeita os filtros da tela.
export async function getTodosDesligamentosHistorico() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .schema("rh")
    .from("desligamentos")
    .select("colaborador_id, data, data_reativacao")
    .eq("ativo", true);

  if (error) throw new Error(error.message);
  return (data ?? []) as DesligamentoHistoricoItem[];
}
