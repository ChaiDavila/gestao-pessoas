"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

// Remoção de verdade (não soft-delete): se era o desligamento vigente (sem
// data_reativacao), o trigger rh.tg_desligamento_sync_status já cuida de voltar
// o colaborador para status_rh = 'ativo' automaticamente.
export async function removerDesligamento(desligamentoId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .schema("rh")
    .from("desligamentos")
    .delete()
    .eq("id", desligamentoId);

  if (error) throw new Error(error.message);

  revalidatePath("/desligamentos");
  revalidatePath("/colaboradores");
}
