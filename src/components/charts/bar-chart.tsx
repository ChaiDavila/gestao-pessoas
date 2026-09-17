"use client";

import "./chart-setup";
import { Bar } from "react-chartjs-2";
import type { ChartEvent, ActiveElement } from "chart.js";
import { COR_DADO, COR_GRID, COR_TEXTO, OPCOES_BASE } from "./chart-setup";

const COR_SERIE_2 = "#434342";

type Serie = { rotulo: string; valores: number[]; cor?: string };

export function BarChart({
  labels,
  valores,
  series,
  horizontal = false,
  formatarValor,
  aoClicarBarra,
}: {
  labels: string[];
  valores?: number[];
  series?: Serie[];
  horizontal?: boolean;
  formatarValor?: (v: number) => string;
  aoClicarBarra?: (index: number) => void;
}) {
  const datasets = series
    ? series.map((s, i) => ({
        label: s.rotulo,
        data: s.valores,
        backgroundColor: s.cor ?? (i === 0 ? COR_DADO : COR_SERIE_2),
        borderRadius: 4,
        maxBarThickness: 24,
      }))
    : [
        {
          data: valores ?? [],
          backgroundColor: COR_DADO,
          borderRadius: 4,
          maxBarThickness: 24,
        },
      ];

  const data = { labels, datasets };
  const multiSerie = Boolean(series && series.length > 1);

  const options = {
    ...OPCOES_BASE,
    indexAxis: horizontal ? ("y" as const) : ("x" as const),
    onClick: aoClicarBarra
      ? (_event: ChartEvent, elements: ActiveElement[]) => {
          if (elements.length > 0) aoClicarBarra(elements[0].index);
        }
      : undefined,
    onHover: aoClicarBarra
      ? (event: ChartEvent, elements: ActiveElement[]) => {
          const target = event.native?.target as HTMLElement | null;
          if (target) target.style.cursor = elements.length > 0 ? "pointer" : "default";
        }
      : undefined,
    plugins: {
      ...OPCOES_BASE.plugins,
      legend: multiSerie
        ? { display: true, position: "bottom" as const, labels: { color: COR_TEXTO, font: { size: 12 }, boxWidth: 12 } }
        : OPCOES_BASE.plugins.legend,
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
