"use client";

import "./chart-setup";
import { Line } from "react-chartjs-2";
import { COR_DADO, COR_GRID, COR_TEXTO, OPCOES_BASE } from "./chart-setup";

export function LineChart({
  labels,
  valores,
  formatarValor,
}: {
  labels: string[];
  valores: number[];
  formatarValor?: (v: number) => string;
}) {
  const data = {
    labels,
    datasets: [
      {
        data: valores,
        borderColor: COR_DADO,
        backgroundColor: `${COR_DADO}1A`,
        borderWidth: 2,
        pointRadius: 4,
        pointBackgroundColor: COR_DADO,
        pointBorderColor: "#FFFFFF",
        pointBorderWidth: 2,
        fill: true,
        tension: 0.2,
      },
    ],
  };

  const options = {
    ...OPCOES_BASE,
    plugins: {
      ...OPCOES_BASE.plugins,
      tooltip: {
        ...OPCOES_BASE.plugins.tooltip,
        callbacks: formatarValor
          ? {
              label: (ctx: { parsed: { y: number | null } }) =>
                formatarValor(ctx.parsed.y ?? 0),
            }
          : undefined,
      },
    },
    scales: {
      x: {
        grid: { display: false },
        border: { display: false },
        ticks: { color: COR_TEXTO, font: { size: 11 } },
      },
      y: {
        grid: { color: COR_GRID },
        border: { display: false },
        ticks: { color: COR_TEXTO, font: { size: 11 } },
      },
    },
  };

  return <Line data={data} options={options} />;
}
