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
    <div className="max-w-xs">
      <ChartCard titulo="Estilo DISC Natural" altura={200}>
        <BarChart
          labels={["D", "I", "S", "C"]}
          valores={[d, i, s, c]}
          cores={[DISC_CORES.d, DISC_CORES.i, DISC_CORES.s, DISC_CORES.c]}
        />
      </ChartCard>
    </div>
  );
}
