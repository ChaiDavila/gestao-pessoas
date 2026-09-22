import { getColaboradoresAniversario } from "@/lib/data/aniversarios";
import { exigirAcessoTela } from "@/lib/auth";
import { AniversariosClient } from "./aniversarios-client";

export default async function AniversariosPage() {
  await exigirAcessoTela("aniversarios");
  const colaboradores = await getColaboradoresAniversario();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">
          Aniversários
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Aniversariantes do mês e aniversários de empresa (tempo de casa) —
          para apoiar ações de endomarketing. Considera todos os
          colaboradores ativos, com qualquer quantidade de anos completados
          (não só marcos redondos).
        </p>
      </div>

      <AniversariosClient colaboradores={colaboradores} />
    </div>
  );
}
