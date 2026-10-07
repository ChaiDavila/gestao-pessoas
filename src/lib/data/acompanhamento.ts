import type { createClient } from "@/lib/supabase/server";

type Supabase = Awaited<ReturnType<typeof createClient>>;

// Semeia (cria, se ainda não existir) acompanhamento=true pras NRs/exames que a função do
// colaborador exige — nunca desliga nem sobrescreve uma escolha já existente (ver migration
// rh_acompanhamento_nr_pgr). Chamado em 3 momentos: colaborador criado/com função definida,
// função do colaborador alterada, e matriz da função ganhando uma exigência nova.

export async function seedAcompanhamentoNrPorFuncao(
  supabase: Supabase,
  unidadeId: string,
  colaboradorId: string,
  cargoId: string | null,
) {
  if (!cargoId) return;

  const { data: exigidas } = await supabase
    .schema("rh")
    .from("config_nrs_por_funcao")
    .select("nr_catalogo_id")
    .eq("cargo_id", cargoId)
    .eq("ativo", true);

  if (!exigidas || exigidas.length === 0) return;

  const { data: existentes } = await supabase
    .schema("rh")
    .from("colaborador_nr_acompanhamento")
    .select("nr_catalogo_id")
    .eq("colaborador_id", colaboradorId);

  const jaTem = new Set((existentes ?? []).map((e) => e.nr_catalogo_id as string));
  const novos = exigidas
    .filter((e) => !jaTem.has(e.nr_catalogo_id as string))
    .map((e) => ({
      unidade_id: unidadeId,
      colaborador_id: colaboradorId,
      nr_catalogo_id: e.nr_catalogo_id as string,
      acompanhar: true,
    }));

  if (novos.length > 0) {
    const { error } = await supabase.schema("rh").from("colaborador_nr_acompanhamento").insert(novos);
    if (error) console.error("seedAcompanhamentoNrPorFuncao:", error.message);
  }
}

export async function seedAcompanhamentoExamePorFuncao(
  supabase: Supabase,
  unidadeId: string,
  colaboradorId: string,
  cargoId: string | null,
) {
  if (!cargoId) return;

  const { data: exigidos } = await supabase
    .schema("rh")
    .from("config_exames_por_funcao")
    .select("exame_id")
    .eq("cargo_id", cargoId)
    .eq("ativo", true);

  if (!exigidos || exigidos.length === 0) return;

  const { data: existentes } = await supabase
    .schema("rh")
    .from("colaborador_exame_acompanhamento")
    .select("exame_id")
    .eq("colaborador_id", colaboradorId);

  const jaTem = new Set((existentes ?? []).map((e) => e.exame_id as string));
  const novos = exigidos
    .filter((e) => !jaTem.has(e.exame_id as string))
    .map((e) => ({
      unidade_id: unidadeId,
      colaborador_id: colaboradorId,
      exame_id: e.exame_id as string,
      acompanhar: true,
    }));

  if (novos.length > 0) {
    const { error } = await supabase.schema("rh").from("colaborador_exame_acompanhamento").insert(novos);
    if (error) console.error("seedAcompanhamentoExamePorFuncao:", error.message);
  }
}

// Usado quando a matriz da função ganha uma NR/exame novo (Configurações): semeia pra todo
// mundo que já está naquela função hoje.
export async function seedAcompanhamentoNrParaFuncao(
  supabase: Supabase,
  unidadeId: string,
  cargoId: string,
  nrCatalogoId: string,
) {
  const { data: colaboradores } = await supabase
    .schema("rh")
    .from("colaboradores")
    .select("id")
    .eq("cargo_id", cargoId);

  if (!colaboradores || colaboradores.length === 0) return;

  const { data: existentes } = await supabase
    .schema("rh")
    .from("colaborador_nr_acompanhamento")
    .select("colaborador_id")
    .eq("nr_catalogo_id", nrCatalogoId)
    .in(
      "colaborador_id",
      colaboradores.map((c) => c.id as string),
    );

  const jaTem = new Set((existentes ?? []).map((e) => e.colaborador_id as string));
  const novos = colaboradores
    .filter((c) => !jaTem.has(c.id as string))
    .map((c) => ({
      unidade_id: unidadeId,
      colaborador_id: c.id as string,
      nr_catalogo_id: nrCatalogoId,
      acompanhar: true,
    }));

  if (novos.length > 0) {
    const { error } = await supabase.schema("rh").from("colaborador_nr_acompanhamento").insert(novos);
    if (error) console.error("seedAcompanhamentoNrParaFuncao:", error.message);
  }
}

export async function seedAcompanhamentoExameParaFuncao(
  supabase: Supabase,
  unidadeId: string,
  cargoId: string,
  exameId: string,
) {
  const { data: colaboradores } = await supabase
    .schema("rh")
    .from("colaboradores")
    .select("id")
    .eq("cargo_id", cargoId);

  if (!colaboradores || colaboradores.length === 0) return;

  const { data: existentes } = await supabase
    .schema("rh")
    .from("colaborador_exame_acompanhamento")
    .select("colaborador_id")
    .eq("exame_id", exameId)
    .in(
      "colaborador_id",
      colaboradores.map((c) => c.id as string),
    );

  const jaTem = new Set((existentes ?? []).map((e) => e.colaborador_id as string));
  const novos = colaboradores
    .filter((c) => !jaTem.has(c.id as string))
    .map((c) => ({
      unidade_id: unidadeId,
      colaborador_id: c.id as string,
      exame_id: exameId,
      acompanhar: true,
    }));

  if (novos.length > 0) {
    const { error } = await supabase.schema("rh").from("colaborador_exame_acompanhamento").insert(novos);
    if (error) console.error("seedAcompanhamentoExameParaFuncao:", error.message);
  }
}
