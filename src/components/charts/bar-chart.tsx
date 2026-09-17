"use client";

import "./chart-setup";
import { Bar } from "react-chartjs-2";
import type { ChartEvent, ActiveElement } from "chart.js";
import { COR_DADO, COR_DADO_HOVER, COR_GRID, COR_TEXTO, OPCOES_BASE } from "./chart-setup";

const COR_SERIE_2 = "#434342";
const COR_SERIE_2_HOVER = "#2A2A29";

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
  // Arredonda só a ponta "solta" da barra (topo, nas verticais; direita, nas horizontais),
  // deixando a ponta encostada na linha de base reta — ver skill de dataviz, marks-and-anatomy.
  const borderRadius = horizontal
    ? { topLeft: 0, bottomLeft: 0, topRight: 4, bottomRight: 4 }
    : { topLeft: 4, topRight: 4, bottomLeft: 0, bottomRight: 0 };

  const datasets = series
    ? series.map((s, i) => ({
        label: s.rotulo,
        data: s.valores,
        backgroundColor: s.cor ?? (i === 0 ? COR_DADO : COR_SERIE_2),
        hoverBackgroundColor: s.cor ?? (i === 0 ? COR_DADO_HOVER : COR_SERIE_2_HOVER),
        borderRadius,
        borderSkipped: false,
        maxBarThickness: 28,
        categoryPercentage: series.length > 1 ? 0.6 : 0.55,
        barPercentage: 0.9,
      }))
    : [
        {
          data: valores ?? [],
          backgroundColor: COR_DADO,
          hoverBackgroundColor: COR_DADO_HOVER,
          borderRadius,
          borderSkipped: false,
          maxBarThickness: 28,
          categoryPercentage: 0.55,
          barPercentage: 0.9,
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
        ticks: horizontal
          ? { color: COR_TEXTO, font: { size: 11 }, maxTicksLimit: 6, precision: 0 }
          : { color: COR_TEXTO, font: { size: 11 } },
      },
      y: {
        grid: { color: COR_GRID, display: horizontal },
        border: { display: false },
        ticks: horizontal
          ? { color: COR_TEXTO, font: { size: 11 } }
          : { color: COR_TEXTO, font: { size: 11 }, maxTicksLimit: 6, precision: 0 },
      },
    },
  };

  return <Bar data={data} options={options} />;
}
