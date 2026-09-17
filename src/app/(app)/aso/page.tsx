import { getAsoColaboradores, getPgrColaboradores } from "@/lib/data/aso";
import { getConfigTiposExame } from "@/lib/data/colaborador-detalhe";
import { AsoClient } from "./aso-client";

export default async function AsoPage() {
  const [asoColaboradores, pgrColaboradores, tiposExame] = await Promise.all([
    getAsoColaboradores(),
    getPgrColaboradores(),
    getConfigTiposExame(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">ASO</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Situação de ASO e exames complementares exigidos por função (PGR), por
          colaborador.
        </p>
      </div>

      <AsoClient
        asoColaboradores={asoColaboradores}
        pgrColaboradores={pgrColaboradores}
        tiposExame={tiposExame}
      />
    </div>
  );
}
