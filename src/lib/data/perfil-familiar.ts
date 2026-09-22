import { createClient } from "@/lib/supabase/server";

export type ColaboradorFamiliarItem = {
  id: string;
  nome: string;
  cargo_id: string | null;
  cargo_nome: string | null;
  nivel_id: string | null;
  eixo_id: string | null;
  setor_id: string | null;
  setor_nome: string | null;
  gestor_colaborador_id: string | null;
  status_rh: string;
  estado_civil: string;
  conjuge_nome: string | null;
  conjuge_sexo: string | null;
};

export type DependenteFamiliarItem = {
  id: string;
  colaborador_id: string;
  colaborador_nome: string;
  setor_id: string | null;
  setor_nome: string | null;
  gestor_colaborador_id: string | null;
  status_rh: string;
  nome: string;
  parentesco: string;
  data_nascimento: string | null;
  sexo: string | null;
};

export type PerfilFamiliarFiltros = {
  busca?: string;
  cargoId?: string[];
  nivelId?: string[];
  eixoId?: string[];
  setorId?: string[];
  gestorId?: string[];
  status?: string;
  estadoCivil?: string[];
  somenteComFilhos?: boolean;
};

export async function getColaboradoresFamiliar(filtros: PerfilFamiliarFiltros) {
  const supabase = await createClient();
  let query = supabase
    .schema("rh")
    .from("vw_colaboradores")
    .select(
      "id, nome, cargo_id, cargo_nome, nivel_id, eixo_id, setor_id, setor_nome, gestor_colaborador_id, status_rh, estado_civil, conjuge_nome, conjuge_sexo",
    )
    .order("nome");

  if (filtros.busca) query = query.ilike("nome", `%${filtros.busca}%`);
  if (filtros.cargoId?.length) query = query.in("cargo_id", filtros.cargoId);
  if (filtros.nivelId?.length) query = query.in("nivel_id", filtros.nivelId);
  if (filtros.eixoId?.length) query = query.in("eixo_id", filtros.eixoId);
  if (filtros.setorId?.length) query = query.in("setor_id", filtros.setorId);
  if (filtros.gestorId?.length) query = query.in("gestor_colaborador_id", filtros.gestorId);
  if (filtros.status) query = query.eq("status_rh", filtros.status);
  if (filtros.estadoCivil?.length) query = query.in("estado_civil", filtros.estadoCivil);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []) as ColaboradorFamiliarItem[];
}

export async function getDependentesFamiliar() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .schema("rh")
    .from("vw_dependentes")
    .select("*")
    .order("colaborador_nome");

  if (error) throw new Error(error.message);
  return (data ?? []) as DependenteFamiliarItem[];
}
