import { createClient } from "@/lib/supabase/server";

export type EvolucaoSalarialItem = {
  id: string;
  colaborador_id: string;
  colaborador_nome: string;
  data: string;
  cargo_anterior: string | null;
  cargo_novo: string | null;
  salario_anterior: number | null;
  salario_novo: number | null;
  motivo_nome: string | null;
};

export type EvolucaoSalarialFiltros = {
  busca?: string;
  colaboradorId?: string[];
  cargoId?: string[];
  nivelId?: string[];
  eixoId?: string[];
  setorId?: string[];
  gestorId?: string[];
  status?: string;
  de?: string;
  ate?: string;
};

export async function getEvolucaoSalarial(filtros: EvolucaoSalarialFiltros) {
  const supabase = await createClient();

  let query = supabase
    .schema("rh")
    .from("vw_historico_cargo_salarial")
    .select(
      "id, colaborador_id, colaborador_nome, data, cargo_anterior, cargo_novo, salario_anterior, salario_novo, motivo_nome",
    )
    .order("data", { ascending: false });

  if (filtros.busca) query = query.ilike("colaborador_nome", `%${filtros.busca}%`);
  if (filtros.colaboradorId?.length) query = query.in("colaborador_id", filtros.colaboradorId);
  if (filtros.cargoId?.length) query = query.in("cargo_id", filtros.cargoId);
  if (filtros.nivelId?.length) query = query.in("nivel_id", filtros.nivelId);
  if (filtros.eixoId?.length) query = query.in("eixo_id", filtros.eixoId);
  if (filtros.setorId?.length) query = query.in("setor_id", filtros.setorId);
  if (filtros.gestorId?.length) query = query.in("gestor_colaborador_id", filtros.gestorId);
  if (filtros.status) query = query.eq("status_rh", filtros.status);
  if (filtros.de) query = query.gte("data", filtros.de);
  if (filtros.ate) query = query.lte("data", filtros.ate);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []) as EvolucaoSalarialItem[];
}
