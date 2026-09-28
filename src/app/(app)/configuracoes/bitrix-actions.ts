"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getUsuarioAtual } from "@/lib/auth";
import { BITRIX_USUARIOS } from "@/lib/constants/bitrix-usuarios";

export type BitrixFormState = { error: string } | { ok: true } | undefined;

async function exigirOperador() {
  const atual = await getUsuarioAtual();
  if (!atual || atual.papel === "leitor" || !atual.papel) {
    throw new Error("Você não tem permissão para alterar essas regras.");
  }
}

function nomeDoUsuarioBitrix(id: number) {
  return BITRIX_USUARIOS.find((u) => u.id === id)?.nome ?? `Usuário ${id}`;
}

export async function criarRegraBitrix(
  _prevState: BitrixFormState,
  formData: FormData,
): Promise<BitrixFormState> {
  try {
    await exigirOperador();
  } catch (e) {
    return { error: (e as Error).message };
  }

  const tipoEvento = formData.get("tipo_evento") as string;
  const diasAntecedencia = Number(formData.get("dias_antecedencia"));
  const responsavelId = Number(formData.get("responsavel_bitrix_id"));
  const corresponsaveisIds = formData
    .getAll("corresponsaveis_bitrix_ids")
    .map((v) => Number(v))
    .filter((n) => !Number.isNaN(n));
  const tituloTemplate = (formData.get("titulo_template") as string)?.trim();
  const descricaoTemplate = (formData.get("descricao_template") as string)?.trim() || null;

  if (!tipoEvento || !responsavelId || !tituloTemplate) {
    return { error: "Preencha tipo de evento, responsável e título." };
  }
  if (Number.isNaN(diasAntecedencia) || diasAntecedencia < 0) {
    return { error: "Dias de antecedência inválido." };
  }

  const supabase = await createClient();
  const { error } = await supabase.schema("rh").from("config_bitrix_regras").insert({
    tipo_evento: tipoEvento,
    dias_antecedencia: diasAntecedencia,
    responsavel_bitrix_id: responsavelId,
    responsavel_bitrix_nome: nomeDoUsuarioBitrix(responsavelId),
    corresponsaveis_bitrix_ids: corresponsaveisIds.length ? corresponsaveisIds : null,
    corresponsaveis_bitrix_nomes: corresponsaveisIds.length
      ? corresponsaveisIds.map(nomeDoUsuarioBitrix)
      : null,
    titulo_template: tituloTemplate,
    descricao_template: descricaoTemplate,
  });

  if (error) return { error: error.message };

  revalidatePath("/configuracoes");
  return { ok: true };
}

// Único jeito de "desligar" uma regra é este toggle — desativada, ela só some da rotina
// diária (não cria mais tarefa), sem apagar o histórico de configuração/log já gerado.
export async function atualizarRegraBitrixAtiva(id: string, ativo: boolean) {
  await exigirOperador();

  const supabase = await createClient();
  const { error } = await supabase
    .schema("rh")
    .from("config_bitrix_regras")
    .update({ ativo })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/configuracoes");
}
