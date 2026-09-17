import { createClient } from "@/lib/supabase/server";

export async function getMotivosDesligamento() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .schema("rh")
    .from("config_motivos_desligamento")
    .select("id, motivo, tipo_padrao")
    .eq("ativo", true)
    .order("motivo");

  if (error) throw new Error(error.message);
  return data ?? [];
}
