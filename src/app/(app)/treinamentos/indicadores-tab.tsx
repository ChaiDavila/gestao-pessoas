"use client";

import { useMemo } from "react";
import { StatTile } from "@/components/stat-tile";
import { ChartCard } from "@/components/chart-card";
import { BarChart } from "@/components/charts/bar-chart";
import { formatarMoeda, formatarComBase, formatarPercentual } from "@/lib/formatacao";
import { calcularIndicadores } from "@/lib/treinamentos-indicadores";
import type { ParticipacaoItem, TreinamentoItem } from "@/lib/data/treinamentos";

const COR_CINZA = "#434342";

export function IndicadoresTab({
  treinamentosTodos,
  participacoesPeriodo,
  participacoesPessoa,
  colaboradoresElegiveisNoPeriodo,
  periodoRotulo,
}: {
  treinamentosTodos: TreinamentoItem[];
  participacoesPeriodo: ParticipacaoItem[];
  participacoesPessoa: ParticipacaoItem[];
  colaboradoresElegiveisNoPeriodo: { id: string }[];
  periodoRotulo: string;
}) {
  const indicadores = useMemo(
    () =>
      calcularIndicadores(
        treinamentosTodos,
        participacoesPeriodo,
        participacoesPessoa,
        colaboradoresElegiveisNoPeriodo,
      ),
    [treinamentosTodos, participacoesPeriodo, participacoesPessoa, colaboradoresElegiveisNoPeriodo],
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatTile
          label="Horas de treinamento"
          valor={`${indicadores.horasTotais.toLocaleString("pt-BR")}h`}
          subtitulo={`no ${periodoRotulo} · soma por participante (não é curso único)`}
          explicacao="Soma da carga horária por participante (não por curso único)."
          accent
        />
        <StatTile
          label="Média de horas por colaborador"
          valor={formatarComBase(
            indicadores.mediaHorasPorColaborador,
            (v) => `${v.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}h`,
          )}
          subtitulo={`no ${periodoRotulo} · ${indicadores.colaboradoresElegiveis} colaborador(es) elegível(is)`}
          explicacao="Horas-pessoa ÷ todos os elegíveis no período, incluindo quem não participou."
        />
        <StatTile
          label="Participação em treinamentos"
          valor={`${indicadores.colaboradoresParticiparam} de ${indicadores.colaboradoresElegiveis}`}
          subtitulo={formatarPercentual(indicadores.percentualParticipacao)}
          explicacao="Colaboradores elegíveis que fizeram ao menos 1 treinamento, cada um contado uma vez."
        />
        <StatTile
          label="Investimento total"
          valor={formatarMoeda(indicadores.investimentoTotal) ?? "R$ 0,00"}
          subtitulo={`no ${periodoRotulo} · custo rateado entre participantes`}
          explicacao="Custo rateado entre os participantes reais de cada curso."
        />
        <StatTile
          label="Treinamentos realizados"
          valor={String(indicadores.treinamentosRealizados)}
          subtitulo={`no ${periodoRotulo}`}
          accent
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard titulo="Horas de treinamento por categoria">
          <BarChart
            labels={indicadores.horasPorCategoria.map((c) => c.chave)}
            valores={indicadores.horasPorCategoria.map((c) => c.valor)}
            formatarValor={(v) => `${v}h`}
          />
        </ChartCard>
        <ChartCard titulo="Investimento por categoria">
          <BarChart
            labels={indicadores.investimentoPorCategoria.map((c) => c.chave)}
            series={[{ rotulo: "Investimento", valores: indicadores.investimentoPorCategoria.map((c) => c.valor), cor: COR_CINZA }]}
            formatarValor={(v) => formatarMoeda(v) ?? ""}
          />
        </ChartCard>
        <ChartCard titulo="Horas de treinamento por setor">
          <BarChart
            horizontal
            labels={indicadores.horasPorSetor.map((c) => c.chave)}
            valores={indicadores.horasPorSetor.map((c) => c.valor)}
            formatarValor={(v) => `${v}h`}
          />
        </ChartCard>
        <ChartCard titulo="Ranking — horas por colaborador (top 10)">
          <BarChart
            horizontal
            labels={indicadores.rankingColaboradores.map((c) => c.chave)}
            series={[{ rotulo: "Horas", valores: indicadores.rankingColaboradores.map((c) => c.valor), cor: COR_CINZA }]}
            formatarValor={(v) => `${v}h`}
          />
        </ChartCard>
        <ChartCard titulo="Investimento em treinamento por ano" altura={260}>
          <BarChart
            labels={indicadores.investimentoPorAno.map((c) => c.chave)}
            valores={indicadores.investimentoPorAno.map((c) => c.valor)}
            formatarValor={(v) => formatarMoeda(v) ?? ""}
          />
        </ChartCard>
      </div>
    </div>
  );
}
