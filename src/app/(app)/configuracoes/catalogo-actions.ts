"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getUnidadeIdPadrao } from "@/lib/data/unidades";

export type CatalogoFormState = { error: string } | { ok: true } | undefined;

function revalidar() {
  revalidatePath("/configuracoes");
}

export async function criarItemCatalogo(
  tabela: string,
  campos: string[],
  _prevState: CatalogoFormState,
  formData: FormData,
): Promise<CatalogoFormState> {
  const supabase = await createClient();
  const unidadeId = await getUnidadeIdPadrao();

  const valores: Record<string, unknown> = { unidade_id: unidadeId };
  for (const campo of campos) {
    const valor = formData.get(campo);
    valores[campo] = valor === "" ? null : valor;
  }

  const { error } = await supabase.schema("rh").from(tabela).insert(valores);
  if (error) return { error: error.message };

  revalidar();
  return { ok: true };
}

export async function atualizarItemCatalogo(
  tabela: string,
  id: string,
  campos: string[],
  _prevState: CatalogoFormState,
  formData: FormData,
): Promise<CatalogoFormState> {
  const supabase = await createClient();

  const valores: Record<string, unknown> = {};
  for (const campo of campos) {
    const valor = formData.get(campo);
    valores[campo] = valor === "" ? null : valor;
  }

  const { error } = await supabase.schema("rh").from(tabela).update(valores).eq("id", id);
  if (error) return { error: error.message };

  revalidar();
  return { ok: true };
}

// "Remover" nunca apaga uso já feito: some da lista de sugestão via ativo=false.
export async function removerItemCatalogo(tabela: string, id: string) {
  const supabase = await createClient();
  const { error } = await supabase.schema("rh").from(tabela).update({ ativo: false }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidar();
}
