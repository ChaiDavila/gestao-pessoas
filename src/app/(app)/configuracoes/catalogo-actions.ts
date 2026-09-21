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

  if (error) {
    // "Remover" nunca apaga de verdade (só marca ativo=false), então o nome continua
    // ocupado pela constraint de unicidade. Se o que travou foi exatamente esse caso —
    // já existe um item removido com o mesmo valor no campo identificador (primeira
    // coluna do formulário) — reativa esse item com os dados novos em vez de travar.
    if (error.code === "23505") {
      const campoChave = campos[0];
      const { data: existente } = await supabase
        .schema("rh")
        .from(tabela)
        .select("id, ativo")
        .eq(campoChave, valores[campoChave] as string)
        .maybeSingle();

      if (existente && !existente.ativo) {
        const { error: reativarError } = await supabase
          .schema("rh")
          .from(tabela)
          .update({ ...valores, ativo: true })
          .eq("id", existente.id);
        if (reativarError) return { error: reativarError.message };
        revalidar();
        return { ok: true };
      }
    }
    return { error: error.message };
  }

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
