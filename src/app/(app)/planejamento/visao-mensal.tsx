"use client";

import { useState, useTransition } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { StatTile } from "@/components/stat-tile";
import { StatusBadge } from "@/components/status-badge";
import { formatarData } from "@/lib/date";
import {
  MESES,
  STATUS_LABEL,
  STATUS_TONE,
  acaoNoMes,
  diasDaAcaoPontual,
  fundoCategoria,
  rotuloDiasPontual,
  hojeLocalISO,
  isoData,
  limitesMes,
  progressoChecklist,
  type AcaoPlanejamento,
  type CategoriaPlanejamento,
  type Pendencia,
  type TarefaPlanejamento,
} from "@/lib/planejamento";
import { feriadosPorData } from "@/lib/feriados";
import { alternarTarefa } from "./actions";

const LIMITE_PENDENCIAS = 5;
const LIMITE_POR_DIA = 3;

type ItemCalendario = {
  chave: string;
  rotulo: string;
  acao: AcaoPlanejamento;
  tipo: "pontual" | "inicio" | "fim" | "tarefa";
  concluida?: boolean;
};

export function VisaoMensal({
  ano,
  mes,
  onMudarMes,
  acoes,
  tarefasPorAcao,
  pendencias,
  categoriasPorId,
  podeEditar,
  onAbrirAcao,
  onNovaAcao,
}: {
  ano: number;
  mes: number;
  onMudarMes: (ano: number, mes: number) => void;
  acoes: AcaoPlanejamento[];
  tarefasPorAcao: Map<string, TarefaPlanejamento[]>;
  pendencias: Pendencia[];
  categoriasPorId: Map<string, CategoriaPlanejamento>;
  podeEditar: boolean;
  onAbrirAcao: (id: string) => void;
  onNovaAcao: (dataSugerida: string) => void;
}) {
  const [verTodas, setVerTodas] = useState(false);
  const { inicio, fim } = limitesMes(ano, mes);
  const cor = (a: AcaoPlanejamento) => categoriasPorId.get(a.categoria_id)?.cor ?? "#7A8594";

  const noMes = acoes.filter((a) => a.status !== "cancelada" && acaoNoMes(a, ano, mes));
  const atividades = noMes.filter((a) => a.tipo === "periodo");
  const pontuais = noMes.filter((a) => a.tipo === "pontual");
  const emAndamento = noMes.filter((a) => a.status === "em_andamento").length;
  const concluidasNoMes = acoes.filter(
    (a) => a.status === "concluida" && a.data_conclusao && a.data_conclusao >= inicio && a.data_conclusao <= fim,
  ).length;
  const vencidas = pendencias.filter((p) => p.tone === "danger").length;

  function mudar(delta: number) {
    const d = new Date(ano, mes + delta, 1);
    onMudarMes(d.getFullYear(), d.getMonth());
  }

  const pendenciasVisiveis = verTodas ? pendencias : pendencias.slice(0, LIMITE_PENDENCIAS);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" size="icon-sm" onClick={() => mudar(-1)} title="Mês anterior">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="min-w-40 text-center text-lg font-semibold text-foreground">
          {MESES[mes]} de {ano}
        </span>
        <Button variant="outline" size="icon-sm" onClick={() => mudar(1)} title="Próximo mês">
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            const d = new Date();
            onMudarMes(d.getFullYear(), d.getMonth());
          }}
        >
          Mês atual
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile
          label="Registros no mês"
          valor={String(noMes.length)}
          subtitulo={`${pontuais.length} pontuais · ${atividades.length} com período`}
          explicacao="Ações pontuais com data neste mês e atividades cujo período passa por este mês. Canceladas não entram."
        />
        <StatTile
          label="Em andamento"
          valor={String(emAndamento)}
          subtitulo="Inclui atividades de vários meses"
          explicacao="Registros deste mês com status Em andamento."
        />
        <StatTile
          label="Pendências"
          valor={String(pendencias.length)}
          subtitulo={vencidas ? `${vencidas} vencida(s)` : "Nenhuma vencida"}
          accent={vencidas > 0}
          explicacao="Tarefas e ações abertas vencidas ou com prazo em até 1 mês, de qualquer mês (o mês selecionado não esconde pendência)."
        />
        <StatTile
          label="Concluídas no mês"
          valor={String(concluidasNoMes)}
          subtitulo="Pela data de conclusão"
          explicacao="Ações marcadas como Concluída com data de conclusão dentro deste mês."
        />
      </div>

      {/* Duas colunas em telas largas: calendário à esquerda, pendências e atividades à
          direita (como no protótipo). Em telas menores empilha, com pendências no topo. */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
      <div className="space-y-6 xl:order-2">
      {/* Pendências */}
      <section className="rounded-lg border border-border bg-card p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Pendências prioritárias</h2>
          {pendencias.length > LIMITE_PENDENCIAS && (
            <Button variant="link" size="sm" onClick={() => setVerTodas(!verTodas)}>
              {verTodas ? "Mostrar menos" : `Ver todas (${pendencias.length})`}
            </Button>
          )}
        </div>
        {pendencias.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">Nenhuma pendência vencida ou próxima do prazo.</p>
        ) : (
          <div className="grid grid-cols-1 gap-2">
            {pendenciasVisiveis.map((p) => (
              <LinhaPendencia key={p.chave} p={p} cor={cor(p.acao)} podeEditar={podeEditar} onAbrir={() => onAbrirAcao(p.acao.id)} />
            ))}
          </div>
        )}
      </section>

      {/* Atividades com período */}
      <section className="rounded-lg border border-border bg-card p-4">
        <h2 className="mb-3 text-sm font-semibold text-foreground">Atividades em andamento no mês</h2>
        {atividades.length === 0 ? (
          <p className="py-2 text-sm text-muted-foreground">Nenhuma atividade com período passa por este mês.</p>
        ) : (
          <div className="grid grid-cols-1 gap-2">
            {atividades.map((a) => {
              const prog = progressoChecklist(tarefasPorAcao.get(a.id) ?? []);
              return (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => onAbrirAcao(a.id)}
                  className="rounded-md border-l-4 p-3 text-left transition-colors hover:brightness-95"
                  style={{ borderLeftColor: cor(a), backgroundColor: fundoCategoria(cor(a)) }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium text-foreground">{a.titulo}</p>
                    <StatusBadge tone={STATUS_TONE[a.status]}>{STATUS_LABEL[a.status]}</StatusBadge>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {categoriasPorId.get(a.categoria_id)?.nome} · {formatarData(a.data_inicio)} a {formatarData(a.data_fim)}
                  </p>
                  {prog.total > 0 && (
                    <div className="mt-2">
                      <div className="h-1.5 overflow-hidden rounded-full bg-white/70">
                        <div className="h-full rounded-full" style={{ width: `${prog.percentual}%`, backgroundColor: cor(a) }} />
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {prog.concluidas} de {prog.total} tarefas concluídas ({prog.percentual}%)
                      </p>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* Ações pontuais */}
      <section className="rounded-lg border border-border bg-card p-4">
        <h2 className="mb-3 text-sm font-semibold text-foreground">Ações pontuais do mês</h2>
        {pontuais.length === 0 ? (
          <p className="py-2 text-sm text-muted-foreground">Nenhuma ação pontual neste mês.</p>
        ) : (
          <div className="divide-y divide-border">
            {pontuais.map((a) => {
              const prog = progressoChecklist(tarefasPorAcao.get(a.id) ?? []);
              return (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => onAbrirAcao(a.id)}
                  className="flex w-full items-center gap-3 px-1 py-2.5 text-left hover:bg-muted/40"
                >
                  <span
                    className={`shrink-0 rounded-md border-t-4 bg-muted py-1 text-center font-semibold ${a.data_fim ? "w-16 text-xs leading-5" : "w-12 text-sm"}`}
                    style={{ borderTopColor: cor(a) }}
                  >
                    {rotuloDiasPontual(a)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium text-foreground">{a.titulo}</span>
                    <span className="block text-xs text-muted-foreground">
                      {categoriasPorId.get(a.categoria_id)?.nome}
                      {prog.total > 0 && ` · checklist ${prog.concluidas}/${prog.total}`}
                    </span>
                  </span>
                  <StatusBadge tone={STATUS_TONE[a.status]}>{STATUS_LABEL[a.status]}</StatusBadge>
                </button>
              );
            })}
          </div>
        )}
      </section>
      </div>

      <div className="xl:order-1">
      {/* Calendário */}
      <section className="rounded-lg border border-border bg-card p-4">
        <h2 className="mb-3 text-sm font-semibold text-foreground">Calendário</h2>
        <Calendario
          ano={ano}
          mes={mes}
          // Todas as ações não canceladas (não só as do mês): uma tarefa com prazo neste mês
          // pode pertencer a uma ação de outro mês. Datas fora do mês são simplesmente ignoradas.
          acoes={acoes.filter((a) => a.status !== "cancelada")}
          tarefasPorAcao={tarefasPorAcao}
          cor={cor}
          podeEditar={podeEditar}
          onAbrirAcao={onAbrirAcao}
          onNovaAcao={onNovaAcao}
        />
        <Legenda categoriasPorId={categoriasPorId} />
      </section>
      </div>
      </div>
    </div>
  );
}

function LinhaPendencia({
  p,
  cor,
  podeEditar,
  onAbrir,
}: {
  p: Pendencia;
  cor: string;
  podeEditar: boolean;
  onAbrir: () => void;
}) {
  const [pending, startTransition] = useTransition();
  return (
    <div className="flex items-start gap-3 rounded-md border border-border p-3">
      {p.tipo === "tarefa" && podeEditar ? (
        <input
          type="checkbox"
          className="mt-1 h-4 w-4 shrink-0 accent-[var(--primary)]"
          title="Marcar tarefa como concluída"
          disabled={pending}
          onChange={() => startTransition(() => alternarTarefa(p.tarefaId!, true))}
        />
      ) : (
        <span className="mt-1.5 h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: cor }} />
      )}
      <button type="button" onClick={onAbrir} className="min-w-0 flex-1 text-left">
        <p className="font-medium text-foreground hover:underline">{p.titulo}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {p.tipo === "tarefa" ? `Tarefa de: ${p.acao.titulo}` : "Ação ainda não concluída"} · prazo {formatarData(p.prazo)}
        </p>
      </button>
      <StatusBadge tone={p.tone}>{p.texto}</StatusBadge>
    </div>
  );
}

function Calendario({
  ano,
  mes,
  acoes,
  tarefasPorAcao,
  cor,
  podeEditar,
  onAbrirAcao,
  onNovaAcao,
}: {
  ano: number;
  mes: number;
  acoes: AcaoPlanejamento[];
  tarefasPorAcao: Map<string, TarefaPlanejamento[]>;
  cor: (a: AcaoPlanejamento) => string;
  podeEditar: boolean;
  onAbrirAcao: (id: string) => void;
  onNovaAcao: (dataSugerida: string) => void;
}) {
  const hoje = hojeLocalISO();
  const feriados = feriadosPorData(ano);
  const primeiroDiaSemana = new Date(ano, mes, 1).getDay(); // domingo = 0
  const diasNoMes = new Date(ano, mes + 1, 0).getDate();
  const totalCelulas = Math.ceil((diasNoMes + primeiroDiaSemana) / 7) * 7;

  // Atividades com período só aparecem no início e no término (nunca nos dias do meio);
  // tarefas com prazo aparecem como entregas, diferenciadas das ações.
  const porDia = new Map<string, ItemCalendario[]>();
  const add = (data: string, item: ItemCalendario) => {
    const lista = porDia.get(data) ?? [];
    lista.push(item);
    porDia.set(data, lista);
  };
  for (const a of acoes) {
    if (a.tipo === "pontual") {
      // Evento de vários dias (ex.: 08 e 09) aparece em cada um dos dias.
      for (const dia of diasDaAcaoPontual(a)) {
        add(dia, { chave: `${a.id}-${dia}`, rotulo: a.titulo, acao: a, tipo: "pontual" });
      }
    } else {
      add(a.data_inicio, { chave: `${a.id}-i`, rotulo: `Início: ${a.titulo}`, acao: a, tipo: "inicio" });
      if (a.data_fim) add(a.data_fim, { chave: `${a.id}-f`, rotulo: `Término: ${a.titulo}`, acao: a, tipo: "fim" });
    }
    for (const t of tarefasPorAcao.get(a.id) ?? []) {
      if (t.prazo) {
        add(t.prazo, { chave: `t-${t.id}`, rotulo: t.descricao, acao: a, tipo: "tarefa", concluida: t.concluida });
      }
    }
  }

  return (
    <div>
      <div className="grid grid-cols-7 gap-1.5 pb-1 text-center text-xs font-medium text-muted-foreground">
        {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1.5">
        {Array.from({ length: totalCelulas }, (_, i) => {
          const dia = i - primeiroDiaSemana + 1;
          if (dia < 1 || dia > diasNoMes) {
            return <div key={i} className="min-h-24 rounded-md bg-muted/30" />;
          }
          const data = isoData(ano, mes, dia);
          const itens = porDia.get(data) ?? [];
          const ehHoje = data === hoje;
          const feriado = feriados.get(data);
          return (
            <div
              key={i}
              className={`group min-h-24 overflow-hidden rounded-md border p-1.5 ${
                ehHoje ? "border-primary bg-primary/5" : feriado ? "border-border bg-muted/70" : "border-border"
              }`}
            >
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className={ehHoje ? "font-bold text-primary" : "font-medium text-foreground"}>{dia}</span>
                {podeEditar && (
                  <button
                    type="button"
                    title="Nova ação neste dia"
                    onClick={() => onNovaAcao(data)}
                    className="rounded px-1 text-muted-foreground opacity-0 transition-opacity hover:bg-muted group-hover:opacity-100"
                  >
                    +
                  </button>
                )}
              </div>
              {feriado && (
                <p className="mb-1 truncate text-[10px] font-semibold uppercase tracking-wide text-muted-foreground" title={`Feriado: ${feriado}`}>
                  {feriado}
                </p>
              )}
              <div className="space-y-1">
                {itens.slice(0, LIMITE_POR_DIA).map((it) => (
                  <EventoCalendario key={it.chave} item={it} cor={cor(it.acao)} onAbrir={() => onAbrirAcao(it.acao.id)} />
                ))}
                {itens.length > LIMITE_POR_DIA && (
                  <Popover>
                    <PopoverTrigger className="w-full rounded px-1 text-left text-[11px] font-medium text-primary hover:underline">
                      + {itens.length - LIMITE_POR_DIA} mais
                    </PopoverTrigger>
                    <PopoverContent className="w-72 space-y-1">
                      <p className="mb-1 text-xs font-semibold text-muted-foreground">{formatarData(data)}</p>
                      {itens.map((it) => (
                        <EventoCalendario key={it.chave} item={it} cor={cor(it.acao)} onAbrir={() => onAbrirAcao(it.acao.id)} />
                      ))}
                    </PopoverContent>
                  </Popover>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function EventoCalendario({ item, cor, onAbrir }: { item: ItemCalendario; cor: string; onAbrir: () => void }) {
  if (item.tipo === "tarefa") {
    return (
      <button
        type="button"
        onClick={onAbrir}
        title={`Tarefa: ${item.rotulo} (${item.acao.titulo})`}
        className={`block w-full truncate rounded border border-dashed px-1 py-0.5 text-left text-[11px] ${item.concluida ? "text-muted-foreground line-through" : "text-foreground"}`}
        style={{ borderColor: cor }}
      >
        {item.concluida ? "☑" : "☐"} {item.rotulo}
      </button>
    );
  }
  const prefixo = item.tipo === "inicio" ? "▶ " : item.tipo === "fim" ? "■ " : "";
  return (
    <button
      type="button"
      onClick={onAbrir}
      title={item.rotulo}
      className="block w-full truncate rounded border-l-[3px] px-1 py-0.5 text-left text-[11px] font-medium"
      style={{ borderLeftColor: cor, backgroundColor: fundoCategoria(cor), color: cor }}
    >
      {prefixo}
      {item.rotulo}
    </button>
  );
}

function Legenda({ categoriasPorId }: { categoriasPorId: Map<string, CategoriaPlanejamento> }) {
  const ativas = [...categoriasPorId.values()].filter((c) => c.ativo);
  return (
    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
      {ativas.map((c) => (
        <span key={c.id} className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: c.cor }} />
          {c.nome}
        </span>
      ))}
      <span className="flex items-center gap-1.5">▶ início · ■ término · ☐ tarefa</span>
    </div>
  );
}
