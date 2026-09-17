"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getUnidadeIdPadrao } from "@/lib/data/unidades";
import { somarMeses } from "@/lib/date";

export type SubRecursoState = { error: string } | { ok: true } | undefined;

function revalidarFicha(colaboradorId: string) {
  revalidatePath(`/colaboradores/${colaboradorId}`);
}

// ---------------------------------------------------------------------------
// Dependentes
// ---------------------------------------------------------------------------

export async function adicionarDependente(
  colaboradorId: string,
  _prevState: SubRecursoState,
  formData: FormData,
): Promise<SubRecursoState> {
  const nome = formData.get("nome") as string;
  const parentesco = formData.get("parentesco") as string;
  const dataNascimento = (formData.get("data_nascimento") as string) || null;
  let sexo = (formData.get("sexo") as string) || null;

  if (!nome || !parentesco) {
    return { error: "Informe nome e parentesco." };
  }

  if (!sexo) {
    if (parentesco === "Filho" || parentesco === "Enteado") sexo = "M";
    else if (parentesco === "Filha" || parentesco === "Enteada") sexo = "F";
  }

  const supabase = await createClient();
  const unidadeId = await getUnidadeIdPadrao();

  const { error } = await supabase.schema("rh").from("dependentes").insert({
    unidade_id: unidadeId,
    colaborador_id: colaboradorId,
    nome,
    parentesco,
    data_nascimento: dataNascimento,
    sexo,
  });

  if (error) return { error: error.message };
  revalidarFicha(colaboradorId);
  return { ok: true };
}

export async function atualizarDependente(
  colaboradorId: string,
  dependenteId: string,
  _prevState: SubRecursoState,
  formData: FormData,
): Promise<SubRecursoState> {
  const nome = formData.get("nome") as string;
  const parentesco = formData.get("parentesco") as string;
  const dataNascimento = (formData.get("data_nascimento") as string) || null;
  let sexo = (formData.get("sexo") as string) || null;

  if (!nome || !parentesco) {
    return { error: "Informe nome e parentesco." };
  }

  if (!sexo) {
    if (parentesco === "Filho" || parentesco === "Enteado") sexo = "M";
    else if (parentesco === "Filha" || parentesco === "Enteada") sexo = "F";
  }

  const supabase = await createClient();
  const { error } = await supabase
    .schema("rh")
    .from("dependentes")
    .update({ nome, parentesco, data_nascimento: dataNascimento, sexo })
    .eq("id", dependenteId);

  if (error) return { error: error.message };
  revalidarFicha(colaboradorId);
  return { ok: true };
}

export async function removerDependente(
  colaboradorId: string,
  dependenteId: string,
) {
  const supabase = await createClient();
  const { error } = await supabase
    .schema("rh")
    .from("dependentes")
    .delete()
    .eq("id", dependenteId);
  if (error) throw new Error(error.message);
  revalidarFicha(colaboradorId);
}

// ---------------------------------------------------------------------------
// Formação
// ---------------------------------------------------------------------------

export async function adicionarFormacao(
  colaboradorId: string,
  _prevState: SubRecursoState,
  formData: FormData,
): Promise<SubRecursoState> {
  const nivelId = formData.get("nivel_id") as string;
  const curso = (formData.get("curso") as string) || null;
  const instituicao = (formData.get("instituicao") as string) || null;
  const anoConclusaoRaw = formData.get("ano_conclusao") as string;
  const status = (formData.get("status") as string) || "Concluído";

  if (!nivelId) {
    return { error: "Selecione o nível de formação." };
  }

  const supabase = await createClient();
  const unidadeId = await getUnidadeIdPadrao();

  const { error } = await supabase.schema("rh").from("formacoes").insert({
    unidade_id: unidadeId,
    colaborador_id: colaboradorId,
    nivel_id: nivelId,
    curso,
    instituicao,
    ano_conclusao: anoConclusaoRaw ? Number(anoConclusaoRaw) : null,
    status,
  });

  if (error) return { error: error.message };
  revalidarFicha(colaboradorId);
  return { ok: true };
}

export async function atualizarFormacao(
  colaboradorId: string,
  formacaoId: string,
  _prevState: SubRecursoState,
  formData: FormData,
): Promise<SubRecursoState> {
  const nivelId = formData.get("nivel_id") as string;
  const curso = (formData.get("curso") as string) || null;
  const instituicao = (formData.get("instituicao") as string) || null;
  const anoConclusaoRaw = formData.get("ano_conclusao") as string;
  const status = (formData.get("status") as string) || "Concluído";

  if (!nivelId) {
    return { error: "Selecione o nível de formação." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .schema("rh")
    .from("formacoes")
    .update({
      nivel_id: nivelId,
      curso,
      instituicao,
      ano_conclusao: anoConclusaoRaw ? Number(anoConclusaoRaw) : null,
      status,
    })
    .eq("id", formacaoId);

  if (error) return { error: error.message };
  revalidarFicha(colaboradorId);
  return { ok: true };
}

export async function removerFormacao(
  colaboradorId: string,
  formacaoId: string,
) {
  const supabase = await createClient();
  const { error } = await supabase
    .schema("rh")
    .from("formacoes")
    .delete()
    .eq("id", formacaoId);
  if (error) throw new Error(error.message);
  revalidarFicha(colaboradorId);
}

// ---------------------------------------------------------------------------
// Histórico salarial
// ---------------------------------------------------------------------------

export async function adicionarHistoricoSalarial(
  colaboradorId: string,
  _prevState: SubRecursoState,
  formData: FormData,
): Promise<SubRecursoState> {
  const data = formData.get("data") as string;
  const cargoAnterior = (formData.get("cargo_anterior") as string) || null;
  const cargoNovoId = (formData.get("cargo_novo_id") as string) || "";
  const cargoNovoNome = (formData.get("cargo_novo_nome") as string) || null;
  const salarioAnteriorRaw = formData.get("salario_anterior") as string;
  const salarioNovoRaw = formData.get("salario_novo") as string;
  const motivoId = (formData.get("motivo_id") as string) || null;
  const atualizarAtual = formData.get("atualizar_atual") === "true";

  if (!data || !salarioNovoRaw) {
    return { error: "Informe a data e o novo salário." };
  }

  const salarioNovo = Number(salarioNovoRaw);
  const salarioAnterior = salarioAnteriorRaw ? Number(salarioAnteriorRaw) : null;

  const supabase = await createClient();
  const unidadeId = await getUnidadeIdPadrao();

  const { error } = await supabase
    .schema("rh")
    .from("historico_cargo_salarial")
    .insert({
      unidade_id: unidadeId,
      colaborador_id: colaboradorId,
      data,
      cargo_anterior: cargoAnterior,
      cargo_novo: cargoNovoNome,
      salario_anterior: salarioAnterior,
      salario_novo: salarioNovo,
      motivo_id: motivoId,
    });

  if (error) return { error: error.message };

  if (atualizarAtual) {
    const atualizacao: Record<string, unknown> = { salario_atual: salarioNovo };
    if (cargoNovoId) atualizacao.cargo_id = cargoNovoId;

    const { error: updError } = await supabase
      .schema("rh")
      .from("colaboradores")
      .update(atualizacao)
      .eq("id", colaboradorId);

    if (updError) return { error: updError.message };
  }

  revalidarFicha(colaboradorId);
  return { ok: true };
}

// Nunca editar/apagar um lançamento de histórico salarial: "remover" é sempre exclusão
// lógica (ativo=false), reforçado também por trigger no banco.
export async function removerHistoricoSalarial(
  colaboradorId: string,
  historicoId: string,
) {
  const supabase = await createClient();
  const { error } = await supabase
    .schema("rh")
    .from("historico_cargo_salarial")
    .update({ ativo: false })
    .eq("id", historicoId);
  if (error) throw new Error(error.message);
  revalidarFicha(colaboradorId);
}

// ---------------------------------------------------------------------------
// ASO
// ---------------------------------------------------------------------------

export async function adicionarAso(
  colaboradorId: string,
  _prevState: SubRecursoState,
  formData: FormData,
): Promise<SubRecursoState> {
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
  revalidarFicha(colaboradorId);
  return { ok: true };
}

export async function atualizarAso(
  colaboradorId: string,
  asoId: string,
  _prevState: SubRecursoState,
  formData: FormData,
): Promise<SubRecursoState> {
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
  revalidarFicha(colaboradorId);
  return { ok: true };
}

export async function removerAso(colaboradorId: string, asoId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .schema("rh")
    .from("aso_registros")
    .delete()
    .eq("id", asoId);
  if (error) throw new Error(error.message);
  revalidarFicha(colaboradorId);
}

// ---------------------------------------------------------------------------
// Exames complementares
// ---------------------------------------------------------------------------

export async function adicionarExameComplementar(
  colaboradorId: string,
  _prevState: SubRecursoState,
  formData: FormData,
): Promise<SubRecursoState> {
  const exameId = formData.get("exame_id") as string;
  const data = formData.get("data") as string;
  const periodicidadeRaw = formData.get("periodicidade_meses") as string;

  if (!exameId || !data) {
    return { error: "Selecione o exame e a data." };
  }

  const periodicidadeMeses = periodicidadeRaw ? Number(periodicidadeRaw) : null;
  const dataVencimento = periodicidadeMeses
    ? somarMeses(data, periodicidadeMeses)
    : null;

  const supabase = await createClient();
  const unidadeId = await getUnidadeIdPadrao();

  const { error } = await supabase
    .schema("rh")
    .from("exames_complementares_registros")
    .insert({
      unidade_id: unidadeId,
      colaborador_id: colaboradorId,
      exame_id: exameId,
      data,
      data_vencimento: dataVencimento,
    });

  if (error) return { error: error.message };
  revalidarFicha(colaboradorId);
  return { ok: true };
}

export async function atualizarExameComplementar(
  colaboradorId: string,
  exameRegistroId: string,
  _prevState: SubRecursoState,
  formData: FormData,
): Promise<SubRecursoState> {
  const exameId = formData.get("exame_id") as string;
  const data = formData.get("data") as string;
  const periodicidadeRaw = formData.get("periodicidade_meses") as string;

  if (!exameId || !data) {
    return { error: "Selecione o exame e a data." };
  }

  const periodicidadeMeses = periodicidadeRaw ? Number(periodicidadeRaw) : null;
  const dataVencimento = periodicidadeMeses ? somarMeses(data, periodicidadeMeses) : null;

  const supabase = await createClient();
  const { error } = await supabase
    .schema("rh")
    .from("exames_complementares_registros")
    .update({ exame_id: exameId, data, data_vencimento: dataVencimento })
    .eq("id", exameRegistroId);

  if (error) return { error: error.message };
  revalidarFicha(colaboradorId);
  return { ok: true };
}

export async function removerExameComplementar(
  colaboradorId: string,
  exameRegistroId: string,
) {
  const supabase = await createClient();
  const { error } = await supabase
    .schema("rh")
    .from("exames_complementares_registros")
    .delete()
    .eq("id", exameRegistroId);
  if (error) throw new Error(error.message);
  revalidarFicha(colaboradorId);
}
