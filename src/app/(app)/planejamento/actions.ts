"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getUnidadeIdPadrao } from "@/lib/data/unidades";
import { exigirAdmin } from "@/lib/auth";
import { MAX_DIAS_PONTUAL, diferencaDias, moverParaAno, somarDias } from "@/lib/planejamento";

export type AcaoFormState = { error: string } | { ok: true; id: string } | undefined;

const dataISO = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida.");

const tarefaSchema = z.object({
  id: z.string().uuid().optional(),
  descricao: z.string().trim().min(1, "Toda tarefa precisa de uma descrição.").max(200),
  prazo: dataISO.nullable(),
  concluida: z.boolean(),
});

const despesaSchema = z.object({
  id: z.string().uuid().optional(),
  data: dataISO,
  descricao: z.string().trim().min(1, "Toda despesa precisa de uma descrição.").max(200),
  valor: z.number().positive("O valor da despesa precisa ser maior que zero."),
});

const acaoSchema = z
  .object({
    titulo: z.string().trim().min(1, "Informe o nome da ação.").max(150),
    descricao: z.string().trim().nullable(),
    categoria_id: z.string().uuid("Selecione a categoria."),
    tipo: z.enum(["pontual", "periodo", "verba"]),
    data_inicio: dataISO,
    data_fim: dataISO.nullable(),
    status: z.enum(["planejada", "em_andamento", "concluida", "cancelada"]),
    orcamento_previsto: z.number().min(0).nullable(),
    observacoes: z.string().trim().nullable(),
    tarefas: z.array(tarefaSchema),
    despesas: z.array(despesaSchema),
  })
  .superRefine((v, ctx) => {
    if (v.tipo === "pontual" && v.data_fim) {
      const dias =
        (new Date(v.data_fim + "T00:00:00").getTime() - new Date(v.data_inicio + "T00:00:00").getTime()) / 86400000;
      if (dias < 1) {
        ctx.addIssue({ code: "custom", message: "O último dia do evento precisa ser depois do primeiro." });
      } else if (dias + 1 > MAX_DIAS_PONTUAL) {
        ctx.addIssue({
          code: "custom",
          message: `Uma ação pontual pode durar no máximo ${MAX_DIAS_PONTUAL} dias. Para algo mais longo, use "Atividade com período".`,
        });
      }
    }
    if (v.tipo === "periodo" && !v.data_fim) {
      ctx.addIssue({ code: "custom", message: "Informe a data de término da atividade." });
    }
    if (v.tipo === "periodo" && v.data_fim && v.data_fim < v.data_inicio) {
      ctx.addIssue({
        code: "custom",
        message: "A data de término não pode ser anterior à data de início.",
      });
    }
  });

function texto(formData: FormData, campo: string) {
  const v = String(formData.get(campo) ?? "").trim();
  return v === "" ? null : v;
}

function numeroOuNulo(formData: FormData, campo: string) {
  const v = texto(formData, campo);
  if (v === null) return null;
  const n = Number(v.replace(",", "."));
  return Number.isFinite(n) ? n : NaN;
}

function revalidar() {
  revalidatePath("/planejamento");
}

// Sincroniza uma lista filha (tarefas ou despesas) com o que veio do formulário: atualiza
// as que têm id, cria as novas e marca ativo=false nas que foram retiradas.
async function sincronizarFilhos(
  tabela: "planejamento_tarefas" | "planejamento_despesas",
  acaoId: string,
  unidadeId: string,
  itens: ({ id?: string } & Record<string, unknown>)[],
) {
  const supabase = await createClient();
  const { data: existentes, error } = await supabase
    .schema("rh")
    .from(tabela)
    .select("id")
    .eq("acao_id", acaoId)
    .eq("ativo", true);
  if (error) throw new Error(error.message);

  const idsMantidos = new Set(itens.filter((i) => i.id).map((i) => i.id as string));
  const removidos = (existentes ?? []).map((e) => e.id as string).filter((id) => !idsMantidos.has(id));
  if (removidos.length) {
    const { error: e } = await supabase.schema("rh").from(tabela).update({ ativo: false }).in("id", removidos);
    if (e) throw new Error(e.message);
  }

  for (const item of itens) {
    const { id, ...valores } = item;
    if (id) {
      const { error: e } = await supabase
        .schema("rh")
        .from(tabela)
        .update(valores)
        .eq("id", id)
        .eq("acao_id", acaoId);
      if (e) throw new Error(e.message);
    } else {
      const { error: e } = await supabase
        .schema("rh")
        .from(tabela)
        .insert({ ...valores, acao_id: acaoId, unidade_id: unidadeId });
      if (e) throw new Error(e.message);
    }
  }
}

export async function salvarAcao(
  acaoId: string | null,
  _prev: AcaoFormState,
  formData: FormData,
): Promise<AcaoFormState> {
  try {
    await exigirAdmin();
  } catch (e) {
    return { error: (e as Error).message };
  }

  let tarefasBrutas: unknown;
  let despesasBrutas: unknown;
  try {
    tarefasBrutas = JSON.parse(String(formData.get("tarefas") ?? "[]"));
    despesasBrutas = JSON.parse(String(formData.get("despesas") ?? "[]"));
  } catch {
    return { error: "Não foi possível ler o checklist ou as despesas." };
  }

  const tipo = texto(formData, "tipo");

  // Verba anual: só o ano é informado; as datas viram 01/01 a 31/12, sem checklist e com
  // status fixo (não é um evento a executar).
  let dataInicio = texto(formData, "data_inicio") ?? "";
  let dataFim =
    tipo === "periodo" || (tipo === "pontual" && formData.get("varios_dias") === "on")
      ? texto(formData, "data_fim")
      : null;
  if (tipo === "verba") {
    const ano = Number(texto(formData, "ano"));
    if (!Number.isInteger(ano) || ano < 2000 || ano > 2100) {
      return { error: "Informe o ano da verba." };
    }
    dataInicio = `${ano}-01-01`;
    dataFim = `${ano}-12-31`;
    tarefasBrutas = [];
  }

  const parsed = acaoSchema.safeParse({
    titulo: texto(formData, "titulo") ?? "",
    descricao: texto(formData, "descricao"),
    categoria_id: texto(formData, "categoria_id") ?? "",
    tipo,
    data_inicio: dataInicio,
    data_fim: dataFim,
    status: tipo === "verba" ? "planejada" : texto(formData, "status"),
    orcamento_previsto: numeroOuNulo(formData, "orcamento_previsto"),
    observacoes: texto(formData, "observacoes"),
    tarefas: tarefasBrutas,
    despesas: despesasBrutas,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const { tarefas, despesas, ...acao } = parsed.data;
  const supabase = await createClient();
  const unidadeId = await getUnidadeIdPadrao();

  try {
    let id = acaoId;
    if (id) {
      const { error } = await supabase.schema("rh").from("planejamento_acoes").update(acao).eq("id", id);
      if (error) throw new Error(error.message);
    } else {
      const { data, error } = await supabase
        .schema("rh")
        .from("planejamento_acoes")
        .insert({ ...acao, unidade_id: unidadeId })
        .select("id")
        .single();
      if (error) throw new Error(error.message);
      id = data.id as string;
    }

    await sincronizarFilhos(
      "planejamento_tarefas",
      id,
      unidadeId,
      tarefas.map((t, i) => ({ ...t, ordem: i })),
    );
    await sincronizarFilhos("planejamento_despesas", id, unidadeId, despesas);

    revalidar();
    return { ok: true, id };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

// Exclusão lógica (padrão do sistema): a ação some de todas as visões, mas fica no banco.
export async function excluirAcao(acaoId: string) {
  await exigirAdmin();
  const supabase = await createClient();
  const { error } = await supabase
    .schema("rh")
    .from("planejamento_acoes")
    .update({ ativo: false })
    .eq("id", acaoId);
  if (error) throw new Error(error.message);
  revalidar();
}

export async function alternarTarefa(tarefaId: string, concluida: boolean) {
  await exigirAdmin();
  const supabase = await createClient();
  const { error } = await supabase
    .schema("rh")
    .from("planejamento_tarefas")
    .update({ concluida })
    .eq("id", tarefaId);
  if (error) throw new Error(error.message);
  revalidar();
}

// Copia a ação e o checklist (sem despesas) para a nova data de início escolhida (mesmo ano
// ou outro). Todas as datas (término, último dia do evento, prazos do checklist) andam a
// mesma quantidade de dias, preservando duração e antecedência das tarefas. Verba anual é
// exceção: só o ano da data escolhida importa (as datas dela são sempre 01/01 a 31/12).
// A cópia nasce "Planejada" e com todas as tarefas pendentes.
export async function duplicarAcao(
  acaoId: string,
  novaDataInicio: string,
): Promise<{ error: string } | { ok: true; id: string }> {
  try {
    await exigirAdmin();
  } catch (e) {
    return { error: (e as Error).message };
  }
  const anoDestino = Number(novaDataInicio.slice(0, 4));
  if (!/^\d{4}-\d{2}-\d{2}$/.test(novaDataInicio) || anoDestino < 2000 || anoDestino > 2100) {
    return { error: "Escolha uma data válida para a cópia." };
  }

  const supabase = await createClient();
  const unidadeId = await getUnidadeIdPadrao();

  const { data: acao, error } = await supabase
    .schema("rh")
    .from("planejamento_acoes")
    .select("titulo, descricao, categoria_id, tipo, data_inicio, data_fim, orcamento_previsto, observacoes")
    .eq("id", acaoId)
    .single();
  if (error) return { error: error.message };

  let mover: (d: string | null) => string | null;
  if (acao.tipo === "verba") {
    const deltaAnos = anoDestino - Number(String(acao.data_inicio).slice(0, 4));
    mover = (d) => (d ? moverParaAno(d, Number(d.slice(0, 4)) + deltaAnos) : null);
  } else {
    const deltaDias = diferencaDias(acao.data_inicio, novaDataInicio);
    mover = (d) => (d ? somarDias(d, deltaDias) : null);
  }

  const { data: nova, error: e1 } = await supabase
    .schema("rh")
    .from("planejamento_acoes")
    .insert({
      ...acao,
      data_inicio: mover(acao.data_inicio),
      data_fim: mover(acao.data_fim),
      status: "planejada",
      unidade_id: unidadeId,
    })
    .select("id")
    .single();
  if (e1) return { error: e1.message };

  const { data: tarefas, error: e2 } = await supabase
    .schema("rh")
    .from("planejamento_tarefas")
    .select("descricao, prazo, ordem")
    .eq("acao_id", acaoId)
    .eq("ativo", true);
  if (e2) return { error: e2.message };

  if (tarefas?.length) {
    const { error: e3 } = await supabase
      .schema("rh")
      .from("planejamento_tarefas")
      .insert(
        tarefas.map((t) => ({
          ...t,
          prazo: mover(t.prazo),
          concluida: false,
          acao_id: nova.id,
          unidade_id: unidadeId,
        })),
      );
    if (e3) return { error: e3.message };
  }

  revalidar();
  return { ok: true, id: nova.id as string };
}
