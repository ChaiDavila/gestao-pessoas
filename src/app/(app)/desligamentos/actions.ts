"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type AtualizarDesligamentoState = { error: string } | { ok: true } | undefined;

// Corrige um desligamento já registrado (data, tipo, motivo padronizado, descrição livre).
// Não mexe em data_reativacao nem em status_rh do colaborador — isso continua sendo
// controlado só por "Desativar"/"Reativar"/"Remover".
export async function atualizarDesligamento(
  desligamentoId: string,
  _prevState: AtualizarDesligamentoState,
  formData: FormData,
): Promise<AtualizarDesligamentoState> {
  const data = formData.get("data") as string;
  const tipo = formData.get("tipo") as string;
  const motivoId = (formData.get("motivo_id") as string) || null;
  const descricao = (formData.get("descricao") as string) || null;

  if (!data || !tipo) {
    return { error: "Informe a data e o tipo do desligamento." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .schema("rh")
    .from("desligamentos")
    .update({ data, tipo, motivo_id: motivoId, descricao })
    .eq("id", desligamentoId);

  if (error) return { error: error.message };

  revalidatePath("/desligamentos");
  revalidatePath("/colaboradores");
  return { ok: true };
}

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
