"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getUnidadeIdPadrao } from "@/lib/data/unidades";

export type PgrFormState = { error: string } | { ok: true } | undefined;

function revalidar() {
  revalidatePath("/configuracoes");
}

export async function adicionarPgr(
  cargoId: string,
  exameId: string,
  _prevState: PgrFormState,
  _formData: FormData,
): Promise<PgrFormState> {
  const supabase = await createClient();
  const unidadeId = await getUnidadeIdPadrao();

  const { error } = await supabase.schema("rh").from("config_exames_por_funcao").insert({
    unidade_id: unidadeId,
    cargo_id: cargoId,
    exame_id: exameId,
  });

  if (error) return { error: error.message };
  revalidar();
  return { ok: true };
}

export async function removerPgr(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .schema("rh")
    .from("config_exames_por_funcao")
    .update({ ativo: false })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidar();
}

export async function registrarPgrLote(
  _prevState: PgrFormState,
  formData: FormData,
): Promise<PgrFormState> {
  const cargoIds = formData.getAll("cargos") as string[];
  const exameIds = formData.getAll("exames") as string[];

  if (cargoIds.length === 0 || exameIds.length === 0) {
    return { error: "Selecione ao menos uma função e um exame." };
  }

  const supabase = await createClient();
  const unidadeId = await getUnidadeIdPadrao();

  const { data: existentes, error: existentesError } = await supabase
    .schema("rh")
    .from("config_exames_por_funcao")
    .select("cargo_id, exame_id")
    .eq("ativo", true)
    .in("cargo_id", cargoIds)
    .in("exame_id", exameIds);

  if (existentesError) return { error: existentesError.message };

  const jaExiste = new Set(
    (existentes ?? []).map((e) => `${e.cargo_id}:${e.exame_id}`),
  );

  const novos: { unidade_id: string; cargo_id: string; exame_id: string }[] = [];
  for (const cargoId of cargoIds) {
    for (const exameId of exameIds) {
      if (!jaExiste.has(`${cargoId}:${exameId}`)) {
        novos.push({ unidade_id: unidadeId, cargo_id: cargoId, exame_id: exameId });
      }
    }
  }

  if (novos.length > 0) {
    const { error } = await supabase.schema("rh").from("config_exames_por_funcao").insert(novos);
    if (error) return { error: error.message };
  }

  revalidar();
  return { ok: true };
}
