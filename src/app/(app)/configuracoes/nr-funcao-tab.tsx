"use client";

import { useActionState, useEffect, useMemo, useOptimistic, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { NativeSelect } from "@/components/native-select";
import { BotaoRemover } from "@/components/botao-remover";
import { PainelAdicionar } from "@/components/painel-adicionar";
import { StatusBadge } from "@/components/status-badge";
import type { NrFuncaoItem } from "@/lib/data/catalogos";
import {
  adicionarNrFuncao,
  removerNrFuncao,
  registrarNrFuncaoLote,
  definirNrMatrizConfirmada,
} from "./nr-funcao-actions";
import type { NrFuncaoFormState } from "./nr-funcao-actions";

type Cargo = { id: string; nome: string; nr_matriz_confirmada: boolean };
type NrCatalogo = { id: string; nr: string; nome: string; periodicidade_meses: number | null };

export function NrFuncaoTab({
  itens,
  cargos,
  nrsCatalogo,
}: {
  itens: NrFuncaoItem[];
  cargos: Cargo[];
  nrsCatalogo: NrCatalogo[];
}) {
  const porCargo = useMemo(() => {
    const mapa = new Map<string, NrFuncaoItem[]>();
    for (const i of itens) {
      if (!mapa.has(i.cargo_id)) mapa.set(i.cargo_id, []);
      mapa.get(i.cargo_id)!.push(i);
    }
    return cargos
      .map((c) => ({ cargo: c, itens: mapa.get(c.id) ?? [] }))
      .filter((c) => c.itens.length > 0 || c.cargo.nr_matriz_confirmada)
      .sort((a, b) => a.cargo.nome.localeCompare(b.cargo.nome));
  }, [itens, cargos]);

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        NRs exigidas por função. A periodicidade vem do catálogo de cursos de NR, não é
        escolhida aqui. Nada é marcado automaticamente — confirme &quot;Esta função não
        exige NR&quot; pras funções que você já conferiu e não precisam de nenhuma.
      </p>

      <div className="space-y-2">
        {porCargo.map(({ cargo, itens: itensCargo }) => (
          <LinhaCargo
            key={cargo.id}
            cargo={cargo}
            itens={itensCargo}
            nrsCatalogo={nrsCatalogo}
          />
        ))}
        {porCargo.length === 0 && (
          <p className="rounded-lg border border-border p-6 text-center text-sm text-muted-foreground">
            Nenhuma função configurada ainda.
          </p>
        )}
      </div>

      <PainelAdicionar rotulo="+ Cadastro rápido em lote">
        {(fechar) => (
          <FormularioLote cargos={cargos} nrsCatalogo={nrsCatalogo} aoSalvar={fechar} />
        )}
      </PainelAdicionar>
    </div>
  );
}

function LinhaCargo({
  cargo,
  itens,
  nrsCatalogo,
}: {
  cargo: Cargo;
  itens: NrFuncaoItem[];
  nrsCatalogo: NrCatalogo[];
}) {
  const [aberto, setAberto] = useState(false);
  // useOptimistic (não useState+useEffect) de propósito: a prop `cargo.nr_matriz_confirmada`
  // muda depois de outras ações (ex.: adicionar uma NR zera a confirmação) mesmo sem o
  // componente remontar (key estável) — isso garante que o checkbox sempre reflita o banco
  // assim que a revalidação chega, sem precisar sincronizar manualmente em um efeito.
  const [confirmada, setConfirmadaOtimista] = useOptimistic(cargo.nr_matriz_confirmada);
  const [pending, startTransition] = useTransition();
  const nrIdsAtuais = new Set(itens.map((i) => i.nr_catalogo_id));
  const disponiveis = nrsCatalogo.filter((n) => !nrIdsAtuais.has(n.id));

  return (
    <div className="rounded-lg border border-border">
      <button
        type="button"
        onClick={() => setAberto(!aberto)}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
      >
        <p className="font-medium text-foreground">{cargo.nome}</p>
        <div className="flex items-center gap-2">
          {itens.length === 0 && confirmada ? (
            <StatusBadge tone="neutral">Confirmado: não exige NR</StatusBadge>
          ) : (
            <p className="text-xs text-muted-foreground">{itens.length} NR(s)</p>
          )}
        </div>
      </button>
      {aberto && (
        <div className="border-t border-border p-4">
          <ul className="space-y-1">
            {itens.map((item) => {
              const nr = nrsCatalogo.find((n) => n.id === item.nr_catalogo_id);
              return (
                <li
                  key={item.id}
                  className="flex items-center justify-between border-b border-border py-1.5 text-sm last:border-0"
                >
                  <span>
                    {nr ? `${nr.nr} — ${nr.nome}` : "—"}
                    {nr?.periodicidade_meses ? ` (a cada ${nr.periodicidade_meses} meses)` : ""}
                  </span>
                  <BotaoRemover action={() => removerNrFuncao(item.id)} />
                </li>
              );
            })}
            {itens.length === 0 && (
              <li className="py-1.5 text-sm text-muted-foreground">
                Nenhuma NR exigida cadastrada.
              </li>
            )}
          </ul>
          <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
            {disponiveis.length > 0 && <AdicionarNrCargo cargoId={cargo.id} opcoes={disponiveis} />}
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <Checkbox
                checked={confirmada}
                disabled={pending}
                onCheckedChange={(v) => {
                  const novo = !!v;
                  startTransition(async () => {
                    setConfirmadaOtimista(novo);
                    await definirNrMatrizConfirmada(cargo.id, novo);
                  });
                }}
              />
              Esta função não exige nenhuma NR
            </label>
          </div>
        </div>
      )}
    </div>
  );
}

function AdicionarNrCargo({
  cargoId,
  opcoes,
}: {
  cargoId: string;
  opcoes: NrCatalogo[];
}) {
  const [nrId, setNrId] = useState("");
  const action = nrId
    ? adicionarNrFuncao.bind(null, cargoId, nrId)
    : async (prevState: NrFuncaoFormState) => prevState;
  const [state, formAction, pending] = useActionState<NrFuncaoFormState, FormData>(
    action,
    undefined,
  );

  useEffect(() => {
    if (state && "ok" in state) setNrId("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <form action={formAction} className="flex items-end gap-2">
      {state && "error" in state && (
        <p className="rounded-md bg-danger-bg px-3 py-2 text-sm text-danger">{state.error}</p>
      )}
      <NativeSelect value={nrId} onChange={(e) => setNrId(e.target.value)} className="w-64">
        <option value="">Adicionar NR...</option>
        {opcoes.map((n) => (
          <option key={n.id} value={n.id}>
            {n.nr} — {n.nome}
          </option>
        ))}
      </NativeSelect>
      <Button type="submit" size="sm" disabled={pending || !nrId}>
        {pending ? "Adicionando..." : "Adicionar"}
      </Button>
    </form>
  );
}

function FormularioLote({
  cargos,
  nrsCatalogo,
  aoSalvar,
}: {
  cargos: Cargo[];
  nrsCatalogo: NrCatalogo[];
  aoSalvar: () => void;
}) {
  const [state, formAction, pending] = useActionState<NrFuncaoFormState, FormData>(
    registrarNrFuncaoLote,
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
        <p className="rounded-md bg-danger-bg px-3 py-2 text-sm text-danger">{state.error}</p>
      )}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Funções</p>
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
            Cursos de NR
          </p>
          <div className="grid max-h-48 grid-cols-1 gap-1 overflow-y-auto rounded-md border border-border p-2">
            {nrsCatalogo.map((n) => (
              <label key={n.id} className="flex items-center gap-2 text-sm">
                <Checkbox name="nrs" value={n.id} />
                {n.nr} — {n.nome}
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
