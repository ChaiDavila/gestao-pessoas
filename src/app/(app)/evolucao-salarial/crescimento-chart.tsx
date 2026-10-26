"use client";

import { ChartCard } from "@/components/chart-card";
import { BarChart } from "@/components/charts/bar-chart";
import { formatarMoeda } from "@/lib/formatacao";
import type { CrescimentoAnoItem } from "@/lib/evolucao-salarial-indicadores";

// Client wrapper: BarChart precisa de funções no tooltip, e uma função não pode ser passada
// como prop de um Server Component direto para um Client Component.
export function CrescimentoFolhaChart({ itens }: { itens: CrescimentoAnoItem[] }) {
  const valores = itens.map((i) => (i.semDados ? 0 : i.percentual ?? 0));

  return (
    <ChartCard titulo="Crescimento da folha salarial por ano (%)">
      <BarChart
        labels={itens.map((i) => i.ano)}
        valores={valores}
        linhasTooltip={(index) => {
          const item = itens[index];
          if (item.semDados) return ["Sem lançamentos com salário nesse ano"];
          const linhas = [
            item.percentual !== null
              ? `${item.percentual >= 0 ? "+" : ""}${item.percentual.toFixed(1)}%`
              : "Sem base para calcular o percentual (valor inicial zero)",
            `Diferença: ${item.diferenca >= 0 ? "+" : "-"}${formatarMoeda(Math.abs(item.diferenca))}`,
          ];
          if (item.incompleto) {
            linhas.push("Histórico incompleto: algum lançamento do ano não tem salário informado");
          }
          return linhas;
        }}
      />
    </ChartCard>
  );
}
