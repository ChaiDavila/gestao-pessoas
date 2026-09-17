import { createClient } from "@/lib/supabase/server";

export type DesligamentoItem = {
  id: string;
  colaborador_id: string;
  colaborador_nome: string;
  cargo_nome: string | null;
  setor_nome: string | null;
  data: string;
  tipo: string;
  motivo_nome: string | null;
  descricao: string | null;
  data_reativacao: string | null;
};

export async function getDesligamentos() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .schema("rh")
    .from("vw_desligamentos")
    .select(
      "id, colaborador_id, colaborador_nome, cargo_nome, setor_nome, data, tipo, motivo_nome, descricao, data_reativacao",
    )
    .eq("ativo", true)
    .order("data", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as DesligamentoItem[];
}
