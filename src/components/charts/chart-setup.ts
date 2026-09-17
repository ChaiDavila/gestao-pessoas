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
export const COR_DADO_HOVER = "#C43F0C";
export const COR_GRID = "#EDECE9";
export const COR_TEXTO = "#8A8987";

export const OPCOES_BASE = {
  responsive: true,
  maintainAspectRatio: false,
  animation: { duration: 250 },
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: "#434342",
      padding: 10,
      cornerRadius: 8,
      displayColors: false,
      titleFont: { size: 12, weight: 400 as const },
      bodyFont: { size: 13, weight: 600 as const },
    },
  },
};
