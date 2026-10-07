"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getUnidadeIdPadrao } from "@/lib/data/unidades";
import { somarMeses } from "@/lib/date";

export type AsoFormState = { error: string } | { ok: true } | undefined;

// Liga/desliga o acompanhamento de validade de um exame complementar (PGR) já presente na
// ficha — nunca apaga o registro, só tira (ou devolve) da lista de pendências/alertas.
export async function atualizarAcompanhamentoExame(acompanhamentoId: string, acompanhar: boolean) {
  const supabase = await createClient();
  const { error } = await supabase
    .schema("rh")
    .from("colaborador_exame_acompanhamento")
    .update({ acompanhar })
    .eq("id", acompanhamentoId);

  if (error) throw new Error(error.message);
  revalidatePath("/aso");
}

// Começa a acompanhar um exame que a função do colaborador não exige.
export async function ativarAcompanhamentoExameNovo(colaboradorId: string, exameId: string) {
  const supabase = await createClient();
  const unidadeId = await getUnidadeIdPadrao();
  const { error } = await supabase.schema("rh").from("colaborador_exame_acompanhamento").upsert(
    { unidade_id: unidadeId, colaborador_id: colaboradorId, exame_id: exameId, acompanhar: true },
    { onConflict: "colaborador_id,exame_id" },
  );

  if (error) throw new Error(error.message);
  revalidatePath("/aso");
}

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
  let dataVencimento = (formData.get("data_vencimento") as string) || null;

  if (!tipoExame || !data || !resultado) {
    return { error: "Informe tipo de exame, data e resultado." };
  }

  const supabase = await createClient();
  const unidadeId = await getUnidadeIdPadrao();

  // ASO periódico: se a pessoa não digitou um vencimento, calcula sozinho a partir da
  // periodicidade configurada pra função dela (Configurações → ASO e PGR) — se não houver
  // periodicidade configurada pra essa função, o vencimento continua manual, como sempre foi.
  if (tipoExame === "periodico" && !dataVencimento) {
    const { data: colaborador } = await supabase
      .schema("rh")
      .from("colaboradores")
      .select("cargo_id")
      .eq("id", colaboradorId)
      .single();

    if (colaborador?.cargo_id) {
      const { data: periodicidade } = await supabase
        .schema("rh")
        .from("config_periodicidade_aso_por_funcao")
        .select("periodicidade_meses")
        .eq("cargo_id", colaborador.cargo_id)
        .eq("ativo", true)
        .maybeSingle();

      if (periodicidade?.periodicidade_meses) {
        dataVencimento = somarMeses(data, periodicidade.periodicidade_meses);
      }
    }
  }

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

  // Garante uma linha de acompanhamento pra esse exame — só cria se ainda não existir
  // nenhuma (acompanhar=true por padrão); nunca sobrescreve uma escolha manual já feita.
  await supabase
    .schema("rh")
    .from("colaborador_exame_acompanhamento")
    .upsert(
      { unidade_id: unidadeId, colaborador_id: colaboradorId, exame_id: exameId, acompanhar: true },
      { onConflict: "colaborador_id,exame_id", ignoreDuplicates: true },
    );

  revalidar();
  return { ok: true };
}

export async function atualizarExameComplementar(
  registroId: string,
  _prevState: AsoFormState,
  formData: FormData,
): Promise<AsoFormState> {
  const data = formData.get("data") as string;
  const dataVencimento = (formData.get("data_vencimento") as string) || null;

  if (!data) return { error: "Informe a data." };

  // Vencimento vem direto do formulário (não recalculado pela periodicidade do catálogo
  // de exames) — se o tipo de exame mudar de periodicidade depois, isso não deve alterar
  // o vencimento já calculado/digitado de um registro existente.
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
