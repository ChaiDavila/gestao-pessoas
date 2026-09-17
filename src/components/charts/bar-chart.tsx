"use client";

import "./chart-setup";
import { Bar } from "react-chartjs-2";
import { COR_DADO, COR_GRID, COR_TEXTO, OPCOES_BASE } from "./chart-setup";

export function BarChart({
  labels,
  valores,
  horizontal = false,
  formatarValor,
}: {
  labels: string[];
  valores: number[];
  horizontal?: boolean;
  formatarValor?: (v: number) => string;
}) {
  const data = {
    labels,
    datasets: [
      {
        data: valores,
        backgroundColor: COR_DADO,
        borderRadius: 4,
        maxBarThickness: 24,
      },
    ],
  };

  const options = {
    ...OPCOES_BASE,
    indexAxis: horizontal ? ("y" as const) : ("x" as const),
    plugins: {
      ...OPCOES_BASE.plugins,
      tooltip: {
        ...OPCOES_BASE.plugins.tooltip,
        callbacks: formatarValor
          ? {
              label: (ctx: { parsed: { x: number | null; y: number | null } }) =>
                formatarValor((horizontal ? ctx.parsed.x : ctx.parsed.y) ?? 0),
            }
          : undefined,
      },
    },
    scales: {
      x: {
        grid: { color: COR_GRID, display: !horizontal },
        border: { display: false },
        ticks: { color: COR_TEXTO, font: { size: 11 } },
      },
      y: {
        grid: { color: COR_GRID, display: horizontal },
        border: { display: false },
        ticks: { color: COR_TEXTO, font: { size: 11 } },
      },
    },
  };

  return <Bar data={data} options={options} />;
}
