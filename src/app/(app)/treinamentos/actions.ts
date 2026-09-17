"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getUnidadeIdPadrao } from "@/lib/data/unidades";
import { somarMeses } from "@/lib/date";

export type TreinamentoFormState = { error: string } | { ok: true } | undefined;

function revalidar() {
  revalidatePath("/treinamentos");
}

export async function criarTreinamentoGeral(
  _prevState: TreinamentoFormState,
  formData: FormData,
): Promise<TreinamentoFormState> {
  const nome = formData.get("nome") as string;
  const categoriaId = formData.get("categoria_id") as string;
  const data = formData.get("data") as string;
  const cargaHoraria = formData.get("carga_horaria") as string;
  const custoTotal = formData.get("custo_total") as string;
  const instrutor = (formData.get("instrutor") as string) || null;
  const dataVencimento = (formData.get("data_vencimento") as string) || null;
  const participantes = formData.getAll("participantes") as string[];

  if (!nome || !categoriaId || !data || !cargaHoraria || participantes.length === 0) {
    return { error: "Informe nome, categoria, data, carga horária e ao menos um participante." };
  }

  const supabase = await createClient();
  const unidadeId = await getUnidadeIdPadrao();

  const { data: treinamento, error } = await supabase
    .schema("rh")
    .from("treinamentos")
    .insert({
      unidade_id: unidadeId,
      nome,
      tipo: "geral",
      categoria_id: categoriaId,
      data,
      carga_horaria: Number(cargaHoraria),
      custo_total: custoTotal ? Number(custoTotal) : null,
      instrutor,
      data_vencimento: dataVencimento,
    })
    .select("id")
    .single();

  if (error || !treinamento) {
    return { error: error?.message ?? "Erro ao criar treinamento." };
  }

  const { error: participantesError } = await supabase
    .schema("rh")
    .from("treinamento_participantes")
    .insert(
      participantes.map((colaboradorId) => ({
        unidade_id: unidadeId,
        treinamento_id: treinamento.id,
        colaborador_id: colaboradorId,
      })),
    );

  if (participantesError) {
    await supabase.schema("rh").from("treinamentos").delete().eq("id", treinamento.id);
    return { error: participantesError.message };
  }

  revalidar();
  return { ok: true };
}

export async function registrarNrLote(
  _prevState: TreinamentoFormState,
  formData: FormData,
): Promise<TreinamentoFormState> {
  const nrCatalogoId = formData.get("nr_catalogo_id") as string;
  const data = formData.get("data") as string;
  const cargaHoraria = formData.get("carga_horaria") as string;
  const custoTotal = formData.get("custo_total") as string;
  const instrutor = (formData.get("instrutor") as string) || null;
  const participantes = formData.getAll("participantes") as string[];

  if (!nrCatalogoId || !data || !cargaHoraria || participantes.length === 0) {
    return { error: "Selecione o curso de NR, a data, a carga horária e ao menos um participante." };
  }

  const supabase = await createClient();
  const unidadeId = await getUnidadeIdPadrao();

  const { data: nrCatalogo, error: nrError } = await supabase
    .schema("rh")
    .from("config_nrs_catalogo")
    .select("nome, periodicidade_meses")
    .eq("id", nrCatalogoId)
    .single();

  if (nrError || !nrCatalogo) {
    return { error: "Curso de NR não encontrado." };
  }

  const dataVencimento = nrCatalogo.periodicidade_meses
    ? somarMeses(data, nrCatalogo.periodicidade_meses)
    : null;

  const { data: treinamento, error } = await supabase
    .schema("rh")
    .from("treinamentos")
    .insert({
      unidade_id: unidadeId,
      nome: nrCatalogo.nome,
      tipo: "NR",
      nr_numero: nrCatalogoId,
      categoria_id: null,
      data,
      carga_horaria: Number(cargaHoraria),
      custo_total: custoTotal ? Number(custoTotal) : null,
      instrutor,
      data_vencimento: dataVencimento,
    })
    .select("id")
    .single();

  if (error || !treinamento) {
    return { error: error?.message ?? "Erro ao registrar treinamento de NR." };
  }

  const { error: participantesError } = await supabase
    .schema("rh")
    .from("treinamento_participantes")
    .insert(
      participantes.map((colaboradorId) => ({
        unidade_id: unidadeId,
        treinamento_id: treinamento.id,
        colaborador_id: colaboradorId,
      })),
    );

  if (participantesError) {
    await supabase.schema("rh").from("treinamentos").delete().eq("id", treinamento.id);
    return { error: participantesError.message };
  }

  revalidar();
  return { ok: true };
}

export async function renovarNr(
  colaboradorId: string,
  nrCatalogoId: string,
  _prevState: TreinamentoFormState,
  formData: FormData,
): Promise<TreinamentoFormState> {
  const data = formData.get("data") as string;
  const cargaHoraria = formData.get("carga_horaria") as string;
  const custoTotal = formData.get("custo_total") as string;
  const instrutor = (formData.get("instrutor") as string) || null;

  if (!data || !cargaHoraria) {
    return { error: "Informe a data e a carga horária." };
  }

  const supabase = await createClient();
  const unidadeId = await getUnidadeIdPadrao();

  const { data: nrCatalogo, error: nrError } = await supabase
    .schema("rh")
    .from("config_nrs_catalogo")
    .select("nome, periodicidade_meses")
    .eq("id", nrCatalogoId)
    .single();

  if (nrError || !nrCatalogo) {
    return { error: "Curso de NR não encontrado." };
  }

  const dataVencimento = nrCatalogo.periodicidade_meses
    ? somarMeses(data, nrCatalogo.periodicidade_meses)
    : null;

  const { data: treinamento, error } = await supabase
    .schema("rh")
    .from("treinamentos")
    .insert({
      unidade_id: unidadeId,
      nome: nrCatalogo.nome,
      tipo: "NR",
      nr_numero: nrCatalogoId,
      data,
      carga_horaria: Number(cargaHoraria),
      custo_total: custoTotal ? Number(custoTotal) : null,
      instrutor,
      data_vencimento: dataVencimento,
    })
    .select("id")
    .single();

  if (error || !treinamento) {
    return { error: error?.message ?? "Erro ao renovar." };
  }

  const { error: participanteError } = await supabase
    .schema("rh")
    .from("treinamento_participantes")
    .insert({ unidade_id: unidadeId, treinamento_id: treinamento.id, colaborador_id: colaboradorId });

  if (participanteError) {
    await supabase.schema("rh").from("treinamentos").delete().eq("id", treinamento.id);
    return { error: participanteError.message };
  }

  revalidar();
  return { ok: true };
}

export async function atualizarTreinamentoGeral(
  treinamentoId: string,
  _prevState: TreinamentoFormState,
  formData: FormData,
): Promise<TreinamentoFormState> {
  const nome = formData.get("nome") as string;
  const categoriaId = formData.get("categoria_id") as string;
  const data = formData.get("data") as string;
  const cargaHoraria = formData.get("carga_horaria") as string;
  const custoTotal = formData.get("custo_total") as string;
  const instrutor = (formData.get("instrutor") as string) || null;
  const dataVencimento = (formData.get("data_vencimento") as string) || null;

  if (!nome || !categoriaId || !data || !cargaHoraria) {
    return { error: "Informe nome, categoria, data e carga horária." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .schema("rh")
    .from("treinamentos")
    .update({
      nome,
      categoria_id: categoriaId,
      data,
      carga_horaria: Number(cargaHoraria),
      custo_total: custoTotal ? Number(custoTotal) : null,
      instrutor,
      data_vencimento: dataVencimento,
    })
    .eq("id", treinamentoId);

  if (error) return { error: error.message };
  revalidar();
  return { ok: true };
}

// Corrige um registro de NR já existente (data, carga horária, custo, instrutor, vencimento) —
// diferente de "Renovar", que sempre cria um registro novo de propósito (histórico preservado).
export async function atualizarRegistroNr(
  treinamentoId: string,
  _prevState: TreinamentoFormState,
  formData: FormData,
): Promise<TreinamentoFormState> {
  const data = formData.get("data") as string;
  const cargaHoraria = formData.get("carga_horaria") as string;
  const custoTotal = formData.get("custo_total") as string;
  const instrutor = (formData.get("instrutor") as string) || null;
  const dataVencimento = (formData.get("data_vencimento") as string) || null;

  if (!data || !cargaHoraria) {
    return { error: "Informe a data e a carga horária." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .schema("rh")
    .from("treinamentos")
    .update({
      data,
      carga_horaria: Number(cargaHoraria),
      custo_total: custoTotal ? Number(custoTotal) : null,
      instrutor,
      data_vencimento: dataVencimento,
    })
    .eq("id", treinamentoId);

  if (error) return { error: error.message };
  revalidar();
  return { ok: true };
}

export async function removerTreinamento(treinamentoId: string) {
  const supabase = await createClient();
  const { error } = await supabase.schema("rh").from("treinamentos").delete().eq("id", treinamentoId);
  if (error) throw new Error(error.message);
  revalidar();
}

export async function removerParticipacao(participanteId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .schema("rh")
    .from("treinamento_participantes")
    .delete()
    .eq("id", participanteId);
  if (error) throw new Error(error.message);
  revalidar();
}
