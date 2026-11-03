"use client";

import "@/components/charts/chart-setup";
import { Bar } from "react-chartjs-2";
import type { Chart, ChartData, Plugin } from "chart.js";
import { ChartCard } from "@/components/chart-card";
import { COR_GRID, COR_TEXTO } from "@/components/charts/chart-setup";
import { DISC_CORES } from "@/lib/perfil-comportamental";

const COR_LINHA_MEIO = "#434342";

// Escreve a pontuação de cada barra acima dela, pra não depender de hover (relatório
// TTI também mostra o número direto no gráfico).
const valoresNasBarras: Plugin<"bar"> = {
  id: "discValoresNasBarras",
  afterDatasetsDraw(chart: Chart) {
    const { ctx, chartArea } = chart;
    const meta = chart.getDatasetMeta(0);
    meta.data.forEach((elemento, index) => {
      const valor = chart.data.datasets[0].data[index] as number;
      const { x, y } = elemento.getProps(["x", "y"], true);
      ctx.save();
      ctx.fillStyle = COR_LINHA_MEIO;
      ctx.font = "bold 13px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "bottom";
      ctx.fillText(String(valor), x, Math.max(y - 6, chartArea.top + 14));
      ctx.restore();
    });
  },
};

export function DiscChart({
  d,
  i,
  s,
  c,
}: {
  d: number;
  i: number;
  s: number;
  c: number;
}) {
  const data: ChartData<"bar"> = {
    labels: ["D", "I", "S", "C"],
    datasets: [
      {
        data: [d, i, s, c],
        backgroundColor: [DISC_CORES.d, DISC_CORES.i, DISC_CORES.s, DISC_CORES.c],
        hoverBackgroundColor: [DISC_CORES.d, DISC_CORES.i, DISC_CORES.s, DISC_CORES.c],
        borderRadius: { topLeft: 4, topRight: 4, bottomLeft: 0, bottomRight: 0 },
        borderSkipped: false,
        maxBarThickness: 48,
        categoryPercentage: 0.6,
        barPercentage: 0.85,
      },
    ],
  };

  return (
    <div className="max-w-sm">
      <ChartCard titulo="Estilo DISC Natural" altura={280}>
        <Bar
          data={data}
          plugins={[valoresNasBarras]}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            animation: { duration: 250 },
            layout: { padding: { top: 20 } },
            plugins: {
              legend: { display: false },
              tooltip: { enabled: false },
            },
            scales: {
              x: {
                grid: { display: false },
                border: { display: false },
                ticks: { color: COR_TEXTO, font: { size: 12 } },
              },
              y: {
                min: 0,
                max: 100,
                border: { display: false },
                ticks: { stepSize: 25, color: COR_TEXTO, font: { size: 11 } },
                // Linha de referência em 50, mais forte que as demais (como no relatório TTI).
                grid: {
                  color: (ctx) => (ctx.tick.value === 50 ? COR_LINHA_MEIO : COR_GRID),
                  lineWidth: (ctx) => (ctx.tick.value === 50 ? 2 : 1),
                },
              },
            },
          }}
        />
      </ChartCard>
    </div>
  );
}
