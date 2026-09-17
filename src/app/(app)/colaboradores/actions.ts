"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { colaboradorSchema } from "@/lib/validations/colaborador";
import { getUnidadeIdPadrao } from "@/lib/data/unidades";

export type FormState = { error: string } | { ok: true } | undefined;

function parseColaboradorForm(formData: FormData) {
  return colaboradorSchema.safeParse(Object.fromEntries(formData));
}

function colaboradorCamposRh(dados: ReturnType<typeof colaboradorSchema.parse>) {
  return {
    matricula: dados.matricula,
    rg: dados.rg ?? null,
    pis_pasep: dados.pis_pasep ?? null,
    sexo: dados.sexo ?? null,
    estado_civil: dados.estado_civil,
    conjuge_nome: dados.conjuge_nome ?? null,
    conjuge_sexo: dados.conjuge_sexo ?? null,
    email_pessoal: dados.email_pessoal ?? null,
    telefone_pessoal: dados.telefone_pessoal ?? null,
    numero_corporativo: dados.numero_corporativo ?? null,
    endereco_rua: dados.endereco_rua ?? null,
    endereco_numero: dados.endereco_numero ?? null,
    endereco_complemento: dados.endereco_complemento ?? null,
    endereco_bairro: dados.endereco_bairro ?? null,
    endereco_cidade: dados.endereco_cidade ?? null,
    endereco_estado: dados.endereco_estado ?? null,
    endereco_cep: dados.endereco_cep ?? null,
    contato_emergencia_nome: dados.contato_emergencia_nome ?? null,
    contato_emergencia_telefone: dados.contato_emergencia_telefone ?? null,
    cargo_id: dados.cargo_id ?? null,
    cbo: dados.cbo ?? null,
    setor_id: dados.setor_id ?? null,
    nivel_id: dados.nivel_id ?? null,
    eixo_id: dados.eixo_id ?? null,
    gestor_colaborador_id: dados.gestor_colaborador_id ?? null,
    data_admissao: dados.data_admissao,
    tipo_contrato: dados.tipo_contrato,
    regime_trabalho: dados.regime_trabalho,
    salario_atual: dados.salario_atual ?? null,
    salario_admissional: dados.salario_admissional ?? null,
  };
}

export async function criarColaborador(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = parseColaboradorForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }
  const dados = parsed.data;
  const supabase = await createClient();
  const unidadeId = await getUnidadeIdPadrao();

  const { data: pessoa, error: pessoaError } = await supabase
    .schema("core")
    .from("pessoas")
    .insert({
      unidade_id: unidadeId,
      nome: dados.nome,
      cpf: dados.cpf ?? null,
      data_nascimento: dados.data_nascimento ?? null,
    })
    .select("id")
    .single();

  if (pessoaError || !pessoa) {
    return { error: pessoaError?.message ?? "Erro ao criar pessoa." };
  }

  const { data: colaborador, error: colaboradorError } = await supabase
    .schema("rh")
    .from("colaboradores")
    .insert({ unidade_id: unidadeId, pessoa_id: pessoa.id, ...colaboradorCamposRh(dados) })
    .select("id")
    .single();

  if (colaboradorError || !colaborador) {
    // Sem transação cross-schema via PostgREST: desfaz a pessoa criada manualmente.
    await supabase.schema("core").from("pessoas").delete().eq("id", pessoa.id);
    return {
      error: colaboradorError?.message ?? "Erro ao criar colaborador.",
    };
  }

  revalidatePath("/colaboradores");
  redirect(`/colaboradores/${colaborador.id}`);
}

export async function atualizarColaborador(
  colaboradorId: string,
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = parseColaboradorForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }
  const dados = parsed.data;
  const supabase = await createClient();

  const { data: existente, error: existenteError } = await supabase
    .schema("rh")
    .from("colaboradores")
    .select("pessoa_id")
    .eq("id", colaboradorId)
    .single();

  if (existenteError || !existente) {
    return { error: "Colaborador não encontrado." };
  }

  const { error: pessoaError } = await supabase
    .schema("core")
    .from("pessoas")
    .update({
      nome: dados.nome,
      cpf: dados.cpf ?? null,
      data_nascimento: dados.data_nascimento ?? null,
    })
    .eq("id", existente.pessoa_id);

  if (pessoaError) {
    return { error: pessoaError.message };
  }

  const { error: colaboradorError } = await supabase
    .schema("rh")
    .from("colaboradores")
    .update(colaboradorCamposRh(dados))
    .eq("id", colaboradorId);

  if (colaboradorError) {
    return { error: colaboradorError.message };
  }

  revalidatePath("/colaboradores");
  revalidatePath(`/colaboradores/${colaboradorId}`);
  return { ok: true };
}

export async function excluirColaborador(colaboradorId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .schema("rh")
    .from("colaboradores")
    .delete()
    .eq("id", colaboradorId);

  if (error) throw new Error(error.message);

  revalidatePath("/colaboradores");
  redirect("/colaboradores");
}

export type DesligamentoState = { error: string } | { ok: true } | undefined;

export async function desativarColaborador(
  colaboradorId: string,
  _prevState: DesligamentoState,
  formData: FormData,
): Promise<DesligamentoState> {
  const data = formData.get("data");
  const tipo = formData.get("tipo");
  const motivoId = formData.get("motivo_id");
  const descricao = formData.get("descricao");

  if (!data || !tipo) {
    return { error: "Informe a data e o tipo do desligamento." };
  }

  const supabase = await createClient();
  const unidadeId = await getUnidadeIdPadrao();

  const { error } = await supabase.schema("rh").from("desligamentos").insert({
    unidade_id: unidadeId,
    colaborador_id: colaboradorId,
    data,
    tipo,
    motivo_id: motivoId || null,
    descricao: descricao || null,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/colaboradores");
  revalidatePath(`/colaboradores/${colaboradorId}`);
  return { ok: true };
}

export async function reativarColaborador(colaboradorId: string) {
  const supabase = await createClient();

  const { data: desligamento, error: buscaError } = await supabase
    .schema("rh")
    .from("desligamentos")
    .select("id")
    .eq("colaborador_id", colaboradorId)
    .is("data_reativacao", null)
    .order("data", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (buscaError) throw new Error(buscaError.message);
  if (!desligamento) throw new Error("Nenhum desligamento vigente encontrado.");

  const { error } = await supabase
    .schema("rh")
    .from("desligamentos")
    .update({ data_reativacao: new Date().toISOString().slice(0, 10) })
    .eq("id", desligamento.id);

  if (error) throw new Error(error.message);

  revalidatePath("/colaboradores");
  revalidatePath(`/colaboradores/${colaboradorId}`);
}
