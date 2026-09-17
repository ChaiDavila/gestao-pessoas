"use client";

import "./chart-setup";
import { Doughnut } from "react-chartjs-2";
import { ArcElement } from "chart.js";
import { Chart as ChartJS } from "chart.js";
import type { ChartEvent, ActiveElement } from "chart.js";
import { COR_TEXTO, OPCOES_BASE } from "./chart-setup";

ChartJS.register(ArcElement);

// Paleta categórica curta (2-3 fatias): laranja da marca + tons neutros de cinza,
// nunca mais de 3 cores nesta tela (ver skill de dataviz — séries pequenas cabem
// direto na legenda, sem precisar de paleta extensa).
const CORES = ["#E84E0F", "#434342", "#9A9A98"];

export function DoughnutChart({
  labels,
  valores,
  aoClicarFatia,
}: {
  labels: string[];
  valores: number[];
  aoClicarFatia?: (index: number) => void;
}) {
  const data = {
    labels,
    datasets: [
      {
        data: valores,
        backgroundColor: CORES.slice(0, labels.length),
        borderColor: "#FFFFFF",
        borderWidth: 2,
      },
    ],
  };

  const options = {
    ...OPCOES_BASE,
    plugins: {
      ...OPCOES_BASE.plugins,
      legend: {
        display: true,
        position: "bottom" as const,
        labels: { color: COR_TEXTO, font: { size: 12 }, boxWidth: 12 },
      },
    },
    onClick: aoClicarFatia
      ? (_event: ChartEvent, elements: ActiveElement[]) => {
          if (elements.length > 0) aoClicarFatia(elements[0].index);
        }
      : undefined,
    onHover: aoClicarFatia
      ? (event: ChartEvent, elements: ActiveElement[]) => {
          const target = event.native?.target as HTMLElement | null;
          if (target) target.style.cursor = elements.length > 0 ? "pointer" : "default";
        }
      : undefined,
  };

  return <Doughnut data={data} options={options} />;
}
