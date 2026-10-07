"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ColaboradorForm } from "../colaborador-form";
import type { OpcoesFormulario } from "@/lib/data/colaboradores";
import type { FormState } from "../actions";
import type { SubRecursoState } from "./sub-recursos-actions";
import { DadosCadastraisView } from "./dados-cadastrais-view";
import { ContratoFuncaoView } from "./contrato-funcao-view";
import { DependentesTab } from "./dependentes-tab";
import { FormacaoTab } from "./formacao-tab";
import { HistoricoTab } from "./historico-tab";
import { ExamesTab } from "./exames-tab";
import { TreinamentosTab } from "./treinamentos-tab";
import { MovimentacoesTab } from "./movimentacoes-tab";
import type { ParticipacaoItem, NrColaboradorItem } from "@/lib/data/treinamentos";
import type { HistoricoEstruturaRow } from "@/lib/data/colaborador-detalhe";

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

export function TabsFicha({
  colaboradorId,
  nome,
  opcoes,
  valoresIniciais,
  atualizarAction,
  modo,
  aoCancelarEdicao,
  aoSalvarEdicao,
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
  participacoesTreinamentos,
  nrAcompanhamento,
  historicoEstrutura,
}: {
  colaboradorId: string;
  nome: string;
  opcoes: OpcoesFormulario;
  valoresIniciais: Valores;
  atualizarAction: (
    prevState: FormState,
    formData: FormData,
  ) => Promise<FormState>;
  modo: "ver" | "editar";
  aoCancelarEdicao: () => void;
  aoSalvarEdicao: () => void;
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
  participacoesTreinamentos: ParticipacaoItem[];
  nrAcompanhamento: NrColaboradorItem[];
  historicoEstrutura: HistoricoEstruturaRow[];
}) {
  if (modo === "editar") {
    return (
      <div className="pt-4">
        <ColaboradorForm
          action={atualizarAction}
          opcoes={opcoes}
          valoresIniciais={valoresIniciais}
          textoBotao="Salvar alterações"
          aoSalvar={aoSalvarEdicao}
          aoCancelar={aoCancelarEdicao}
        />
      </div>
    );
  }

  return (
    <Tabs defaultValue="dados">
      <TabsList>
        <TabsTrigger value="dados">Dados cadastrais</TabsTrigger>
        <TabsTrigger value="dependentes">Dependentes</TabsTrigger>
        <TabsTrigger value="historico">Histórico salarial</TabsTrigger>
        <TabsTrigger value="formacao">Formação</TabsTrigger>
        <TabsTrigger value="exames">ASO</TabsTrigger>
        <TabsTrigger value="treinamentos">Treinamentos</TabsTrigger>
        <TabsTrigger value="movimentacoes">Histórico de movimentações</TabsTrigger>
      </TabsList>

      <TabsContent value="dados" className="pt-4 space-y-6">
        <DadosCadastraisView colaborador={valoresIniciais} />

        <div className="border-t border-border pt-6">
          <h3 className="mb-4 text-sm font-semibold text-foreground">
            Contrato e função
          </h3>
          <ContratoFuncaoView colaborador={valoresIniciais} />
        </div>
      </TabsContent>

      <TabsContent value="dependentes" className="pt-4">
        <DependentesTab
          dependentes={dependentes}
          adicionarAction={adicionarDependenteAction}
          atualizarAction={atualizarDependenteAction}
          removerAction={removerDependenteAction}
        />
      </TabsContent>

      <TabsContent value="historico" className="pt-4">
        <HistoricoTab
          historico={historico}
          cargoAtualNome={
            typeof valoresIniciais.cargo_nome === "string"
              ? valoresIniciais.cargo_nome
              : null
          }
          opcoesCargo={opcoes.cargos}
          opcoesMotivo={opcoesMotivoEvolucao}
          adicionarAction={adicionarHistoricoAction}
          removerAction={removerHistoricoAction}
        />
      </TabsContent>

      <TabsContent value="formacao" className="pt-4">
        <FormacaoTab
          formacoes={formacoes}
          opcoesNivel={opcoesNivelFormacao}
          adicionarAction={adicionarFormacaoAction}
          atualizarAction={atualizarFormacaoAction}
          removerAction={removerFormacaoAction}
        />
      </TabsContent>

      <TabsContent value="exames" className="pt-4">
        <ExamesTab
          colaboradorId={colaboradorId}
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
      </TabsContent>

      <TabsContent value="treinamentos" className="pt-4">
        <TreinamentosTab
          nome={nome}
          participacoes={participacoesTreinamentos}
          nrAcompanhamento={nrAcompanhamento}
        />
      </TabsContent>

      <TabsContent value="movimentacoes" className="pt-4">
        <MovimentacoesTab
          historico={historicoEstrutura}
          dataAdmissao={
            typeof valoresIniciais.data_admissao === "string"
              ? valoresIniciais.data_admissao
              : null
          }
        />
      </TabsContent>
    </Tabs>
  );
}
