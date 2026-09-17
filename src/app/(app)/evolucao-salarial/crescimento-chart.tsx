"use client";

import { ChartCard } from "@/components/chart-card";
import { BarChart } from "@/components/charts/bar-chart";

// Client wrapper: BarChart precisa da função formatarValor no tooltip, e uma função não
// pode ser passada como prop de um Server Component direto para um Client Component.
export function CrescimentoFolhaChart({
  labels,
  valores,
}: {
  labels: string[];
  valores: number[];
}) {
  return (
    <ChartCard titulo="Crescimento da folha salarial por ano (%)">
      <BarChart labels={labels} valores={valores} formatarValor={(v) => `${v}%`} />
    </ChartCard>
  );
}
