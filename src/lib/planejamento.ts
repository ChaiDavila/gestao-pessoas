// Regras do Planejamento de Gente, compartilhadas entre as visões (mensal, anual,
// orçamentos). Funções puras, sem acesso ao banco: podem rodar no servidor ou no cliente.
import { situacaoVencimento } from "@/lib/vencimento";

export type StatusAcao = "planejada" | "em_andamento" | "concluida" | "cancelada";
// "verba" = verba anual: orçamento do ano sem data de evento (datas fixas 01/01 a 31/12).
// Só existe na aba Orçamentos; as visões de planejamento filtram com ehVerba() para ignorá-la.
export type TipoAcao = "pontual" | "periodo" | "verba";

export function ehVerba(a: { tipo: TipoAcao }) {
  return a.tipo === "verba";
}

export type CategoriaPlanejamento = { id: string; nome: string; cor: string; ativo: boolean };

export type AcaoPlanejamento = {
  id: string;
  titulo: string;
  descricao: string | null;
  categoria_id: string;
  tipo: TipoAcao;
  data_inicio: string;
  data_fim: string | null;
  status: StatusAcao;
  data_conclusao: string | null;
  orcamento_previsto: number | null;
  observacoes: string | null;
};

export type TarefaPlanejamento = {
  id: string;
  acao_id: string;
  descricao: string;
  prazo: string | null;
  concluida: boolean;
  concluida_em: string | null;
  ordem: number;
};

export type DespesaPlanejamento = {
  id: string;
  acao_id: string;
  data: string;
  descricao: string;
  valor: number;
};

export const STATUS_LABEL: Record<StatusAcao, string> = {
  planejada: "Planejada",
  em_andamento: "Em andamento",
  concluida: "Concluída",
  cancelada: "Cancelada",
};

export const STATUS_TONE: Record<StatusAcao, "success" | "warning" | "danger" | "neutral"> = {
  planejada: "neutral",
  em_andamento: "warning",
  concluida: "success",
  cancelada: "neutral",
};

export const MESES = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

const COR_PADRAO = "#7A8594";

export function corCategoria(categorias: Map<string, CategoriaPlanejamento>, id: string) {
  return categorias.get(id)?.cor ?? COR_PADRAO;
}

// Fundo suave a partir da cor da categoria (hex + alfa), pra eventos e etiquetas.
export function fundoCategoria(cor: string) {
  return `${cor}1F`;
}

export function isoData(ano: number, mes: number, dia: number) {
  return `${ano}-${String(mes + 1).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
}

export function limitesMes(ano: number, mes: number) {
  const ultimoDia = new Date(ano, mes + 1, 0).getDate();
  return { inicio: isoData(ano, mes, 1), fim: isoData(ano, mes, ultimoDia) };
}

// Data local de hoje (o calendário destaca o dia do computador de quem usa, não o UTC).
export function hojeLocalISO() {
  const d = new Date();
  return isoData(d.getFullYear(), d.getMonth(), d.getDate());
}

// Último dia do registro: término da atividade, ou último dia de uma ação pontual de
// vários dias (ex.: evento de 08 a 09/07). Ação pontual de um dia só não tem data_fim.
export function dataFinal(a: AcaoPlanejamento) {
  return a.data_fim ?? a.data_inicio;
}

// Duração máxima de uma ação pontual de vários dias (mesmo limite da constraint no banco).
export const MAX_DIAS_PONTUAL = 7;

// Dias (ISO) cobertos por uma ação pontual, do início ao fim, inclusive.
export function diasDaAcaoPontual(a: AcaoPlanejamento) {
  const dias: string[] = [];
  const d = new Date(a.data_inicio + "T00:00:00");
  const fim = dataFinal(a);
  for (let i = 0; i < MAX_DIAS_PONTUAL; i++) {
    const iso = isoData(d.getFullYear(), d.getMonth(), d.getDate());
    if (iso > fim) break;
    dias.push(iso);
    d.setDate(d.getDate() + 1);
  }
  return dias;
}

// "08" ou "08 a 09" (dia de início e, se houver, dia de término).
export function rotuloDiasPontual(a: AcaoPlanejamento) {
  const ini = a.data_inicio.slice(8, 10);
  return a.data_fim ? `${ini} a ${a.data_fim.slice(8, 10)}` : ini;
}

// Uma atividade de fevereiro a abril "está" nos três meses, mas continua sendo um único
// registro: quem chama conta ações, nunca (ação x mês).
export function acaoNoMes(a: AcaoPlanejamento, ano: number, mes: number) {
  const { inicio, fim } = limitesMes(ano, mes);
  return a.data_inicio <= fim && dataFinal(a) >= inicio;
}

export function acaoNoAno(a: AcaoPlanejamento, ano: number) {
  return a.data_inicio <= `${ano}-12-31` && dataFinal(a) >= `${ano}-01-01`;
}

export function acaoAberta(a: AcaoPlanejamento) {
  return a.status === "planejada" || a.status === "em_andamento";
}

export function progressoChecklist(tarefas: TarefaPlanejamento[]) {
  const total = tarefas.length;
  const concluidas = tarefas.filter((t) => t.concluida).length;
  return { total, concluidas, percentual: total ? Math.round((concluidas / total) * 100) : null };
}

export type Pendencia = {
  chave: string;
  tipo: "tarefa" | "acao";
  titulo: string;
  acao: AcaoPlanejamento;
  tarefaId?: string;
  prazo: string;
  tone: "danger" | "warning";
  texto: string;
};

// Pendências: tarefas abertas com prazo e ações abertas cujo prazo (data da ação pontual ou
// término da atividade) venceu ou vence em até 1 mês. Mesma janela de "a vencer" usada em
// ASO e NR (situacaoVencimento). Não depende do mês selecionado na tela: uma pendência
// de outro mês continua aparecendo. Cada tarefa/ação gera no máximo uma pendência.
// Ações concluídas ou canceladas não geram pendência (nem pelas tarefas delas).
export function calcularPendencias(
  acoes: AcaoPlanejamento[],
  tarefasPorAcao: Map<string, TarefaPlanejamento[]>,
): Pendencia[] {
  const lista: Pendencia[] = [];
  for (const acao of acoes) {
    if (ehVerba(acao) || !acaoAberta(acao)) continue;

    const prazoAcao = dataFinal(acao);
    const situacaoAcao = situacaoVencimento(prazoAcao);
    if (situacaoAcao && (situacaoAcao.tone === "danger" || situacaoAcao.tone === "warning")) {
      lista.push({
        chave: `acao-${acao.id}`,
        tipo: "acao",
        titulo: acao.tipo === "periodo" ? `Término previsto: ${acao.titulo}` : acao.titulo,
        acao,
        prazo: prazoAcao,
        tone: situacaoAcao.tone,
        texto: situacaoAcao.tone === "danger" ? "Vencida" : "A vencer",
      });
    }

    for (const t of tarefasPorAcao.get(acao.id) ?? []) {
      if (t.concluida || !t.prazo) continue;
      const s = situacaoVencimento(t.prazo);
      if (!s || (s.tone !== "danger" && s.tone !== "warning")) continue;
      lista.push({
        chave: `tarefa-${t.id}`,
        tipo: "tarefa",
        titulo: t.descricao,
        acao,
        tarefaId: t.id,
        prazo: t.prazo,
        tone: s.tone,
        texto: s.tone === "danger" ? "Vencida" : "A vencer",
      });
    }
  }
  return lista.sort((a, b) => a.prazo.localeCompare(b.prazo));
}

export function agruparPorAcao<T extends { acao_id: string }>(itens: T[]) {
  const mapa = new Map<string, T[]>();
  for (const item of itens) {
    const lista = mapa.get(item.acao_id) ?? [];
    lista.push(item);
    mapa.set(item.acao_id, lista);
  }
  return mapa;
}

export function somarDias(data: string, dias: number) {
  const d = new Date(data + "T00:00:00");
  d.setDate(d.getDate() + dias);
  return isoData(d.getFullYear(), d.getMonth(), d.getDate());
}

export function diferencaDias(de: string, ate: string) {
  return Math.round(
    (new Date(ate + "T00:00:00").getTime() - new Date(de + "T00:00:00").getTime()) / 86400000,
  );
}

// Move uma data para outro ano mantendo dia/mês (29/02 vira 28/02 em ano não bissexto).
export function moverParaAno(data: string, ano: number) {
  const mes = Number(data.slice(5, 7)) - 1;
  const dia = Number(data.slice(8, 10));
  const ultimoDia = new Date(ano, mes + 1, 0).getDate();
  return isoData(ano, mes, Math.min(dia, ultimoDia));
}
