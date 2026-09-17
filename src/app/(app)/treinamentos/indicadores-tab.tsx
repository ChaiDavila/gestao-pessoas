"use client";

import { useMemo, useState } from "react";
import { NativeSelect } from "@/components/native-select";
import { StatTile } from "@/components/stat-tile";
import { ChartCard } from "@/components/chart-card";
import { BarChart } from "@/components/charts/bar-chart";
import { LineChart } from "@/components/charts/line-chart";
import { formatarMoeda } from "@/lib/formatacao";
import { calcularIndicadores } from "@/lib/treinamentos-indicadores";
import type { ParticipacaoItem, TreinamentoItem } from "@/lib/data/treinamentos";

export function IndicadoresTab({
  treinamentos,
  participacoes,
}: {
  treinamentos: TreinamentoItem[];
  participacoes: ParticipacaoItem[];
}) {
  const [ano, setAno] = useState<string>("");

  const indicadores = useMemo(
    () => calcularIndicadores(treinamentos, participacoes, ano || undefined),
    [treinamentos, participacoes, ano],
  );

  return (
    <div className="space-y-6">
      <div className="w-48 space-y-1">
        <label className="text-xs font-medium text-muted-foreground">Ano</label>
        <NativeSelect value={ano} onChange={(e) => setAno(e.target.value)}>
          <option value="">Todos os anos</option>
          {indicadores.anosDisponiveis.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </NativeSelect>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatTile
          label="Horas totais"
          valor={`${indicadores.horasTotais.toLocaleString("pt-BR")}h`}
          accent
        />
        <StatTile
          label="Investimento total"
          valor={formatarMoeda(indicadores.investimentoTotal) ?? "R$ 0,00"}
        />
        <StatTile
          label="Custo médio por colaborador"
          valor={formatarMoeda(indicadores.custoMedioPorColaborador) ?? "R$ 0,00"}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard titulo="Horas por categoria">
          <BarChart
            labels={indicadores.horasPorCategoria.map((c) => c.chave)}
            valores={indicadores.horasPorCategoria.map((c) => c.valor)}
            formatarValor={(v) => `${v}h`}
          />
        </ChartCard>
        <ChartCard titulo="Investimento por categoria">
          <BarChart
            labels={indicadores.investimentoPorCategoria.map((c) => c.chave)}
            valores={indicadores.investimentoPorCategoria.map((c) => c.valor)}
            formatarValor={(v) => formatarMoeda(v) ?? ""}
          />
        </ChartCard>
        <ChartCard titulo="Horas por setor">
          <BarChart
            horizontal
            labels={indicadores.horasPorSetor.map((c) => c.chave)}
            valores={indicadores.horasPorSetor.map((c) => c.valor)}
            formatarValor={(v) => `${v}h`}
          />
        </ChartCard>
        <ChartCard titulo="Ranking: top 10 colaboradores por horas">
          <BarChart
            horizontal
            labels={indicadores.rankingColaboradores.map((c) => c.chave)}
            valores={indicadores.rankingColaboradores.map((c) => c.valor)}
            formatarValor={(v) => `${v}h`}
          />
        </ChartCard>
        <ChartCard titulo="Investimento por ano" altura={260}>
          <LineChart
            labels={indicadores.investimentoPorAno.map((c) => c.chave)}
            valores={indicadores.investimentoPorAno.map((c) => c.valor)}
            formatarValor={(v) => formatarMoeda(v) ?? ""}
          />
        </ChartCard>
      </div>
    </div>
  );
}
