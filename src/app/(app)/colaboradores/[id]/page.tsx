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
import { StatusBadge } from "@/components/status-badge";
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
import { TabsFicha } from "./tabs-ficha";
import { DesligamentoPanel } from "./desligamento-panel";
import { ExcluirColaboradorButton } from "./excluir-button";

export default async function ColaboradorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

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
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold text-foreground">
              {colaborador.nome}
            </h1>
            <StatusBadge
              tone={colaborador.status_rh === "ativo" ? "success" : "neutral"}
            >
              {colaborador.status_rh === "ativo" ? "Ativo" : "Desligado"}
            </StatusBadge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Matrícula {colaborador.matricula}
            {colaborador.cargo_nome ? ` · ${colaborador.cargo_nome}` : ""}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <DesligamentoPanel
            statusRh={colaborador.status_rh}
            desativarAction={desativarColaborador.bind(null, id)}
            reativarAction={reativarColaborador.bind(null, id)}
            motivos={motivosDesligamento}
          />
          <ExcluirColaboradorButton
            action={excluirColaborador.bind(null, id)}
            nome={colaborador.nome}
          />
        </div>
      </div>

      <TabsFicha
        opcoes={opcoes}
        valoresIniciais={colaborador}
        atualizarAction={atualizarColaborador.bind(null, id)}
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
    </div>
  );
}
