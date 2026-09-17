"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ColaboradorForm } from "../colaborador-form";
import type { OpcoesFormulario } from "@/lib/data/colaboradores";
import type { FormState } from "../actions";

type Valores = Record<string, string | number | null | undefined>;

export function TabsFicha({
  opcoes,
  valoresIniciais,
  atualizarAction,
}: {
  opcoes: OpcoesFormulario;
  valoresIniciais: Valores;
  atualizarAction: (
    prevState: FormState,
    formData: FormData,
  ) => Promise<FormState>;
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
        <PlaceholderAba texto="Cadastro de dependentes chega na próxima etapa." />
      </TabsContent>
      <TabsContent value="formacao" className="pt-4">
        <PlaceholderAba texto="Cadastro de formação chega na próxima etapa." />
      </TabsContent>
      <TabsContent value="historico" className="pt-4">
        <PlaceholderAba texto="Histórico salarial chega na próxima etapa." />
      </TabsContent>
      <TabsContent value="exames" className="pt-4">
        <PlaceholderAba texto="ASO e exames complementares chegam na próxima etapa." />
      </TabsContent>
    </Tabs>
  );
}

function PlaceholderAba({ texto }: { texto: string }) {
  return (
    <p className="rounded-lg border border-dashed border-border p-6 text-sm text-muted-foreground">
      {texto}
    </p>
  );
}
