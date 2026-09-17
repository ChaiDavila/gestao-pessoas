import { createClient } from "@/lib/supabase/server";

export type ColaboradorAniversarioItem = {
  id: string;
  nome: string;
  data_nascimento: string | null;
  data_admissao: string;
  cargo_nome: string | null;
  setor_nome: string | null;
};

export async function getColaboradoresAniversario() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .schema("rh")
    .from("vw_colaboradores")
    .select("id, nome, data_nascimento, data_admissao, cargo_nome, setor_nome")
    .eq("status_rh", "ativo")
    .order("nome");

  if (error) throw new Error(error.message);
  return (data ?? []) as ColaboradorAniversarioItem[];
}
