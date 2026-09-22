"use client";

import { BarChart } from "@/components/charts/bar-chart";

type ItemEvolucaoAnual = {
  ano: string;
  desligamentos: number;
};

export function EvolucaoAnualChart({ dados }: { dados: ItemEvolucaoAnual[] }) {
  return (
    <BarChart
      labels={dados.map((a) => a.ano)}
      valores={dados.map((a) => a.desligamentos)}
      linhasTooltip={(i) => {
        const a = dados[i];
        return [`${a.desligamentos} desligamento${a.desligamentos === 1 ? "" : "s"}`];
      }}
    />
  );
}
