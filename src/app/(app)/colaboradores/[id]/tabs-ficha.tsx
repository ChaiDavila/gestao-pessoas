"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ColaboradorForm } from "../colaborador-form";
import type { OpcoesFormulario } from "@/lib/data/colaboradores";
import type { FormState } from "../actions";
import type { SubRecursoState } from "./sub-recursos-actions";
import { DependentesTab } from "./dependentes-tab";
import { FormacaoTab } from "./formacao-tab";
import { HistoricoTab } from "./historico-tab";
import { ExamesTab } from "./exames-tab";

type Valores = Record<string, string | number | null | undefined>;
type AcaoComEstado = (
  prevState: SubRecursoState,
  formData: FormData,
) => Promise<SubRecursoState>;

export function TabsFicha({
  opcoes,
  valoresIniciais,
  atualizarAction,
  dependentes,
  adicionarDependenteAction,
  removerDependenteAction,
  formacoes,
  opcoesNivelFormacao,
  adicionarFormacaoAction,
  removerFormacaoAction,
  historico,
  opcoesMotivoEvolucao,
  adicionarHistoricoAction,
  removerHistoricoAction,
  asoRegistros,
  examesComplementares,
  opcoesExame,
  adicionarAsoAction,
  removerAsoAction,
  adicionarExameAction,
  removerExameAction,
}: {
  opcoes: OpcoesFormulario;
  valoresIniciais: Valores;
  atualizarAction: (
    prevState: FormState,
    formData: FormData,
  ) => Promise<FormState>;
  dependentes: Parameters<typeof DependentesTab>[0]["dependentes"];
  adicionarDependenteAction: AcaoComEstado;
  removerDependenteAction: (dependenteId: string) => Promise<void>;
  formacoes: Parameters<typeof FormacaoTab>[0]["formacoes"];
  opcoesNivelFormacao: { id: string; nome: string }[];
  adicionarFormacaoAction: AcaoComEstado;
  removerFormacaoAction: (formacaoId: string) => Promise<void>;
  historico: Parameters<typeof HistoricoTab>[0]["historico"];
  opcoesMotivoEvolucao: { id: string; motivo: string }[];
  adicionarHistoricoAction: AcaoComEstado;
  removerHistoricoAction: (historicoId: string) => Promise<void>;
  asoRegistros: Parameters<typeof ExamesTab>[0]["asoRegistros"];
  examesComplementares: Parameters<typeof ExamesTab>[0]["examesComplementares"];
  opcoesExame: Parameters<typeof ExamesTab>[0]["opcoesExame"];
  adicionarAsoAction: AcaoComEstado;
  removerAsoAction: (asoId: string) => Promise<void>;
  adicionarExameAction: AcaoComEstado;
  removerExameAction: (exameRegistroId: string) => Promise<void>;
}) {
  return (
    <Tabs defaultValue="dados">
      <TabsList>
        <TabsTrigger value="dados">Dados cadastrais e contrato</TabsTrigger>
        <TabsTrigger value="dependentes">Dependentes</TabsTrigger>
        <TabsTrigger value="formacao">Formação</TabsTrigger>
        <TabsTrigger value="historico">Histórico salarial</TabsTrigger>
        <TabsTrigger value="exames">Exames ocupacionais</TabsTrigger>
      </TabsList>

      <TabsContent value="dados" className="pt-4">
        <ColaboradorForm
          action={atualizarAction}
          opcoes={opcoes}
          valoresIniciais={valoresIniciais}
          textoBotao="Salvar alterações"
        />
      </TabsContent>

      <TabsContent value="dependentes" className="pt-4">
        <DependentesTab
          dependentes={dependentes}
          adicionarAction={adicionarDependenteAction}
          removerAction={removerDependenteAction}
        />
      </TabsContent>

      <TabsContent value="formacao" className="pt-4">
        <FormacaoTab
          formacoes={formacoes}
          opcoesNivel={opcoesNivelFormacao}
          adicionarAction={adicionarFormacaoAction}
          removerAction={removerFormacaoAction}
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

      <TabsContent value="exames" className="pt-4">
        <ExamesTab
          asoRegistros={asoRegistros}
          examesComplementares={examesComplementares}
          opcoesExame={opcoesExame}
          adicionarAsoAction={adicionarAsoAction}
          removerAsoAction={removerAsoAction}
          adicionarExameAction={adicionarExameAction}
          removerExameAction={removerExameAction}
        />
      </TabsContent>
    </Tabs>
  );
}
