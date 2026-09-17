"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ColaboradorAvatar } from "@/components/colaborador-avatar";
import { StatusBadge } from "@/components/status-badge";
import type { OpcoesFormulario } from "@/lib/data/colaboradores";
import type { FormState } from "../actions";
import type { SubRecursoState } from "./sub-recursos-actions";
import type { DesligamentoState } from "../actions";
import { DesligamentoDialog } from "./desligamento-dialog";
import { ExcluirColaboradorButton } from "./excluir-button";
import { TabsFicha } from "./tabs-ficha";
import { DependentesTab } from "./dependentes-tab";
import { FormacaoTab } from "./formacao-tab";
import { HistoricoTab } from "./historico-tab";
import { ExamesTab } from "./exames-tab";

type Valores = Record<string, string | number | null | undefined>;
type AcaoComEstado = (
  prevState: SubRecursoState,
  formData: FormData,
) => Promise<SubRecursoState>;
type AcaoComId = (
  subRecursoId: string,
  prevState: SubRecursoState,
  formData: FormData,
) => Promise<SubRecursoState>;

export function FichaColaboradorClient({
  colaborador,
  opcoes,
  modoInicial,
  atualizarAction,
  desativarAction,
  reativarAction,
  excluirAction,
  motivosDesligamento,
  dependentes,
  adicionarDependenteAction,
  atualizarDependenteAction,
  removerDependenteAction,
  formacoes,
  opcoesNivelFormacao,
  adicionarFormacaoAction,
  atualizarFormacaoAction,
  removerFormacaoAction,
  historico,
  opcoesMotivoEvolucao,
  adicionarHistoricoAction,
  removerHistoricoAction,
  asoRegistros,
  examesComplementares,
  opcoesExame,
  adicionarAsoAction,
  atualizarAsoAction,
  removerAsoAction,
  adicionarExameAction,
  atualizarExameAction,
  removerExameAction,
}: {
  colaborador: Valores;
  opcoes: OpcoesFormulario;
  modoInicial: "ver" | "editar";
  atualizarAction: (
    prevState: FormState,
    formData: FormData,
  ) => Promise<FormState>;
  desativarAction: (
    prevState: DesligamentoState,
    formData: FormData,
  ) => Promise<DesligamentoState>;
  reativarAction: () => Promise<void>;
  excluirAction: () => Promise<void>;
  motivosDesligamento: { id: string; motivo: string; tipo_padrao: string }[];
  dependentes: Parameters<typeof DependentesTab>[0]["dependentes"];
  adicionarDependenteAction: AcaoComEstado;
  atualizarDependenteAction: AcaoComId;
  removerDependenteAction: (dependenteId: string) => Promise<void>;
  formacoes: Parameters<typeof FormacaoTab>[0]["formacoes"];
  opcoesNivelFormacao: { id: string; nome: string }[];
  adicionarFormacaoAction: AcaoComEstado;
  atualizarFormacaoAction: AcaoComId;
  removerFormacaoAction: (formacaoId: string) => Promise<void>;
  historico: Parameters<typeof HistoricoTab>[0]["historico"];
  opcoesMotivoEvolucao: { id: string; motivo: string }[];
  adicionarHistoricoAction: AcaoComEstado;
  removerHistoricoAction: (historicoId: string) => Promise<void>;
  asoRegistros: Parameters<typeof ExamesTab>[0]["asoRegistros"];
  examesComplementares: Parameters<typeof ExamesTab>[0]["examesComplementares"];
  opcoesExame: Parameters<typeof ExamesTab>[0]["opcoesExame"];
  adicionarAsoAction: AcaoComEstado;
  atualizarAsoAction: AcaoComId;
  removerAsoAction: (asoId: string) => Promise<void>;
  adicionarExameAction: AcaoComEstado;
  atualizarExameAction: AcaoComId;
  removerExameAction: (exameRegistroId: string) => Promise<void>;
}) {
  const [modo, setModo] = useState<"ver" | "editar">(modoInicial);
  const nome = String(colaborador.nome ?? "");
  const ativo = colaborador.status_rh === "ativo";

  const subtitulo = [colaborador.cargo_nome, colaborador.setor_nome]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <ColaboradorAvatar nome={nome} size="lg" />
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-semibold text-foreground">{nome}</h2>
              <StatusBadge tone={ativo ? "success" : "neutral"}>
                {ativo ? "Ativo" : "Desligado"}
              </StatusBadge>
            </div>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {subtitulo}
              {subtitulo ? " · " : ""}Matrícula {colaborador.matricula}
            </p>
          </div>
        </div>

        {modo === "ver" && (
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={() => setModo("editar")}>
              Editar
            </Button>
            {ativo ? (
              <DesligamentoDialog
                desativarAction={desativarAction}
                motivos={motivosDesligamento}
              />
            ) : (
              <form action={reativarAction}>
                <Button type="submit" variant="outline" size="sm">
                  Reativar
                </Button>
              </form>
            )}
            <ExcluirColaboradorButton action={excluirAction} nome={nome} />
          </div>
        )}
      </div>

      <TabsFicha
        opcoes={opcoes}
        valoresIniciais={colaborador}
        atualizarAction={atualizarAction}
        modo={modo}
        aoCancelarEdicao={() => setModo("ver")}
        aoSalvarEdicao={() => setModo("ver")}
        dependentes={dependentes}
        adicionarDependenteAction={adicionarDependenteAction}
        atualizarDependenteAction={atualizarDependenteAction}
        removerDependenteAction={removerDependenteAction}
        formacoes={formacoes}
        opcoesNivelFormacao={opcoesNivelFormacao}
        adicionarFormacaoAction={adicionarFormacaoAction}
        atualizarFormacaoAction={atualizarFormacaoAction}
        removerFormacaoAction={removerFormacaoAction}
        historico={historico}
        opcoesMotivoEvolucao={opcoesMotivoEvolucao}
        adicionarHistoricoAction={adicionarHistoricoAction}
        removerHistoricoAction={removerHistoricoAction}
        asoRegistros={asoRegistros}
        examesComplementares={examesComplementares}
        opcoesExame={opcoesExame}
        adicionarAsoAction={adicionarAsoAction}
        atualizarAsoAction={atualizarAsoAction}
        removerAsoAction={removerAsoAction}
        adicionarExameAction={adicionarExameAction}
        atualizarExameAction={atualizarExameAction}
        removerExameAction={removerExameAction}
      />
    </div>
  );
}
