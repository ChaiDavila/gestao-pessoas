"use client";

import { BarChart } from "@/components/charts/bar-chart";

type ItemPorSetor = {
  setor: string;
  desligamentos: number;
  headcountMedio: number;
  taxa: number | null;
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
          `Desligamentos: ${s.desligamentos}`,
          `HC médio do setor: ${s.headcountMedio.toFixed(0)}`,
          `Taxa: ${s.taxa !== null ? `${s.taxa.toFixed(1)}%` : "sem dados"}`,
        ];
      }}
    />
  );
}
