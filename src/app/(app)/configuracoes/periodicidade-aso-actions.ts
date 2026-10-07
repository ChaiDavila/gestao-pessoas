"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getUnidadeIdPadrao } from "@/lib/data/unidades";
import { exigirOperador } from "@/lib/auth";

export type PeriodicidadeAsoFormState = { error: string } | { ok: true } | undefined;

function revalidar() {
  revalidatePath("/configuracoes");
}

// ASO periódico é obrigatório pra todo mundo — só a frequência muda por função. Sem linha
// aqui, o vencimento continua sendo digitado manualmente (como sempre foi).
export async function definirPeriodicidadeAso(
  cargoId: string,
  _prevState: PeriodicidadeAsoFormState,
  formData: FormData,
): Promise<PeriodicidadeAsoFormState> {
  try {
    await exigirOperador();
  } catch (e) {
    return { error: (e as Error).message };
  }

  const periodicidadeRaw = formData.get("periodicidade_meses") as string;
  const periodicidadeMeses = Number(periodicidadeRaw);

  if (!periodicidadeRaw || !Number.isFinite(periodicidadeMeses) || periodicidadeMeses <= 0) {
    return { error: "Informe uma periodicidade válida (em meses)." };
  }

  const supabase = await createClient();
  const unidadeId = await getUnidadeIdPadrao();

  const { error } = await supabase
    .schema("rh")
    .from("config_periodicidade_aso_por_funcao")
    .upsert(
      {
        unidade_id: unidadeId,
        cargo_id: cargoId,
        periodicidade_meses: periodicidadeMeses,
        ativo: true,
      },
      { onConflict: "cargo_id" },
    );

  if (error) return { error: error.message };
  revalidar();
  return { ok: true };
}

export async function removerPeriodicidadeAso(cargoId: string) {
  await exigirOperador();
  const supabase = await createClient();
  const { error } = await supabase
    .schema("rh")
    .from("config_periodicidade_aso_por_funcao")
    .update({ ativo: false })
    .eq("cargo_id", cargoId);
  if (error) throw new Error(error.message);
  revalidar();
}
