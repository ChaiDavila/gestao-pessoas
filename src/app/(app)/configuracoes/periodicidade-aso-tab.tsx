"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BotaoRemover } from "@/components/botao-remover";
import type { PeriodicidadeAsoItem } from "@/lib/data/catalogos";
import { definirPeriodicidadeAso, removerPeriodicidadeAso } from "./periodicidade-aso-actions";
import type { PeriodicidadeAsoFormState } from "./periodicidade-aso-actions";

type Cargo = { id: string; nome: string };

export function PeriodicidadeAsoTab({
  itens,
  cargos,
}: {
  itens: PeriodicidadeAsoItem[];
  cargos: Cargo[];
}) {
  const porCargo = useMemo(() => new Map(itens.map((i) => [i.cargo_id, i.periodicidade_meses])), [itens]);
  const cargosOrdenados = useMemo(() => cargos.slice().sort((a, b) => a.nome.localeCompare(b.nome)), [cargos]);

  return (
    <div className="overflow-x-auto rounded-md border border-border">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-border text-xs uppercase text-muted-foreground">
          <tr>
            <th className="px-3 py-2 font-medium">Função</th>
            <th className="px-3 py-2 font-medium">Periodicidade do ASO periódico</th>
            <th className="px-3 py-2" />
          </tr>
        </thead>
        <tbody>
          {cargosOrdenados.map((c) => (
            <LinhaCargo key={c.id} cargo={c} periodicidadeAtual={porCargo.get(c.id) ?? null} />
          ))}
          {cargosOrdenados.length === 0 && (
            <tr>
              <td colSpan={3} className="px-3 py-6 text-center text-muted-foreground">
                Nenhuma função cadastrada ainda.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function LinhaCargo({
  cargo,
  periodicidadeAtual,
}: {
  cargo: Cargo;
  periodicidadeAtual: number | null;
}) {
  const [editando, setEditando] = useState(false);
  const action = definirPeriodicidadeAso.bind(null, cargo.id);
  const [state, formAction, pending] = useActionState<PeriodicidadeAsoFormState, FormData>(
    action,
    undefined,
  );

  useEffect(() => {
    if (state && "ok" in state) setEditando(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <tr className="border-b border-border last:border-0">
      <td className="px-3 py-2 text-foreground">{cargo.nome}</td>
      <td className="px-3 py-2">
        {editando ? (
          <form action={formAction} className="flex items-center gap-2">
            {state && "error" in state && <p className="text-xs text-danger">{state.error}</p>}
            <Input
              name="periodicidade_meses"
              type="number"
              min={1}
              className="w-24"
              defaultValue={periodicidadeAtual ?? ""}
              autoFocus
            />
            <span className="text-xs text-muted-foreground">meses</span>
            <Button type="submit" size="sm" disabled={pending}>
              {pending ? "Salvando..." : "Salvar"}
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => setEditando(false)}>
              Cancelar
            </Button>
          </form>
        ) : periodicidadeAtual ? (
          `A cada ${periodicidadeAtual} meses`
        ) : (
          <span className="text-muted-foreground">Não configurada (vencimento manual)</span>
        )}
      </td>
      <td className="px-3 py-2 text-right">
        {!editando && (
          <div className="flex justify-end gap-1">
            <Button variant="ghost" size="sm" onClick={() => setEditando(true)}>
              {periodicidadeAtual ? "Editar" : "Configurar"}
            </Button>
            {periodicidadeAtual !== null && (
              <BotaoRemover action={() => removerPeriodicidadeAso(cargo.id)} />
            )}
          </div>
        )}
      </td>
    </tr>
  );
}
