import { createClient } from "@/lib/supabase/server";

export type ColaboradorListItem = {
  id: string;
  nome: string;
  matricula: string;
  cargo_nome: string | null;
  setor_id: string | null;
  setor_nome: string | null;
  nivel_id: string | null;
  nivel_nome: string | null;
  eixo_id: string | null;
  eixo_nome: string | null;
  gestor_colaborador_id: string | null;
  gestor_nome: string | null;
  status_rh: string;
  data_admissao: string;
};

export type ColaboradoresFiltros = {
  busca?: string;
  cargoId?: string;
  nivelId?: string;
  eixoId?: string;
  setorId?: string;
  gestorId?: string;
  status?: string;
};

export async function getColaboradores(filtros: ColaboradoresFiltros) {
  const supabase = await createClient();

  let query = supabase
    .schema("rh")
    .from("vw_colaboradores")
    .select(
      "id, nome, matricula, cargo_nome, setor_id, setor_nome, nivel_id, nivel_nome, eixo_id, eixo_nome, gestor_colaborador_id, gestor_nome, status_rh, data_admissao",
    )
    .order("nome", { ascending: true });

  if (filtros.busca) {
    query = query.or(
      `nome.ilike.%${filtros.busca}%,matricula.ilike.%${filtros.busca}%`,
    );
  }
  if (filtros.cargoId) query = query.eq("cargo_id", filtros.cargoId);
  if (filtros.nivelId) query = query.eq("nivel_id", filtros.nivelId);
  if (filtros.eixoId) query = query.eq("eixo_id", filtros.eixoId);
  if (filtros.setorId) query = query.eq("setor_id", filtros.setorId);
  if (filtros.gestorId) query = query.eq("gestor_colaborador_id", filtros.gestorId);
  if (filtros.status) query = query.eq("status_rh", filtros.status);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []) as ColaboradorListItem[];
}

export async function getColaboradorPorId(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .schema("rh")
    .from("vw_colaboradores")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}

export type OpcoesFormulario = {
  cargos: { id: string; nome: string; cbo: string | null }[];
  setores: { id: string; nome: string }[];
  niveis: { id: string; nome: string }[];
  eixos: { id: string; nome: string }[];
  gestores: { id: string; nome: string }[];
};

export async function getOpcoesFormulario(
  excluirColaboradorId?: string,
): Promise<OpcoesFormulario> {
  const supabase = await createClient();

  const [cargos, setores, niveis, eixos, gestores] = await Promise.all([
    supabase.schema("rh").from("config_cargos").select("id, nome, cbo").eq("ativo", true).order("nome"),
    supabase.schema("rh").from("config_setores").select("id, nome").eq("ativo", true).order("nome"),
    supabase.schema("rh").from("config_niveis").select("id, nome").eq("ativo", true).order("ordem"),
    supabase.schema("rh").from("config_eixos").select("id, nome").eq("ativo", true).order("nome"),
    supabase
      .schema("rh")
      .from("vw_colaboradores")
      .select("id, nome")
      .eq("status_rh", "ativo")
      .order("nome"),
  ]);

  for (const r of [cargos, setores, niveis, eixos, gestores]) {
    if (r.error) throw new Error(r.error.message);
  }

  return {
    cargos: cargos.data ?? [],
    setores: setores.data ?? [],
    niveis: niveis.data ?? [],
    eixos: eixos.data ?? [],
    gestores: (gestores.data ?? []).filter((g) => g.id !== excluirColaboradorId),
  };
}
