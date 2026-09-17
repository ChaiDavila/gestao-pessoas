import { notFound } from "next/navigation";
import { getColaboradorPorId, getOpcoesFormulario } from "@/lib/data/colaboradores";
import { getMotivosDesligamento } from "@/lib/data/catalogos";
import {
  getDependentes,
  getFormacoes,
  getHistoricoSalarial,
  getAsoRegistros,
  getExamesComplementares,
  getConfigFormacoes,
  getConfigTiposExame,
  getMotivosEvolucaoSalarial,
} from "@/lib/data/colaborador-detalhe";
import {
  atualizarColaborador,
  desativarColaborador,
  excluirColaborador,
  reativarColaborador,
} from "../actions";
import {
  adicionarDependente,
  removerDependente,
  adicionarFormacao,
  removerFormacao,
  adicionarHistoricoSalarial,
  removerHistoricoSalarial,
  adicionarAso,
  removerAso,
  adicionarExameComplementar,
  removerExameComplementar,
} from "./sub-recursos-actions";
import { FichaColaboradorClient } from "./ficha-colaborador-client";

export async function FichaColaboradorContent({
  id,
  modoInicial = "ver",
}: {
  id: string;
  modoInicial?: "ver" | "editar";
}) {
  const colaborador = await getColaboradorPorId(id);
  if (!colaborador) notFound();

  const [
    opcoes,
    motivosDesligamento,
    dependentes,
    formacoes,
    historico,
    asoRegistros,
    examesComplementares,
    opcoesNivelFormacao,
    opcoesExame,
    opcoesMotivoEvolucao,
  ] = await Promise.all([
    getOpcoesFormulario(id),
    getMotivosDesligamento(),
    getDependentes(id),
    getFormacoes(id),
    getHistoricoSalarial(id),
    getAsoRegistros(id),
    getExamesComplementares(id),
    getConfigFormacoes(),
    getConfigTiposExame(),
    getMotivosEvolucaoSalarial(),
  ]);

  return (
    <FichaColaboradorClient
      colaborador={colaborador}
      opcoes={opcoes}
      modoInicial={modoInicial}
      atualizarAction={atualizarColaborador.bind(null, id)}
      desativarAction={desativarColaborador.bind(null, id)}
      reativarAction={reativarColaborador.bind(null, id)}
      excluirAction={excluirColaborador.bind(null, id)}
      motivosDesligamento={motivosDesligamento}
      dependentes={dependentes}
      adicionarDependenteAction={adicionarDependente.bind(null, id)}
      removerDependenteAction={removerDependente.bind(null, id)}
      formacoes={formacoes}
      opcoesNivelFormacao={opcoesNivelFormacao}
      adicionarFormacaoAction={adicionarFormacao.bind(null, id)}
      removerFormacaoAction={removerFormacao.bind(null, id)}
      historico={historico}
      opcoesMotivoEvolucao={opcoesMotivoEvolucao}
      adicionarHistoricoAction={adicionarHistoricoSalarial.bind(null, id)}
      removerHistoricoAction={removerHistoricoSalarial.bind(null, id)}
      asoRegistros={asoRegistros}
      examesComplementares={examesComplementares}
      opcoesExame={opcoesExame}
      adicionarAsoAction={adicionarAso.bind(null, id)}
      removerAsoAction={removerAso.bind(null, id)}
      adicionarExameAction={adicionarExameComplementar.bind(null, id)}
      removerExameAction={removerExameComplementar.bind(null, id)}
    />
  );
}
