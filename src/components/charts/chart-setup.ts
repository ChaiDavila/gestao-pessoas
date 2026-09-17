import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Tooltip,
  Legend,
);

// Cor única de dado (gráficos aqui são todos de série única — comparação de magnitude
// ou tendência no tempo —, então a cor certa é um único tom sequencial, não uma paleta
// categórica: ver skill de dataviz, "Sequential is the safe default").
export const COR_DADO = "#E84E0F";
export const COR_GRID = "#DEDEDC";
export const COR_TEXTO = "#6B6B6A";

export const OPCOES_BASE = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: "#434342",
      padding: 10,
      cornerRadius: 6,
      titleFont: { size: 12, weight: 400 as const },
      bodyFont: { size: 13, weight: 600 as const },
    },
  },
};
