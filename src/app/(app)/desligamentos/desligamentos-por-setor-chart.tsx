"use client";

import { BarChart } from "@/components/charts/bar-chart";

type ItemPorSetor = {
  setor: string;
  desligamentos: number;
  percentualDoPeriodo: number;
};

export function DesligamentosPorSetorChart({ dados }: { dados: ItemPorSetor[] }) {
  return (
    <BarChart
      horizontal
      labels={dados.map((s) => s.setor)}
      valores={dados.map((s) => s.desligamentos)}
      linhasTooltip={(i) => {
        const s = dados[i];
        return [
          `${s.desligamentos} desligamento${s.desligamentos === 1 ? "" : "s"}`,
          `${s.percentualDoPeriodo}% dos desligamentos do período`,
        ];
      }}
    />
  );
}
