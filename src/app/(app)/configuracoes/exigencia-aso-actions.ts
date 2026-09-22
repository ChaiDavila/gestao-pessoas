"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function atualizarExigenciaAso(id: string, exigeAso: boolean) {
  const supabase = await createClient();
  const { error } = await supabase
    .schema("rh")
    .from("config_exigencia_aso")
    .update({ exige_aso: exigeAso })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/configuracoes");
  revalidatePath("/aso");
}
