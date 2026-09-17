import { createClient } from "@/lib/supabase/server";

export type AsoColaboradorItem = {
  colaborador_id: string;
  colaborador_nome: string;
  cargo_id: string | null;
  cargo_nome: string | null;
  setor_id: string | null;
  setor_nome: string | null;
  status_rh: string;
  registro_id: string;
  tipo_exame: string;
  data: string;
  resultado: string;
  data_vencimento: string | null;
};

export type PgrColaboradorItem = {
  colaborador_id: string;
  colaborador_nome: string;
  cargo_id: string | null;
  cargo_nome: string | null;
  setor_id: string | null;
  setor_nome: string | null;
  status_rh: string;
  exame_id: string;
  exame_nome: string;
  periodicidade_meses: number | null;
  registro_id: string | null;
  data: string | null;
  data_vencimento: string | null;
};

export async function getAsoColaboradores() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .schema("rh")
    .from("vw_aso_colaborador")
    .select("*")
    .order("colaborador_nome");

  if (error) throw new Error(error.message);
  return (data ?? []) as AsoColaboradorItem[];
}

export async function getPgrColaboradores() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .schema("rh")
    .from("vw_pgr_colaborador")
    .select("*")
    .order("colaborador_nome");

  if (error) throw new Error(error.message);
  return (data ?? []) as PgrColaboradorItem[];
}
