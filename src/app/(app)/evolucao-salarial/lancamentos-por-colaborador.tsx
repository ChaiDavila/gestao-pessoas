"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ColaboradorAvatar } from "@/components/colaborador-avatar";
import { formatarData } from "@/lib/date";
import { formatarMoeda } from "@/lib/formatacao";
import type { EvolucaoSalarialItem } from "@/lib/data/evolucao-salarial";

export function LancamentosPorColaborador({
  lancamentos,
}: {
  lancamentos: EvolucaoSalarialItem[];
}) {
  // `lancamentos` já vem ordenado por data desc da query — preserva essa ordem dentro de
  // cada grupo (mais recente primeiro), só agrupa por colaborador sem reordenar.
  const porColaborador = useMemo(() => {
    const mapa = new Map<
      string,
      { nome: string; itens: EvolucaoSalarialItem[] }
    >();
    for (const l of lancamentos) {
      if (!mapa.has(l.colaborador_id)) {
        mapa.set(l.colaborador_id, { nome: l.colaborador_nome, itens: [] });
      }
      mapa.get(l.colaborador_id)!.itens.push(l);
    }
    return Array.from(mapa.entries()).sort((a, b) =>
      a[1].nome.localeCompare(b[1].nome),
    );
  }, [lancamentos]);

  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-card">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-border text-xs uppercase text-muted-foreground">
          <tr>
            <th className="w-8 px-3 py-3" />
            <th className="px-3 py-3 font-medium">Colaborador</th>
            <th className="px-3 py-3 font-medium">Alterações</th>
            <th className="px-3 py-3 font-medium">Mais recente</th>
            <th className="px-3 py-3 font-medium">Cargo atual</th>
            <th className="px-3 py-3 font-medium">Salário atual</th>
          </tr>
        </thead>
        <tbody>
          {porColaborador.map(([colaboradorId, info]) => (
            <LinhaColaborador key={colaboradorId} colaboradorId={colaboradorId} info={info} />
          ))}
          {porColaborador.length === 0 && (
            <tr>
              <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                Nenhum lançamento de evolução salarial encontrado para os
                filtros selecionados.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function LinhaColaborador({
  colaboradorId,
  info,
}: {
  colaboradorId: string;
  info: { nome: string; itens: EvolucaoSalarialItem[] };
}) {
  const [aberto, setAberto] = useState(false);
  const maisRecente = info.itens[0];

  return (
    <>
      <tr
        className="cursor-pointer border-b border-border last:border-0 hover:bg-muted/30"
        onClick={() => setAberto((v) => !v)}
      >
        <td className="px-3 py-3 text-center text-muted-foreground">{aberto ? "▾" : "▸"}</td>
        <td className="px-3 py-3">
          <div className="flex items-center gap-3">
            <ColaboradorAvatar nome={info.nome} size="sm" />
            <p className="font-medium text-foreground">{info.nome}</p>
          </div>
        </td>
        <td className="px-3 py-3 text-muted-foreground">{info.itens.length}</td>
        <td className="px-3 py-3 text-muted-foreground">{formatarData(maisRecente.data)}</td>
        <td className="px-3 py-3 text-muted-foreground">{maisRecente.cargo_novo ?? "—"}</td>
        <td className="px-3 py-3 font-medium text-foreground">
          {formatarMoeda(maisRecente.salario_novo) ?? "—"}
        </td>
      </tr>
      {aberto && (
        <tr className="border-b border-border bg-muted/20 last:border-0">
          <td />
          <td colSpan={5} className="p-4">
            <div className="mb-2 flex justify-end">
              <Link
                href={`/colaboradores/${colaboradorId}`}
                className="text-sm text-primary hover:underline"
              >
                Ver ficha do colaborador
              </Link>
            </div>
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="py-1 font-medium">Data</th>
                  <th className="py-1 font-medium">Cargo anterior</th>
                  <th className="py-1 font-medium">Cargo novo</th>
                  <th className="py-1 font-medium">Salário anterior</th>
                  <th className="py-1 font-medium">Salário novo</th>
                  <th className="py-1 font-medium">Motivo</th>
                </tr>
              </thead>
              <tbody>
                {info.itens.map((l) => (
                  <tr key={l.id} className="border-t border-border">
                    <td className="py-2 text-muted-foreground">{formatarData(l.data)}</td>
                    <td className="py-2 text-muted-foreground">{l.cargo_anterior ?? "—"}</td>
                    <td className="py-2">{l.cargo_novo ?? "—"}</td>
                    <td className="py-2 text-muted-foreground">
                      {formatarMoeda(l.salario_anterior) ?? "—"}
                    </td>
                    <td className="py-2 font-medium text-foreground">
                      {formatarMoeda(l.salario_novo) ?? "—"}
                    </td>
                    <td className="py-2 text-muted-foreground">{l.motivo_nome ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </td>
        </tr>
      )}
    </>
  );
}
