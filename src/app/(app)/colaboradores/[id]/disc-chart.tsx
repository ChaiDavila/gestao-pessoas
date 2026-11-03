"use client";

import { ChartCard } from "@/components/chart-card";
import { BarChart } from "@/components/charts/bar-chart";
import { DISC_CORES } from "@/lib/perfil-comportamental";

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
  return (
    <ChartCard titulo="Estilo DISC Natural">
      <BarChart
        labels={["D", "I", "S", "C"]}
        valores={[d, i, s, c]}
        cores={[DISC_CORES.d, DISC_CORES.i, DISC_CORES.s, DISC_CORES.c]}
      />
    </ChartCard>
  );
}
