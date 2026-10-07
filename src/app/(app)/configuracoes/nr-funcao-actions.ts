"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getUnidadeIdPadrao } from "@/lib/data/unidades";
import { seedAcompanhamentoNrParaFuncao } from "@/lib/data/acompanhamento";

export type NrFuncaoFormState = { error: string } | { ok: true } | undefined;

function revalidar() {
  revalidatePath("/configuracoes");
}

export async function adicionarNrFuncao(
  cargoId: string,
  nrCatalogoId: string,
  _prevState: NrFuncaoFormState,
  _formData: FormData,
): Promise<NrFuncaoFormState> {
  const supabase = await createClient();
  const unidadeId = await getUnidadeIdPadrao();

  const { error } = await supabase.schema("rh").from("config_nrs_por_funcao").insert({
    unidade_id: unidadeId,
    cargo_id: cargoId,
    nr_catalogo_id: nrCatalogoId,
  });

  if (error) return { error: error.message };

  // Função já confirmada como "não exige nada" só fazia sentido até agora ganhar uma
  // exigência de verdade — desfaz a confirmação pra não ficarem contraditórias.
  await supabase
    .schema("rh")
    .from("config_cargos")
    .update({ nr_matriz_confirmada: false })
    .eq("id", cargoId);

  await seedAcompanhamentoNrParaFuncao(supabase, unidadeId, cargoId, nrCatalogoId);

  revalidar();
  return { ok: true };
}

export async function removerNrFuncao(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .schema("rh")
    .from("config_nrs_por_funcao")
    .update({ ativo: false })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidar();
}

export async function registrarNrFuncaoLote(
  _prevState: NrFuncaoFormState,
  formData: FormData,
): Promise<NrFuncaoFormState> {
  const cargoIds = formData.getAll("cargos") as string[];
  const nrIds = formData.getAll("nrs") as string[];

  if (cargoIds.length === 0 || nrIds.length === 0) {
    return { error: "Selecione ao menos uma função e uma NR." };
  }

  const supabase = await createClient();
  const unidadeId = await getUnidadeIdPadrao();

  const { data: existentes, error: existentesError } = await supabase
    .schema("rh")
    .from("config_nrs_por_funcao")
    .select("cargo_id, nr_catalogo_id")
    .eq("ativo", true)
    .in("cargo_id", cargoIds)
    .in("nr_catalogo_id", nrIds);

  if (existentesError) return { error: existentesError.message };

  const jaExiste = new Set(
    (existentes ?? []).map((e) => `${e.cargo_id}:${e.nr_catalogo_id}`),
  );

  const novos: { unidade_id: string; cargo_id: string; nr_catalogo_id: string }[] = [];
  for (const cargoId of cargoIds) {
    for (const nrId of nrIds) {
      if (!jaExiste.has(`${cargoId}:${nrId}`)) {
        novos.push({ unidade_id: unidadeId, cargo_id: cargoId, nr_catalogo_id: nrId });
      }
    }
  }

  if (novos.length > 0) {
    const { error } = await supabase.schema("rh").from("config_nrs_por_funcao").insert(novos);
    if (error) return { error: error.message };

    await supabase
      .schema("rh")
      .from("config_cargos")
      .update({ nr_matriz_confirmada: false })
      .in("id", cargoIds);

    for (const { cargo_id, nr_catalogo_id } of novos) {
      await seedAcompanhamentoNrParaFuncao(supabase, unidadeId, cargo_id, nr_catalogo_id);
    }
  }

  revalidar();
  return { ok: true };
}

// "Confirmar que esta função não exige nenhuma NR" — diferencia de "ainda não configurada"
// (zero linhas na matriz, sem ninguém ter olhado pra isso ainda).
export async function definirNrMatrizConfirmada(cargoId: string, confirmada: boolean) {
  const supabase = await createClient();
  const { error } = await supabase
    .schema("rh")
    .from("config_cargos")
    .update({ nr_matriz_confirmada: confirmada })
    .eq("id", cargoId);
  if (error) throw new Error(error.message);
  revalidar();
}
