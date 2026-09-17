import { createClient } from "@/lib/supabase/server";

export async function getUnidadeIdPadrao() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .schema("core")
    .from("unidades")
    .select("id")
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) throw new Error("Nenhuma unidade cadastrada em core.unidades.");
  return data.id as string;
}
