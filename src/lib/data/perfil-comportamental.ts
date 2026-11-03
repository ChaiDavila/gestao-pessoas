import { createClient } from "@/lib/supabase/server";

export type PerfilComportamentalItem = {
  id: string;
  colaborador_id: string;
  data_avaliacao: string | null;
  disc_d: number;
  disc_i: number;
  disc_s: number;
  disc_c: number;
  forca_instintivo: number;
  forca_intelectual: number;
  forca_desprendido: number;
  forca_eficiente: number;
  forca_objetivo: number;
  forca_harmonioso: number;
  forca_intencional: number;
  forca_altruista: number;
  forca_participante: number;
  forca_comandante: number;
  forca_receptivo: number;
  forca_estruturado: number;
};

export type DiscResumoItem = {
  colaborador_id: string;
  disc_d: number;
  disc_i: number;
  disc_s: number;
  disc_c: number;
};

// Um registro por colaborador (ver migration) — null quando ainda não foi cadastrado.
export async function getPerfilComportamental(colaboradorId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .schema("rh")
    .from("perfil_comportamental")
    .select("*")
    .eq("colaborador_id", colaboradorId)
    .eq("ativo", true)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data as PerfilComportamentalItem | null;
}

// Só o DISC, pra montar o badge na listagem de colaboradores sem puxar as 12 colunas de
// força de todo mundo à toa.
export async function getPerfisDiscResumo() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .schema("rh")
    .from("vw_perfil_disc_resumo")
    .select("*");

  if (error) throw new Error(error.message);
  return (data ?? []) as DiscResumoItem[];
}
