"use client";

import { useMemo, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
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
  treinamentos,
  participacoes,
  nrPorColaborador,
  categorias,
  nrsCatalogo,
  colaboradoresAtivos,
}: {
  treinamentos: TreinamentoItem[];
  participacoes: ParticipacaoItem[];
  nrPorColaborador: NrColaboradorItem[];
  categorias: { id: string; nome: string }[];
  nrsCatalogo: { id: string; nr: string; nome: string; periodicidade_meses: number | null }[];
  colaboradoresAtivos: Colaborador[];
}) {
  const [busca, setBusca] = useState("");

  const buscaLower = busca.trim().toLowerCase();

  const idsTreinamentoComBusca = useMemo(() => {
    if (!buscaLower) return null;
    const ids = new Set<string>();
    for (const p of participacoes) {
      if (p.colaborador_nome.toLowerCase().includes(buscaLower)) {
        ids.add(p.treinamento_id);
      }
    }
    return ids;
  }, [participacoes, buscaLower]);

  const treinamentosFiltrados = useMemo(() => {
    if (!idsTreinamentoComBusca) return treinamentos;
    return treinamentos.filter((t) => idsTreinamentoComBusca.has(t.id));
  }, [treinamentos, idsTreinamentoComBusca]);

  const participacoesFiltradas = useMemo(() => {
    if (!buscaLower) return participacoes;
    return participacoes.filter((p) =>
      p.colaborador_nome.toLowerCase().includes(buscaLower),
    );
  }, [participacoes, buscaLower]);

  const nrFiltrado = useMemo(() => {
    if (!buscaLower) return nrPorColaborador;
    return nrPorColaborador.filter((n) =>
      n.colaborador_nome.toLowerCase().includes(buscaLower),
    );
  }, [nrPorColaborador, buscaLower]);

  return (
    <Tabs defaultValue="indicadores">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <TabsList>
          <TabsTrigger value="indicadores">Indicadores</TabsTrigger>
          <TabsTrigger value="gerais">Treinamentos gerais</TabsTrigger>
          <TabsTrigger value="nr">Treinamentos obrigatórios (NR)</TabsTrigger>
          <TabsTrigger value="colaborador">Por colaborador</TabsTrigger>
        </TabsList>
        <Input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por nome do colaborador..."
          className="w-64"
        />
      </div>

      <TabsContent value="indicadores" className="pt-4">
        <IndicadoresTab
          treinamentos={treinamentosFiltrados}
          participacoes={participacoesFiltradas}
        />
      </TabsContent>

      <TabsContent value="gerais" className="pt-4">
        <GeraisTab
          treinamentos={treinamentosFiltrados.filter((t) => t.tipo === "geral")}
          categorias={categorias}
          colaboradoresAtivos={colaboradoresAtivos}
        />
      </TabsContent>

      <TabsContent value="nr" className="pt-4">
        <NrTab
          nrPorColaborador={nrFiltrado}
          nrsCatalogo={nrsCatalogo}
          colaboradoresAtivos={colaboradoresAtivos}
        />
      </TabsContent>

      <TabsContent value="colaborador" className="pt-4">
        <PorColaboradorTab participacoes={participacoesFiltradas} />
      </TabsContent>
    </Tabs>
  );
}
