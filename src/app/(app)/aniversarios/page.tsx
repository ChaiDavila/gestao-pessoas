import { getColaboradoresAniversario } from "@/lib/data/aniversarios";
import { AniversariosClient } from "./aniversarios-client";

export default async function AniversariosPage() {
  const colaboradores = await getColaboradoresAniversario();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">
          Aniversários
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Aniversariantes do mês e aniversários de empresa (tempo de casa).
        </p>
      </div>

      <AniversariosClient colaboradores={colaboradores} />
    </div>
  );
}
