import type { ParticipacaoItem, TreinamentoItem } from "@/lib/data/treinamentos";
import { preencherAnosContinuos } from "@/lib/date";

// Horas são somadas por PARTICIPAÇÃO (pessoa-hora: se 10 pessoas fazem um curso de 8h,
// isso conta como 80h entregues). Investimento é somado por TREINAMENTO único (o custo é
// da turma/curso como um todo, não por participante — somar por participação infla o gasto
// real quando um curso tem várias pessoas).

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

export function calcularIndicadores(
  treinamentos: TreinamentoItem[],
  participacoes: ParticipacaoItem[],
  ano?: string,
) {
  const treinamentosFiltrados = ano
    ? treinamentos.filter((t) => t.data.startsWith(ano))
    : treinamentos;
  const participacoesFiltradas = ano
    ? participacoes.filter((p) => p.data.startsWith(ano))
    : participacoes;

  const horasTotais = participacoesFiltradas.reduce(
    (s, p) => s + Number(p.carga_horaria || 0),
    0,
  );
  const investimentoTotal = treinamentosFiltrados.reduce(
    (s, t) => s + Number(t.custo_total || 0),
    0,
  );
  const colaboradoresUnicos = new Set(
    participacoesFiltradas.map((p) => p.colaborador_id),
  ).size;
  const custoMedioPorColaborador =
    colaboradoresUnicos > 0 ? investimentoTotal / colaboradoresUnicos : 0;

  const rotuloCategoria = (categoriaNome: string | null, tipo: string) =>
    categoriaNome ?? (tipo === "NR" ? "NR (Segurança do Trabalho)" : "Sem categoria");

  const horasPorCategoria = agruparSoma(
    participacoesFiltradas,
    (p) => rotuloCategoria(p.categoria_nome, p.tipo),
    (p) => Number(p.carga_horaria || 0),
  );

  const investimentoPorCategoria = agruparSoma(
    treinamentosFiltrados,
    (t) => rotuloCategoria(t.categoria_nome, t.tipo),
    (t) => Number(t.custo_total || 0),
  );

  const horasPorSetor = agruparSoma(
    participacoesFiltradas,
    (p) => p.setor_nome ?? "Sem setor",
    (p) => Number(p.carga_horaria || 0),
  );

  const rankingColaboradores = agruparSoma(
    participacoesFiltradas,
    (p) => p.colaborador_nome,
    (p) => Number(p.carga_horaria || 0),
  ).slice(0, 10);

  // Investimento por ano sempre olha todos os anos, independente do filtro selecionado
  // (mostra a evolução no tempo, igual à folha salarial do Dashboard). Preenche anos sem
  // nenhum treinamento para o eixo do tempo ficar contínuo.
  const anosInvestimento = preencherAnosContinuos(treinamentos.map((t) => t.data.slice(0, 4)));
  const investimentoPorAno = anosInvestimento.map((ano) => ({
    chave: ano,
    valor: treinamentos
      .filter((t) => t.data.startsWith(ano))
      .reduce((s, t) => s + Number(t.custo_total || 0), 0),
  }));

  const anosDisponiveis = Array.from(
    new Set(treinamentos.map((t) => t.data.slice(0, 4))),
  ).sort((a, b) => b.localeCompare(a));

  return {
    horasTotais,
    investimentoTotal,
    custoMedioPorColaborador,
    horasPorCategoria,
    investimentoPorCategoria,
    horasPorSetor,
    rankingColaboradores,
    investimentoPorAno,
    anosDisponiveis,
  };
}
