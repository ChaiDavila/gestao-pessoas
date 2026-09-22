"use client";

import { LineChart } from "@/components/charts/line-chart";

type ItemTaxaAnual = {
  ano: string;
  taxa: number | null;
  headcountMedio: number;
};

export function TaxaAnualChart({ dados }: { dados: ItemTaxaAnual[] }) {
  return (
    <LineChart
      labels={dados.map((a) => a.ano)}
      valores={dados.map((a) => a.taxa ?? 0)}
      formatarValor={(v) => `${v.toFixed(1)}%`}
    />
  );
}
