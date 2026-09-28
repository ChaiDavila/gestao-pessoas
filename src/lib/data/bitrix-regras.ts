import { createClient } from "@/lib/supabase/server";

export type RegraBitrix = {
  id: string;
  ativo: boolean;
  tipo_evento: string;
  dias_antecedencia: number;
  responsavel_bitrix_id: number;
  responsavel_bitrix_nome: string;
  corresponsaveis_bitrix_ids: number[] | null;
  corresponsaveis_bitrix_nomes: string[] | null;
  titulo_template: string;
  descricao_template: string | null;
};

export async function getRegrasBitrix() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .schema("rh")
    .from("config_bitrix_regras")
    .select("*")
    .order("tipo_evento");

  if (error) throw new Error(error.message);
  return (data ?? []) as RegraBitrix[];
}
