import { createClient } from "@/lib/supabase/server";

export type TreinamentoItem = {
  id: string;
  nome: string;
  tipo: "NR" | "geral";
  nr_numero: string | null;
  nr_nome: string | null;
  categoria_id: string | null;
  categoria_nome: string | null;
  data: string;
  carga_horaria: number;
  instrutor: string | null;
  custo_total: number | null;
  data_vencimento: string | null;
  total_participantes: number;
};

export type ParticipacaoItem = {
  participante_id: string;
  treinamento_id: string;
  colaborador_id: string;
  colaborador_nome: string;
  setor_id: string | null;
  setor_nome: string | null;
  status_rh: string;
  treinamento_nome: string;
  tipo: "NR" | "geral";
  nr_numero: string | null;
  nr_nome: string | null;
  categoria_id: string | null;
  categoria_nome: string | null;
  data: string;
  carga_horaria: number;
  custo_total: number | null;
  instrutor: string | null;
  data_vencimento: string | null;
};

export type NrColaboradorItem = {
  colaborador_id: string;
  colaborador_nome: string;
  setor_id: string | null;
  setor_nome: string | null;
  status_rh: string;
  nr_numero: string;
  nr: string;
  nr_nome: string;
  periodicidade_meses: number | null;
  treinamento_id: string;
  data: string;
  data_vencimento: string | null;
  carga_horaria: number;
  custo_total: number | null;
  instrutor: string | null;
};

export async function getTreinamentos() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .schema("rh")
    .from("vw_treinamentos")
    .select("*")
    .order("data", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as TreinamentoItem[];
}

export async function getParticipacoes() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .schema("rh")
    .from("vw_treinamento_participantes")
    .select("*")
    .order("data", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as ParticipacaoItem[];
}

export async function getNrPorColaborador() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .schema("rh")
    .from("vw_nr_colaborador")
    .select("*")
    .order("colaborador_nome", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as NrColaboradorItem[];
}

export async function getConfigCategoriasTreinamento() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .schema("rh")
    .from("config_categorias_treinamento")
    .select("id, nome")
    .eq("ativo", true)
    .order("nome");

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getConfigNrsCatalogo() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .schema("rh")
    .from("config_nrs_catalogo")
    .select("id, nr, nome, periodicidade_meses")
    .eq("ativo", true)
    .order("nr");

  if (error) throw new Error(error.message);
  return data ?? [];
}
