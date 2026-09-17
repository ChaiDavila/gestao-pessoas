"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { NativeSelect } from "@/components/native-select";
import { BotaoRemover } from "@/components/botao-remover";
import { PainelAdicionar } from "@/components/painel-adicionar";
import type { PgrItem } from "@/lib/data/catalogos";
import { adicionarPgr, removerPgr, registrarPgrLote } from "./pgr-actions";
import type { PgrFormState } from "./pgr-actions";

type Cargo = { id: string; nome: string };
type TipoExame = { id: string; nome: string; periodicidade_meses: number | null };

export function PgrTab({
  pgrItens,
  cargos,
  tiposExame,
}: {
  pgrItens: PgrItem[];
  cargos: Cargo[];
  tiposExame: TipoExame[];
}) {
  const porCargo = useMemo(() => {
    const mapa = new Map<string, PgrItem[]>();
    for (const p of pgrItens) {
      if (!mapa.has(p.cargo_id)) mapa.set(p.cargo_id, []);
      mapa.get(p.cargo_id)!.push(p);
    }
    return cargos
      .map((c) => ({ cargo: c, itens: mapa.get(c.id) ?? [] }))
      .filter((c) => c.itens.length > 0)
      .sort((a, b) => a.cargo.nome.localeCompare(b.cargo.nome));
  }, [pgrItens, cargos]);

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Exames complementares exigidos por função (PGR). A periodicidade vem do
        catálogo de exames, não é escolhida aqui.
      </p>

      <div className="space-y-2">
        {porCargo.map(({ cargo, itens }) => (
          <LinhaCargo
            key={cargo.id}
            cargo={cargo}
            itens={itens}
            tiposExame={tiposExame}
          />
        ))}
        {porCargo.length === 0 && (
          <p className="rounded-lg border border-border p-6 text-center text-sm text-muted-foreground">
            Nenhum exame exigido cadastrado ainda.
          </p>
        )}
      </div>

      <PainelAdicionar rotulo="+ Cadastro rápido em lote">
        {(fechar) => (
          <FormularioLote cargos={cargos} tiposExame={tiposExame} aoSalvar={fechar} />
        )}
      </PainelAdicionar>
    </div>
  );
}

function LinhaCargo({
  cargo,
  itens,
  tiposExame,
}: {
  cargo: Cargo;
  itens: PgrItem[];
  tiposExame: TipoExame[];
}) {
  const [aberto, setAberto] = useState(false);
  const exameIdsAtuais = new Set(itens.map((i) => i.exame_id));
  const disponiveis = tiposExame.filter((e) => !exameIdsAtuais.has(e.id));

  return (
    <div className="rounded-lg border border-border">
      <button
        type="button"
        onClick={() => setAberto(!aberto)}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
      >
        <p className="font-medium text-foreground">{cargo.nome}</p>
        <p className="text-xs text-muted-foreground">{itens.length} exame(s)</p>
      </button>
      {aberto && (
        <div className="border-t border-border p-4">
          <ul className="space-y-1">
            {itens.map((item) => {
              const exame = tiposExame.find((e) => e.id === item.exame_id);
              return (
                <li
                  key={item.id}
                  className="flex items-center justify-between border-b border-border py-1.5 text-sm last:border-0"
                >
                  <span>
                    {exame?.nome ?? "—"}
                    {exame?.periodicidade_meses
                      ? ` (a cada ${exame.periodicidade_meses} meses)`
                      : " (somente admissão)"}
                  </span>
                  <BotaoRemover action={() => removerPgr(item.id)} />
                </li>
              );
            })}
          </ul>
          {disponiveis.length > 0 && (
            <AdicionarExameCargo cargoId={cargo.id} opcoes={disponiveis} />
          )}
        </div>
      )}
    </div>
  );
}

function AdicionarExameCargo({
  cargoId,
  opcoes,
}: {
  cargoId: string;
  opcoes: TipoExame[];
}) {
  const [exameId, setExameId] = useState("");
  const action = exameId
    ? adicionarPgr.bind(null, cargoId, exameId)
    : async (prevState: PgrFormState) => prevState;
  const [state, formAction, pending] = useActionState<PgrFormState, FormData>(
    action,
    undefined,
  );

  useEffect(() => {
    if (state && "ok" in state) setExameId("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <form action={formAction} className="mt-3 flex items-end gap-2">
      {state && "error" in state && (
        <p className="rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">{state.error}</p>
      )}
      <NativeSelect
        value={exameId}
        onChange={(e) => setExameId(e.target.value)}
        className="w-64"
      >
        <option value="">Adicionar exame...</option>
        {opcoes.map((e) => (
          <option key={e.id} value={e.id}>
            {e.nome}
          </option>
        ))}
      </NativeSelect>
      <Button type="submit" size="sm" disabled={pending || !exameId}>
        {pending ? "Adicionando..." : "Adicionar"}
      </Button>
    </form>
  );
}

function FormularioLote({
  cargos,
  tiposExame,
  aoSalvar,
}: {
  cargos: Cargo[];
  tiposExame: TipoExame[];
  aoSalvar: () => void;
}) {
  const [state, formAction, pending] = useActionState<PgrFormState, FormData>(
    registrarPgrLote,
    undefined,
  );

  useEffect(() => {
    if (state && "ok" in state) aoSalvar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <form
      action={formAction}
      className="max-w-3xl space-y-4 rounded-lg border border-border bg-card p-4"
    >
      {state && "error" in state && (
        <p className="rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">
          {state.error}
        </p>
      )}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
            Funções
          </p>
          <div className="grid max-h-48 grid-cols-1 gap-1 overflow-y-auto rounded-md border border-border p-2">
            {cargos.map((c) => (
              <label key={c.id} className="flex items-center gap-2 text-sm">
                <Checkbox name="cargos" value={c.id} />
                {c.nome}
              </label>
            ))}
          </div>
        </div>
        <div>
          <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
            Exames
          </p>
          <div className="grid max-h-48 grid-cols-1 gap-1 overflow-y-auto rounded-md border border-border p-2">
            {tiposExame.map((e) => (
              <label key={e.id} className="flex items-center gap-2 text-sm">
                <Checkbox name="exames" value={e.id} />
                {e.nome}
              </label>
            ))}
          </div>
        </div>
      </div>
      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? "Aplicando..." : "Aplicar"}
        </Button>
      </div>
    </form>
  );
}
