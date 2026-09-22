"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type {
  NrColaboradorItem,
  ParticipacaoItem,
  TreinamentoItem,
} from "@/lib/data/treinamentos";
import { IndicadoresTab } from "./indicadores-tab";
import { GeraisTab } from "./gerais-tab";
import { NrTab } from "./nr-tab";
import { PorColaboradorTab } from "./por-colaborador-tab";

type Colaborador = { id: string; nome: string; setor_nome: string | null };

export function TreinamentosClient({
  treinamentosTodos,
  treinamentosGerais,
  participacoesPeriodo,
  participacoesPessoa,
  nrPorColaboradorPessoa,
  categorias,
  nrsCatalogo,
  colaboradoresAtivos,
  colaboradoresNoFiltro,
  periodoRotulo,
}: {
  treinamentosTodos: TreinamentoItem[];
  treinamentosGerais: TreinamentoItem[];
  participacoesPeriodo: ParticipacaoItem[];
  participacoesPessoa: ParticipacaoItem[];
  nrPorColaboradorPessoa: NrColaboradorItem[];
  categorias: { id: string; nome: string }[];
  nrsCatalogo: { id: string; nr: string; nome: string; periodicidade_meses: number | null }[];
  colaboradoresAtivos: Colaborador[];
  colaboradoresNoFiltro: Colaborador[];
  periodoRotulo: string;
}) {
  return (
    <Tabs defaultValue="indicadores">
      <TabsList>
        <TabsTrigger value="indicadores">Indicadores</TabsTrigger>
        <TabsTrigger value="gerais">Treinamentos gerais</TabsTrigger>
        <TabsTrigger value="nr">Treinamentos obrigatórios</TabsTrigger>
        <TabsTrigger value="colaborador">Por colaborador</TabsTrigger>
      </TabsList>

      <TabsContent value="indicadores" className="pt-4">
        <IndicadoresTab
          treinamentosTodos={treinamentosTodos}
          participacoesPeriodo={participacoesPeriodo}
          participacoesPessoa={participacoesPessoa}
          totalColaboradoresNoFiltro={colaboradoresNoFiltro.length}
          periodoRotulo={periodoRotulo}
        />
      </TabsContent>

      <TabsContent value="gerais" className="pt-4">
        <GeraisTab
          treinamentos={treinamentosGerais}
          categorias={categorias}
          colaboradoresAtivos={colaboradoresAtivos}
        />
      </TabsContent>

      <TabsContent value="nr" className="pt-4">
        <NrTab
          nrPorColaborador={nrPorColaboradorPessoa}
          nrsCatalogo={nrsCatalogo}
          colaboradoresAtivos={colaboradoresAtivos}
          colaboradoresNoFiltro={colaboradoresNoFiltro}
        />
      </TabsContent>

      <TabsContent value="colaborador" className="pt-4">
        <PorColaboradorTab participacoes={participacoesPeriodo} />
      </TabsContent>
    </Tabs>
  );
}
