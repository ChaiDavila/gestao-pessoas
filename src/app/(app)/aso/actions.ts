"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getUnidadeIdPadrao } from "@/lib/data/unidades";
import { somarMeses } from "@/lib/date";

export type AsoFormState = { error: string } | { ok: true } | undefined;

function revalidar() {
  revalidatePath("/aso");
}

export async function adicionarAso(
  colaboradorId: string,
  _prevState: AsoFormState,
  formData: FormData,
): Promise<AsoFormState> {
  const tipoExame = formData.get("tipo_exame") as string;
  const data = formData.get("data") as string;
  const resultado = formData.get("resultado") as string;
  const dataVencimento = (formData.get("data_vencimento") as string) || null;

  if (!tipoExame || !data || !resultado) {
    return { error: "Informe tipo de exame, data e resultado." };
  }

  const supabase = await createClient();
  const unidadeId = await getUnidadeIdPadrao();

  const { error } = await supabase.schema("rh").from("aso_registros").insert({
    unidade_id: unidadeId,
    colaborador_id: colaboradorId,
    tipo_exame: tipoExame,
    data,
    resultado,
    data_vencimento: dataVencimento,
  });

  if (error) return { error: error.message };
  revalidar();
  return { ok: true };
}

export async function atualizarAso(
  asoId: string,
  _prevState: AsoFormState,
  formData: FormData,
): Promise<AsoFormState> {
  const tipoExame = formData.get("tipo_exame") as string;
  const data = formData.get("data") as string;
  const resultado = formData.get("resultado") as string;
  const dataVencimento = (formData.get("data_vencimento") as string) || null;

  if (!tipoExame || !data || !resultado) {
    return { error: "Informe tipo de exame, data e resultado." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .schema("rh")
    .from("aso_registros")
    .update({ tipo_exame: tipoExame, data, resultado, data_vencimento: dataVencimento })
    .eq("id", asoId);

  if (error) return { error: error.message };
  revalidar();
  return { ok: true };
}

export async function removerAso(asoId: string) {
  const supabase = await createClient();
  const { error } = await supabase.schema("rh").from("aso_registros").delete().eq("id", asoId);
  if (error) throw new Error(error.message);
  revalidar();
}

export async function adicionarExameComplementar(
  colaboradorId: string,
  exameId: string,
  _prevState: AsoFormState,
  formData: FormData,
): Promise<AsoFormState> {
  const data = formData.get("data") as string;
  const periodicidadeRaw = formData.get("periodicidade_meses") as string;

  if (!data) return { error: "Informe a data." };

  const periodicidadeMeses = periodicidadeRaw ? Number(periodicidadeRaw) : null;
  const dataVencimento = periodicidadeMeses ? somarMeses(data, periodicidadeMeses) : null;

  const supabase = await createClient();
  const unidadeId = await getUnidadeIdPadrao();

  const { error } = await supabase.schema("rh").from("exames_complementares_registros").insert({
    unidade_id: unidadeId,
    colaborador_id: colaboradorId,
    exame_id: exameId,
    data,
    data_vencimento: dataVencimento,
  });

  if (error) return { error: error.message };
  revalidar();
  return { ok: true };
}

export async function atualizarExameComplementar(
  registroId: string,
  _prevState: AsoFormState,
  formData: FormData,
): Promise<AsoFormState> {
  const data = formData.get("data") as string;
  const periodicidadeRaw = formData.get("periodicidade_meses") as string;

  if (!data) return { error: "Informe a data." };

  const periodicidadeMeses = periodicidadeRaw ? Number(periodicidadeRaw) : null;
  const dataVencimento = periodicidadeMeses ? somarMeses(data, periodicidadeMeses) : null;

  const supabase = await createClient();
  const { error } = await supabase
    .schema("rh")
    .from("exames_complementares_registros")
    .update({ data, data_vencimento: dataVencimento })
    .eq("id", registroId);

  if (error) return { error: error.message };
  revalidar();
  return { ok: true };
}

export async function removerExameComplementar(registroId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .schema("rh")
    .from("exames_complementares_registros")
    .delete()
    .eq("id", registroId);
  if (error) throw new Error(error.message);
  revalidar();
}
