"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getUnidadeIdPadrao } from "@/lib/data/unidades";
import { FORCAS_CONTINUUM } from "@/lib/perfil-comportamental";
import type { SubRecursoState } from "./sub-recursos-actions";

const CAMPOS_FORCA = FORCAS_CONTINUUM.flatMap((c) => [c.esquerda.chave, c.direita.chave]);
const CAMPOS_DISC = ["disc_d", "disc_i", "disc_s", "disc_c"] as const;

function numeroEntre0e100(formData: FormData, campo: string): number | null {
  const bruto = formData.get(campo) as string;
  if (bruto === null || bruto === "") return null;
  const valor = Number(bruto);
  if (Number.isNaN(valor) || valor < 0 || valor > 100) return null;
  return valor;
}

// Um registro por colaborador (ver migration): salvar sempre faz upsert, substituindo a
// avaliação anterior se já existir uma — não guardamos histórico de reavaliações nesta
// primeira versão.
export async function salvarPerfilComportamental(
  colaboradorId: string,
  _prevState: SubRecursoState,
  formData: FormData,
): Promise<SubRecursoState> {
  const dataAvaliacao = (formData.get("data_avaliacao") as string) || null;

  const valores: Record<string, number> = {};
  for (const campo of [...CAMPOS_DISC, ...CAMPOS_FORCA]) {
    const valor = numeroEntre0e100(formData, campo);
    if (valor === null) {
      return { error: "Preencha todos os campos com um número entre 0 e 100." };
    }
    valores[campo] = valor;
  }

  const supabase = await createClient();
  const unidadeId = await getUnidadeIdPadrao();

  const { error } = await supabase
    .schema("rh")
    .from("perfil_comportamental")
    .upsert(
      {
        unidade_id: unidadeId,
        colaborador_id: colaboradorId,
        data_avaliacao: dataAvaliacao,
        ativo: true, // reativa se um registro anterior tinha sido removido (ativo=false)
        ...valores,
      },
      { onConflict: "colaborador_id" },
    );

  if (error) return { error: error.message };

  revalidatePath(`/colaboradores/${colaboradorId}`);
  revalidatePath("/colaboradores");
  return { ok: true };
}

// Registra a ordem de desempate manual só para as forças empatadas de um grupo (ver
// gruposEmpatadosSemResolucao) — mescla com qualquer desempate já salvo para outros
// grupos, sem apagar o que já estava resolvido.
export async function resolverEmpateForcas(colaboradorId: string, ordem: string[]) {
  const supabase = await createClient();

  const { data: atual, error: erroLeitura } = await supabase
    .schema("rh")
    .from("perfil_comportamental")
    .select("desempate_forcas")
    .eq("colaborador_id", colaboradorId)
    .maybeSingle();
  if (erroLeitura) throw new Error(erroLeitura.message);

  const existente: string[] = atual?.desempate_forcas ?? [];
  const resto = existente.filter((chave) => !ordem.includes(chave));
  const novoDesempate = [...resto, ...ordem];

  const { error } = await supabase
    .schema("rh")
    .from("perfil_comportamental")
    .update({ desempate_forcas: novoDesempate })
    .eq("colaborador_id", colaboradorId);
  if (error) throw new Error(error.message);

  revalidatePath(`/colaboradores/${colaboradorId}`);
}

export async function removerPerfilComportamental(colaboradorId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .schema("rh")
    .from("perfil_comportamental")
    .update({ ativo: false })
    .eq("colaborador_id", colaboradorId);

  if (error) throw new Error(error.message);
  revalidatePath(`/colaboradores/${colaboradorId}`);
  revalidatePath("/colaboradores");
}
