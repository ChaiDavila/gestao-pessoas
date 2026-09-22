"use client";

import { BarChart } from "@/components/charts/bar-chart";

type ItemEvolucaoAnual = {
  ano: string;
  desligamentos: number;
  headcountMedio: number;
  taxa: number | null;
};

export function EvolucaoAnualChart({ dados }: { dados: ItemEvolucaoAnual[] }) {
  return (
    <BarChart
      labels={dados.map((a) => a.ano)}
      valores={dados.map((a) => a.desligamentos)}
      linhasTooltip={(i) => {
        const a = dados[i];
        return [
          `Desligamentos: ${a.desligamentos}`,
          `Taxa de desligamento: ${a.taxa !== null ? `${a.taxa.toFixed(1)}%` : "sem dados"}`,
          `Headcount médio: ${a.headcountMedio.toFixed(0)}`,
        ];
      }}
    />
  );
}
