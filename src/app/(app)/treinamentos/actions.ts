"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getUnidadeIdPadrao } from "@/lib/data/unidades";
import { somarMeses } from "@/lib/date";

export type TreinamentoFormState = { error: string } | { ok: true } | undefined;

// Liga/desliga o acompanhamento de validade de uma NR já presente na ficha do colaborador
// (curso feito, ou exigido pela função) — nunca apaga o treinamento/certificado, só tira
// (ou devolve) aquela combinação dos alertas e indicadores de pendência.
export async function atualizarAcompanhamentoNr(acompanhamentoId: string, acompanhar: boolean) {
  const supabase = await createClient();
  const { error } = await supabase
    .schema("rh")
    .from("colaborador_nr_acompanhamento")
    .update({ acompanhar })
    .eq("id", acompanhamentoId);

  if (error) throw new Error(error.message);
  revalidar();
}

// Começa a acompanhar uma NR que o colaborador ainda não tinha nenhuma linha — curso que a
// função dele não exige, mas alguém quer monitorar mesmo assim (ex.: certificação extra).
export async function ativarAcompanhamentoNrNovo(colaboradorId: string, nrCatalogoId: string) {
  const supabase = await createClient();
  const unidadeId = await getUnidadeIdPadrao();
  const { error } = await supabase.schema("rh").from("colaborador_nr_acompanhamento").upsert(
    {
      unidade_id: unidadeId,
      colaborador_id: colaboradorId,
      nr_catalogo_id: nrCatalogoId,
      acompanhar: true,
    },
    { onConflict: "colaborador_id,nr_catalogo_id" },
  );

  if (error) throw new Error(error.message);
  revalidar();
}

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

  // Garante que todo participante tenha uma linha de acompanhamento pra essa NR — só cria
  // quando ainda não existe nenhuma (acompanhar=true por padrão); nunca sobrescreve uma
  // escolha manual já feita (nem pra ligar, nem pra desligar).
  const { data: existentes } = await supabase
    .schema("rh")
    .from("colaborador_nr_acompanhamento")
    .select("colaborador_id")
    .eq("nr_catalogo_id", nrCatalogoId)
    .in("colaborador_id", participantes);
  const jaTem = new Set((existentes ?? []).map((e) => e.colaborador_id));
  const semAcompanhamento = participantes.filter((id) => !jaTem.has(id));
  if (semAcompanhamento.length > 0) {
    const { error: acompError } = await supabase.schema("rh").from("colaborador_nr_acompanhamento").insert(
      semAcompanhamento.map((colaboradorId) => ({
        unidade_id: unidadeId,
        colaborador_id: colaboradorId,
        nr_catalogo_id: nrCatalogoId,
        acompanhar: true,
      })),
    );
    if (acompError) console.error("registrarNrLote (seed acompanhamento):", acompError.message);
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
//
// Um curso de NR registrado em lote (turma) é UM único registro em rh.treinamentos
// compartilhado por vários colaboradores (rh.treinamento_participantes). Editar a partir da
// ficha de uma pessoa não pode alterar o curso de quem mais participou da mesma turma — por
// isso, se o registro tiver mais de um participante, a edição "separa" só esta pessoa pra um
// registro novo (histórico/dados dela), preservando o registro original intacto pros demais.
export async function atualizarRegistroNr(
  treinamentoId: string,
  colaboradorId: string,
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

  const camposEditados = {
    data,
    carga_horaria: Number(cargaHoraria),
    custo_total: custoTotal ? Number(custoTotal) : null,
    instrutor,
    data_vencimento: dataVencimento,
  };

  const { data: participantes, error: participantesError } = await supabase
    .schema("rh")
    .from("treinamento_participantes")
    .select("id, colaborador_id")
    .eq("treinamento_id", treinamentoId);

  if (participantesError) return { error: participantesError.message };

  if ((participantes ?? []).length <= 1) {
    const { error } = await supabase
      .schema("rh")
      .from("treinamentos")
      .update(camposEditados)
      .eq("id", treinamentoId);

    if (error) return { error: error.message };
    revalidar();
    return { ok: true };
  }

  const participante = participantes!.find((p) => p.colaborador_id === colaboradorId);
  if (!participante) return { error: "Participação não encontrada." };

  const { data: original, error: originalError } = await supabase
    .schema("rh")
    .from("treinamentos")
    .select("unidade_id, nome, tipo, nr_numero, categoria_id")
    .eq("id", treinamentoId)
    .single();

  if (originalError || !original) {
    return { error: originalError?.message ?? "Curso original não encontrado." };
  }

  const { data: novoTreinamento, error: novoError } = await supabase
    .schema("rh")
    .from("treinamentos")
    .insert({ ...original, ...camposEditados })
    .select("id")
    .single();

  if (novoError || !novoTreinamento) {
    return { error: novoError?.message ?? "Erro ao separar o registro desta pessoa." };
  }

  const { error: moverError } = await supabase
    .schema("rh")
    .from("treinamento_participantes")
    .update({ treinamento_id: novoTreinamento.id })
    .eq("id", participante.id);

  if (moverError) {
    await supabase.schema("rh").from("treinamentos").delete().eq("id", novoTreinamento.id);
    return { error: moverError.message };
  }

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
