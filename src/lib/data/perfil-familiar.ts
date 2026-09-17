import { createClient } from "@/lib/supabase/server";

export type ColaboradorFamiliarItem = {
  id: string;
  nome: string;
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
  setorId?: string;
  gestorId?: string;
  status?: string;
  estadoCivil?: string;
  somenteComFilhos?: boolean;
};

export async function getColaboradoresFamiliar(filtros: PerfilFamiliarFiltros) {
  const supabase = await createClient();
  let query = supabase
    .schema("rh")
    .from("vw_colaboradores")
    .select(
      "id, nome, setor_id, setor_nome, gestor_colaborador_id, status_rh, estado_civil, conjuge_nome, conjuge_sexo",
    )
    .order("nome");

  if (filtros.setorId) query = query.eq("setor_id", filtros.setorId);
  if (filtros.gestorId) query = query.eq("gestor_colaborador_id", filtros.gestorId);
  if (filtros.status) query = query.eq("status_rh", filtros.status);
  if (filtros.estadoCivil) query = query.eq("estado_civil", filtros.estadoCivil);

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
