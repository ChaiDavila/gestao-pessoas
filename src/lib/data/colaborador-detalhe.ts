import { createClient } from "@/lib/supabase/server";
import type { NrColaboradorItem, ParticipacaoItem } from "@/lib/data/treinamentos";
import type { PgrColaboradorItem } from "@/lib/data/aso";

export type FormacaoRow = {
  id: string;
  curso: string | null;
  instituicao: string | null;
  ano_conclusao: number | null;
  status: string;
  criado_em: string;
  nivel_id: string;
  config_formacoes: { nome: string } | null;
};

export type HistoricoRow = {
  id: string;
  data: string;
  cargo_anterior: string | null;
  cargo_novo: string | null;
  salario_anterior: number | null;
  salario_novo: number | null;
  motivo_id: string | null;
  config_motivos_evolucao_salarial: { motivo: string } | null;
};

export type ExameComplementarRow = {
  id: string;
  exame_id: string;
  data: string;
  data_vencimento: string | null;
  config_tipos_exame: { nome: string } | null;
};

export async function getDependentes(colaboradorId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .schema("rh")
    .from("dependentes")
    .select("id, nome, parentesco, data_nascimento, sexo")
    .eq("colaborador_id", colaboradorId)
    .eq("ativo", true)
    .order("data_nascimento", { ascending: true });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getFormacoes(colaboradorId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .schema("rh")
    .from("formacoes")
    .select(
      "id, curso, instituicao, ano_conclusao, status, criado_em, nivel_id, config_formacoes(nome)",
    )
    .eq("colaborador_id", colaboradorId)
    .eq("ativo", true)
    .order("criado_em", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as FormacaoRow[];
}

export async function getHistoricoSalarial(colaboradorId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .schema("rh")
    .from("historico_cargo_salarial")
    .select(
      "id, data, cargo_anterior, cargo_novo, salario_anterior, salario_novo, motivo_id, config_motivos_evolucao_salarial(motivo)",
    )
    .eq("colaborador_id", colaboradorId)
    .eq("ativo", true)
    .order("data", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as HistoricoRow[];
}

export async function getAsoRegistros(colaboradorId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .schema("rh")
    .from("aso_registros")
    .select("id, tipo_exame, data, resultado, data_vencimento")
    .eq("colaborador_id", colaboradorId)
    .eq("ativo", true)
    .order("data", { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

// Mesma fonte do módulo ASO (rh.vw_pgr_colaborador): uma linha por exame complementar
// ACOMPANHADO (inclusive os nunca registrados — "Sem registro"), com o estado de
// acompanhamento, pra ficha e módulo nunca divergirem.
export async function getPgrColaborador(colaboradorId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .schema("rh")
    .from("vw_pgr_colaborador")
    .select("*")
    .eq("colaborador_id", colaboradorId)
    .order("exame_nome", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as PgrColaboradorItem[];
}

// Treinamentos (gerais + NR) que o colaborador participou — histórico completo de
// renovações, igual ao que o módulo Treinamentos mostra (mesma view, mesmos registros).
export async function getTreinamentosColaborador(colaboradorId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .schema("rh")
    .from("vw_treinamento_participantes")
    .select("*")
    .eq("colaborador_id", colaboradorId)
    .order("data", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as ParticipacaoItem[];
}

// Situação/acompanhamento de NR do colaborador — mesma fonte do módulo Treinamentos
// (rh.vw_nr_colaborador), incluindo NRs acompanhadas sem nenhum curso feito ainda.
export async function getNrColaborador(colaboradorId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .schema("rh")
    .from("vw_nr_colaborador")
    .select("*")
    .eq("colaborador_id", colaboradorId)
    .order("nr", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as NrColaboradorItem[];
}

export type HistoricoEstruturaRow = {
  id: string;
  data_vigencia: string;
  cargo_id: string | null;
  cargo_nome: string | null;
  nivel_id: string | null;
  nivel_nome: string | null;
  eixo_id: string | null;
  eixo_nome: string | null;
  setor_id: string | null;
  setor_nome: string | null;
  gestor_colaborador_id: string | null;
  gestor_nome: string | null;
};

// Histórico de função/nível/eixo/setor/gestor com vigência — mesma tabela que a edição do
// colaborador já alimenta (rh.historico_estrutura_organizacional), só com os nomes
// resolvidos pra exibição. Mais antigo primeiro, pra calcular "anterior → novo" em ordem.
export async function getHistoricoEstruturaColaborador(colaboradorId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .schema("rh")
    .from("vw_historico_estrutura_colaborador")
    .select("*")
    .eq("colaborador_id", colaboradorId)
    .order("data_vigencia", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as HistoricoEstruturaRow[];
}

export async function getConfigFormacoes() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .schema("rh")
    .from("config_formacoes")
    .select("id, nome")
    .eq("ativo", true)
    .order("ordem");

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getConfigTiposExame() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .schema("rh")
    .from("config_tipos_exame")
    .select("id, nome, periodicidade_meses")
    .eq("ativo", true)
    .order("nome");

  if (error) throw new Error(error.message);
  return data ?? [];
}

export type ExigenciaAsoItem = {
  id: string;
  tipo_contrato: string;
  exige_aso: boolean;
};

// Nem todo tipo de contrato entra no acompanhamento de ASO/PGR (ex.: PJ e Estágio, por
// padrão) — configurável em Configurações → ASO e PGR.
export async function getExigenciaAso() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .schema("rh")
    .from("config_exigencia_aso")
    .select("id, tipo_contrato, exige_aso")
    .eq("ativo", true)
    .order("tipo_contrato");

  if (error) throw new Error(error.message);
  return (data ?? []) as ExigenciaAsoItem[];
}

export async function getMotivosEvolucaoSalarial() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .schema("rh")
    .from("config_motivos_evolucao_salarial")
    .select("id, motivo")
    .eq("ativo", true)
    .order("motivo");

  if (error) throw new Error(error.message);
  return data ?? [];
}
