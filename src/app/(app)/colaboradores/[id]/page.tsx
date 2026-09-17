import { notFound } from "next/navigation";
import { getColaboradorPorId, getOpcoesFormulario } from "@/lib/data/colaboradores";
import { getMotivosDesligamento } from "@/lib/data/catalogos";
import { StatusBadge } from "@/components/status-badge";
import {
  atualizarColaborador,
  desativarColaborador,
  excluirColaborador,
  reativarColaborador,
} from "../actions";
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

  const [opcoes, motivos] = await Promise.all([
    getOpcoesFormulario(id),
    getMotivosDesligamento(),
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
            motivos={motivos}
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
      />
    </div>
  );
}
