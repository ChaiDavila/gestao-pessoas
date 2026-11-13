"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatTile } from "@/components/stat-tile";
import {
  MESES,
  acaoNoAno,
  acaoNoMes,
  fundoCategoria,
  rotuloDiasPontual,
  type AcaoPlanejamento,
  type CategoriaPlanejamento,
} from "@/lib/planejamento";

const LIMITE_POR_MES = 4;
const MESES_CURTOS = MESES.map((m) => m.slice(0, 3).toLowerCase());

function rotuloPeriodo(a: AcaoPlanejamento) {
  if (!a.data_fim) return "";
  const mi = Number(a.data_inicio.slice(5, 7)) - 1;
  const mf = Number(a.data_fim.slice(5, 7)) - 1;
  const ai = a.data_inicio.slice(0, 4);
  const af = a.data_fim.slice(0, 4);
  if (ai === af && mi === mf) return "";
  return ai === af ? `${MESES_CURTOS[mi]} a ${MESES_CURTOS[mf]}` : `${MESES_CURTOS[mi]}/${ai} a ${MESES_CURTOS[mf]}/${af}`;
}

export function VisaoAnual({
  ano,
  onMudarAno,
  onAbrirMes,
  acoes,
  categoriasPorId,
}: {
  ano: number;
  onMudarAno: (ano: number) => void;
  onAbrirMes: (mes: number) => void;
  acoes: AcaoPlanejamento[];
  categoriasPorId: Map<string, CategoriaPlanejamento>;
}) {
  const cor = (a: AcaoPlanejamento) => categoriasPorId.get(a.categoria_id)?.cor ?? "#7A8594";

  // Contagens anuais são sempre de registros únicos: uma atividade de fevereiro a abril
  // aparece nos três cartões de mês, mas conta uma vez só no ano.
  const doAno = acoes.filter((a) => a.status !== "cancelada" && acaoNoAno(a, ano));
  const pontuais = doAno.filter((a) => a.tipo === "pontual").length;
  const periodos = doAno.length - pontuais;
  const concluidas = acoes.filter(
    (a) => a.status === "concluida" && a.data_conclusao?.slice(0, 4) === String(ano),
  ).length;

  const hoje = new Date();
  const mesAtual = hoje.getFullYear() === ano ? hoje.getMonth() : -1;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" size="icon-sm" onClick={() => onMudarAno(ano - 1)} title="Ano anterior">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="min-w-20 text-center text-lg font-semibold text-foreground">{ano}</span>
        <Button variant="outline" size="icon-sm" onClick={() => onMudarAno(ano + 1)} title="Próximo ano">
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={() => onMudarAno(new Date().getFullYear())}>
          Ano atual
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile
          label="Registros no ano"
          valor={String(doAno.length)}
          explicacao="Ações e atividades que acontecem (total ou parcialmente) neste ano, contadas uma vez cada. Canceladas não entram."
        />
        <StatTile label="Ações pontuais" valor={String(pontuais)} />
        <StatTile
          label="Atividades com período"
          valor={String(periodos)}
          explicacao="Cada atividade conta uma vez, mesmo que dure vários meses."
        />
        <StatTile
          label="Concluídas no ano"
          valor={String(concluidas)}
          explicacao="Pela data de conclusão registrada ao marcar a ação como Concluída."
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
        {MESES.map((nomeMes, m) => {
          const doMes = doAno
            .filter((a) => acaoNoMes(a, ano, m))
            .sort((a, b) => a.data_inicio.localeCompare(b.data_inicio));
          const qtdPontuais = doMes.filter((a) => a.tipo === "pontual").length;
          const qtdPeriodos = doMes.length - qtdPontuais;

          // Contagem por categoria, para a faixa de cores do cartão.
          const porCategoria = new Map<string, number>();
          for (const a of doMes) porCategoria.set(a.categoria_id, (porCategoria.get(a.categoria_id) ?? 0) + 1);

          return (
            <button
              key={m}
              type="button"
              onClick={() => onAbrirMes(m)}
              className={`flex min-h-44 flex-col rounded-lg border bg-card p-4 text-left transition-colors hover:border-primary/50 hover:bg-muted/30 ${
                m === mesAtual ? "border-primary" : "border-border"
              }`}
            >
              <div className="flex items-baseline justify-between gap-2">
                <h3 className={`font-semibold ${m === mesAtual ? "text-primary" : "text-foreground"}`}>{nomeMes}</h3>
                <span className="text-xs text-muted-foreground">
                  {qtdPontuais} pontua{qtdPontuais === 1 ? "l" : "is"} · {qtdPeriodos} com período
                </span>
              </div>

              {doMes.length > 0 && (
                <div className="mt-2 flex h-1.5 overflow-hidden rounded-full">
                  {[...porCategoria.entries()].map(([catId, qtd]) => (
                    <span
                      key={catId}
                      title={`${categoriasPorId.get(catId)?.nome}: ${qtd}`}
                      style={{ flexGrow: qtd, backgroundColor: categoriasPorId.get(catId)?.cor ?? "#7A8594" }}
                    />
                  ))}
                </div>
              )}

              <div className="mt-3 space-y-1">
                {doMes.length === 0 && <p className="text-xs text-muted-foreground">Nenhuma ação planejada.</p>}
                {doMes.slice(0, LIMITE_POR_MES).map((a) => {
                  const periodo = a.tipo === "periodo" ? rotuloPeriodo(a) : "";
                  return (
                    <div
                      key={a.id}
                      className="truncate rounded border-l-[3px] px-1.5 py-0.5 text-xs font-medium"
                      style={{ borderLeftColor: cor(a), backgroundColor: fundoCategoria(cor(a)), color: cor(a) }}
                      title={periodo ? `${a.titulo} (${periodo})` : a.titulo}
                    >
                      {a.tipo === "periodo" ? "↔ " : `${rotuloDiasPontual(a)} · `}
                      {a.titulo}
                      {periodo && <span className="font-normal opacity-80"> ({periodo})</span>}
                    </div>
                  );
                })}
                {doMes.length > LIMITE_POR_MES && (
                  <p className="pt-0.5 text-xs text-muted-foreground">+ {doMes.length - LIMITE_POR_MES} outros</p>
                )}
              </div>
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        {[...categoriasPorId.values()]
          .filter((c) => c.ativo)
          .map((c) => (
            <span key={c.id} className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: c.cor }} />
              {c.nome}
            </span>
          ))}
        <span>↔ atividade com período (aparece em todos os meses que abrange)</span>
      </div>
    </div>
  );
}
