"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/native-select";
import {
  agruparPorAcao,
  calcularPendencias,
  hojeLocalISO,
  isoData,
  type AcaoPlanejamento,
  type CategoriaPlanejamento,
  type DespesaPlanejamento,
  type TarefaPlanejamento,
} from "@/lib/planejamento";
import { VisaoMensal } from "./visao-mensal";
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
  const [editor, setEditor] = useState<EditorEstado>({ modo: "fechado" });

  const categoriasPorId = useMemo(() => new Map(categorias.map((c) => [c.id, c])), [categorias]);
  const tarefasPorAcao = useMemo(() => agruparPorAcao(tarefas), [tarefas]);
  const despesasPorAcao = useMemo(() => agruparPorAcao(despesas), [despesas]);

  // Filtro de categoria vale para todas as visões, inclusive pendências.
  const acoesFiltradas = useMemo(
    () => (categoriaId ? acoes.filter((a) => a.categoria_id === categoriaId) : acoes),
    [acoes, categoriaId],
  );
  const pendencias = useMemo(
    () => calcularPendencias(acoesFiltradas, tarefasPorAcao),
    [acoesFiltradas, tarefasPorAcao],
  );

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

      <VisaoMensal
        ano={ano}
        mes={mes}
        onMudarMes={(a, m) => setPeriodo({ ano: a, mes: m })}
        acoes={acoesFiltradas}
        tarefasPorAcao={tarefasPorAcao}
        pendencias={pendencias}
        categoriasPorId={categoriasPorId}
        podeEditar={podeEditar}
        onAbrirAcao={(id) => setEditor({ modo: "editar", acaoId: id })}
        onNovaAcao={novaAcao}
      />

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
