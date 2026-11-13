import { exigirAcessoTela } from "@/lib/auth";
import {
  getAcoesPlanejamento,
  getCategoriasPlanejamento,
  getDespesasPlanejamento,
  getTarefasPlanejamento,
} from "@/lib/data/planejamento";
import { PlanejamentoClient } from "./planejamento-client";

export default async function PlanejamentoPage() {
  const usuario = await exigirAcessoTela("planejamento");

  const [acoes, tarefas, despesas, categorias] = await Promise.all([
    getAcoesPlanejamento(),
    getTarefasPlanejamento(),
    getDespesasPlanejamento(),
    getCategoriasPlanejamento(),
  ]);

  return (
    <PlanejamentoClient
      acoes={acoes}
      tarefas={tarefas}
      despesas={despesas}
      categorias={categorias}
      podeEditar={usuario.papel === "admin"}
    />
  );
}
