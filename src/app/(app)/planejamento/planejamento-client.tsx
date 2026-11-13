"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/native-select";
import {
  agruparPorAcao,
  calcularPendencias,
  ehVerba,
  hojeLocalISO,
  isoData,
  type AcaoPlanejamento,
  type CategoriaPlanejamento,
  type DespesaPlanejamento,
  type TarefaPlanejamento,
} from "@/lib/planejamento";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VisaoMensal } from "./visao-mensal";
import { VisaoAnual } from "./visao-anual";
import { Orcamentos } from "./orcamentos";
import { AcaoDialog, type EditorEstado } from "./acao-dialog";

export function PlanejamentoClient({
  acoes,
  tarefas,
  despesas,
  categorias,
  podeEditar,
}: {
  acoes: AcaoPlanejamento[];
  tarefas: TarefaPlanejamento[];
  despesas: DespesaPlanejamento[];
  categorias: CategoriaPlanejamento[];
  podeEditar: boolean;
}) {
  const [{ ano, mes }, setPeriodo] = useState(() => {
    const d = new Date();
    return { ano: d.getFullYear(), mes: d.getMonth() };
  });
  const [categoriaId, setCategoriaId] = useState("");
  // O ano/mês acima é compartilhado entre as abas: navegar na visão anual muda o ano da
  // mensal, e clicar num mês da visão anual abre a mensal naquele mês.
  const [aba, setAba] = useState("mensal");
  const [editor, setEditor] = useState<EditorEstado>({ modo: "fechado" });

  const categoriasPorId = useMemo(() => new Map(categorias.map((c) => [c.id, c])), [categorias]);
  const tarefasPorAcao = useMemo(() => agruparPorAcao(tarefas), [tarefas]);
  const despesasPorAcao = useMemo(() => agruparPorAcao(despesas), [despesas]);

  // Filtro de categoria vale para todas as visões, inclusive pendências.
  const acoesFiltradas = useMemo(
    () => (categoriaId ? acoes.filter((a) => a.categoria_id === categoriaId) : acoes),
    [acoes, categoriaId],
  );
  // Verbas anuais só existem na aba Orçamentos; mensal, anual e pendências não as veem.
  const acoesPlanejaveis = useMemo(() => acoesFiltradas.filter((a) => !ehVerba(a)), [acoesFiltradas]);
  const pendencias = useMemo(
    () => calcularPendencias(acoesPlanejaveis, tarefasPorAcao),
    [acoesPlanejaveis, tarefasPorAcao],
  );

  function abrirAcao(id: string) {
    setEditor({ modo: "editar", acaoId: id });
  }

  function novaAcao(dataSugerida?: string) {
    const hoje = hojeLocalISO();
    const mesmoMes = hoje.slice(0, 7) === isoData(ano, mes, 1).slice(0, 7);
    setEditor({ modo: "novo", dataSugerida: dataSugerida ?? (mesmoMes ? hoje : isoData(ano, mes, 1)) });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Planejamento de Gente</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Ações, atividades, prazos, checklists e orçamentos da área de RH em um só lugar.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <NativeSelect
            value={categoriaId}
            onChange={(e) => setCategoriaId(e.target.value)}
            className="w-56"
            aria-label="Filtrar por categoria"
          >
            <option value="">Todas as categorias</option>
            {categorias
              .filter((c) => c.ativo)
              .map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
          </NativeSelect>
          {podeEditar && <Button onClick={() => novaAcao()}>+ Nova ação / atividade</Button>}
        </div>
      </div>

      <Tabs value={aba} onValueChange={(v) => setAba(String(v))}>
        <TabsList>
          <TabsTrigger value="mensal">Visão mensal</TabsTrigger>
          <TabsTrigger value="anual">Visão anual</TabsTrigger>
          <TabsTrigger value="orcamentos">Orçamentos</TabsTrigger>
        </TabsList>

        <TabsContent value="mensal" className="pt-4">
          <VisaoMensal
            ano={ano}
            mes={mes}
            onMudarMes={(a, m) => setPeriodo({ ano: a, mes: m })}
            acoes={acoesPlanejaveis}
            tarefasPorAcao={tarefasPorAcao}
            pendencias={pendencias}
            categoriasPorId={categoriasPorId}
            podeEditar={podeEditar}
            onAbrirAcao={abrirAcao}
            onNovaAcao={novaAcao}
          />
        </TabsContent>

        <TabsContent value="anual" className="pt-4">
          <VisaoAnual
            ano={ano}
            onMudarAno={(a) => setPeriodo({ ano: a, mes })}
            onAbrirMes={(m) => {
              setPeriodo({ ano, mes: m });
              setAba("mensal");
            }}
            acoes={acoesPlanejaveis}
            categoriasPorId={categoriasPorId}
          />
        </TabsContent>

        <TabsContent value="orcamentos" className="pt-4">
          <Orcamentos
            ano={ano}
            onMudarAno={(a) => setPeriodo({ ano: a, mes })}
            acoes={acoesFiltradas}
            despesasPorAcao={despesasPorAcao}
            categoriasPorId={categoriasPorId}
            onAbrirAcao={abrirAcao}
            onNovaVerba={
              podeEditar
                ? () => setEditor({ modo: "novo", dataSugerida: isoData(ano, 0, 1), tipoInicial: "verba" })
                : undefined
            }
          />
        </TabsContent>
      </Tabs>

      <AcaoDialog
        estado={editor}
        onFechar={() => setEditor({ modo: "fechado" })}
        acoes={acoes}
        tarefasPorAcao={tarefasPorAcao}
        despesasPorAcao={despesasPorAcao}
        categorias={categorias}
        podeEditar={podeEditar}
      />
    </div>
  );
}
