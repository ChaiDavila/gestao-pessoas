import type { ParticipacaoItem, TreinamentoItem } from "@/lib/data/treinamentos";

// Horas: cada participante leva o crédito cheio da carga horária do curso que fez (não é
// rateado — 10 pessoas num curso de 8h entregam 80h-pessoa de treinamento). Investimento:
// o custo do treinamento é rateado igualmente entre os participantes REAIS dele (não só os
// que passam no filtro) — assim, filtrar por função/setor/etc. mostra a fração do gasto
// atribuível àquele recorte, sem inflar o total quando um curso mistura gente de vários
// grupos. Somar o custo cheio por treinamento a cada grupo (sem ratear) faria a soma dos
// grupos passar do investimento total sempre que um curso tiver participantes de mais de
// um grupo.

export type AgrupamentoValor = { chave: string; valor: number };

function agruparSoma<T>(
  itens: T[],
  chaveFn: (item: T) => string,
  valorFn: (item: T) => number,
): AgrupamentoValor[] {
  const mapa = new Map<string, number>();
  for (const item of itens) {
    const chave = chaveFn(item);
    mapa.set(chave, (mapa.get(chave) ?? 0) + valorFn(item));
  }
  return Array.from(mapa.entries())
    .map(([chave, valor]) => ({ chave, valor }))
    .sort((a, b) => b.valor - a.valor);
}

const rotuloCategoria = (categoriaNome: string | null, tipo: string) =>
  categoriaNome ?? (tipo === "NR" ? "NR (Segurança do Trabalho)" : "Sem categoria");

export function calcularIndicadores(
  treinamentosTodos: TreinamentoItem[],
  participacoesPeriodo: ParticipacaoItem[],
  participacoesPessoa: ParticipacaoItem[],
) {
  const totalParticipantesPorTreinamento = new Map(
    treinamentosTodos.map((t) => [t.id, Math.max(1, t.total_participantes)]),
  );
  const custoRateado = (p: ParticipacaoItem) =>
    Number(p.custo_total || 0) / (totalParticipantesPorTreinamento.get(p.treinamento_id) ?? 1);

  const horasTotais = participacoesPeriodo.reduce((s, p) => s + Number(p.carga_horaria || 0), 0);
  const investimentoTotal = participacoesPeriodo.reduce((s, p) => s + custoRateado(p), 0);
  const colaboradoresUnicos = new Set(participacoesPeriodo.map((p) => p.colaborador_id)).size;
  const mediaHorasPorColaborador = colaboradoresUnicos > 0 ? horasTotais / colaboradoresUnicos : 0;
  const treinamentosRealizados = new Set(participacoesPeriodo.map((p) => p.treinamento_id)).size;

  const horasPorCategoria = agruparSoma(
    participacoesPeriodo,
    (p) => rotuloCategoria(p.categoria_nome, p.tipo),
    (p) => Number(p.carga_horaria || 0),
  );

  const investimentoPorCategoria = agruparSoma(
    participacoesPeriodo,
    (p) => rotuloCategoria(p.categoria_nome, p.tipo),
    custoRateado,
  );

  const horasPorSetor = agruparSoma(
    participacoesPeriodo,
    (p) => p.setor_nome ?? "Sem setor",
    (p) => Number(p.carga_horaria || 0),
  );

  const rankingColaboradores = agruparSoma(
    participacoesPeriodo,
    (p) => p.colaborador_nome,
    (p) => Number(p.carga_horaria || 0),
  ).slice(0, 10);

  // Investimento por ano ignora o período selecionado de propósito (mostra a evolução no
  // tempo inteiro, igual à folha salarial do Dashboard) — só respeita os filtros de pessoa.
  const investimentoPorAno = agruparSoma(
    participacoesPessoa,
    (p) => p.data.slice(0, 4),
    custoRateado,
  ).sort((a, b) => a.chave.localeCompare(b.chave));

  return {
    horasTotais,
    investimentoTotal,
    mediaHorasPorColaborador,
    treinamentosRealizados,
    horasPorCategoria,
    investimentoPorCategoria,
    horasPorSetor,
    rankingColaboradores,
    investimentoPorAno,
  };
}
