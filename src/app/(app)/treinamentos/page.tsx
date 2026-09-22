import {
  getTreinamentos,
  getParticipacoes,
  getNrPorColaborador,
  getConfigCategoriasTreinamento,
  getConfigNrsCatalogo,
} from "@/lib/data/treinamentos";
import { getColaboradoresAtivos } from "@/lib/data/colaboradores";
import { exigirAcessoTela } from "@/lib/auth";
import { TreinamentosClient } from "./treinamentos-client";

export default async function TreinamentosPage() {
  await exigirAcessoTela("treinamentos");
  const [treinamentos, participacoes, nrPorColaborador, categorias, nrsCatalogo, colaboradoresAtivos] =
    await Promise.all([
      getTreinamentos(),
      getParticipacoes(),
      getNrPorColaborador(),
      getConfigCategoriasTreinamento(),
      getConfigNrsCatalogo(),
      getColaboradoresAtivos(),
    ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Treinamentos</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Indicadores, treinamentos gerais, NR e visão por colaborador.
        </p>
      </div>

      <TreinamentosClient
        treinamentos={treinamentos}
        participacoes={participacoes}
        nrPorColaborador={nrPorColaborador}
        categorias={categorias}
        nrsCatalogo={nrsCatalogo}
        colaboradoresAtivos={colaboradoresAtivos}
      />
    </div>
  );
}
