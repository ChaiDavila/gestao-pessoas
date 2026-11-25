"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getUnidadeIdPadrao } from "@/lib/data/unidades";
import { exigirAdmin, exigirOperador } from "@/lib/auth";
import { somarMeses } from "@/lib/date";

export type CatalogoFormState = { error: string } | { ok: true; mensagem?: string } | undefined;

// Catálogos cuja periodicidade gera vencimento gravado nos registros. Mudar a periodicidade
// não altera sozinho o que já foi registrado; o formulário pergunta se deve recalcular.
const RECALCULO_VENCIMENTO: Record<string, { tabela: string; coluna: string; rotulo: string }> = {
  config_nrs_catalogo: { tabela: "treinamentos", coluna: "nr_numero", rotulo: "treinamento(s)" },
  config_tipos_exame: { tabela: "exames_complementares_registros", coluna: "exame_id", rotulo: "exame(s)" },
};

// Recalcula data + nova periodicidade nos registros ativos daquele item. Só mexe nos
// vencimentos que seguiam o cálculo automático com a periodicidade antiga (data + antiga,
// ou vazio quando não havia periodicidade): vencimento ajustado à mão fica como está.
async function recalcularVencimentos(
  tabelaCatalogo: string,
  itemId: string,
  periodicidadeAntiga: number | null,
  periodicidadeNova: number | null,
) {
  const alvo = RECALCULO_VENCIMENTO[tabelaCatalogo];
  const supabase = await createClient();
  const { data: registros, error } = await supabase
    .schema("rh")
    .from(alvo.tabela)
    .select("id, data, data_vencimento")
    .eq(alvo.coluna, itemId)
    .eq("ativo", true);
  if (error) throw new Error(error.message);

  let recalculados = 0;
  let mantidos = 0;
  for (const r of registros ?? []) {
    const esperadoAntigo = periodicidadeAntiga ? somarMeses(r.data, periodicidadeAntiga) : null;
    if ((r.data_vencimento ?? null) !== esperadoAntigo) {
      mantidos++;
      continue;
    }
    const novo = periodicidadeNova ? somarMeses(r.data, periodicidadeNova) : null;
    const { error: e } = await supabase
      .schema("rh")
      .from(alvo.tabela)
      .update({ data_vencimento: novo })
      .eq("id", r.id);
    if (e) throw new Error(e.message);
    recalculados++;
  }

  let mensagem = `${recalculados} ${alvo.rotulo} com o vencimento recalculado.`;
  if (mantidos) mensagem += ` ${mantidos} mantido(s) porque o vencimento tinha sido ajustado à mão.`;
  return mensagem;
}

// Catálogos do Planejamento de Gente são só de admin (igual às políticas RLS da tabela);
// os demais seguem a regra geral de operador+.
const CATALOGOS_SO_ADMIN = new Set(["config_categorias_planejamento"]);

async function exigirPermissaoCatalogo(tabela: string) {
  if (CATALOGOS_SO_ADMIN.has(tabela)) return exigirAdmin();
  return exigirOperador();
}

function revalidar() {
  revalidatePath("/configuracoes");
  revalidatePath("/planejamento");
}

export async function criarItemCatalogo(
  tabela: string,
  campos: string[],
  _prevState: CatalogoFormState,
  formData: FormData,
): Promise<CatalogoFormState> {
  try {
    await exigirPermissaoCatalogo(tabela);
  } catch (e) {
    return { error: (e as Error).message };
  }

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
  try {
    await exigirPermissaoCatalogo(tabela);
  } catch (e) {
    return { error: (e as Error).message };
  }

  const supabase = await createClient();

  const valores: Record<string, unknown> = {};
  for (const campo of campos) {
    const valor = formData.get(campo);
    valores[campo] = valor === "" ? null : valor;
  }

  // Periodicidade antes da alteração, para saber quais vencimentos eram automáticos.
  const comVencimento = tabela in RECALCULO_VENCIMENTO && campos.includes("periodicidade_meses");
  let periodicidadeAntiga: number | null = null;
  if (comVencimento) {
    const { data: atual, error: e } = await supabase
      .schema("rh")
      .from(tabela)
      .select("periodicidade_meses")
      .eq("id", id)
      .single();
    if (e) return { error: e.message };
    periodicidadeAntiga = atual.periodicidade_meses ?? null;
  }

  const { error } = await supabase.schema("rh").from(tabela).update(valores).eq("id", id);
  if (error) return { error: error.message };

  let mensagem: string | undefined;
  const periodicidadeNova = valores.periodicidade_meses == null ? null : Number(valores.periodicidade_meses);
  if (comVencimento && formData.get("recalcular") === "sim" && periodicidadeNova !== periodicidadeAntiga) {
    try {
      mensagem = await recalcularVencimentos(tabela, id, periodicidadeAntiga, periodicidadeNova);
    } catch (e) {
      revalidar();
      return { error: `Periodicidade salva, mas o recálculo falhou: ${(e as Error).message}` };
    }
    revalidatePath("/treinamentos");
    revalidatePath("/aso");
    revalidatePath("/colaboradores", "layout");
  }

  revalidar();
  return { ok: true, mensagem };
}

// "Remover" nunca apaga uso já feito: some da lista de sugestão via ativo=false.
export async function removerItemCatalogo(tabela: string, id: string) {
  await exigirPermissaoCatalogo(tabela);
  const supabase = await createClient();
  const { error } = await supabase.schema("rh").from(tabela).update({ ativo: false }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidar();
}
