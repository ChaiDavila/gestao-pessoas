"use client";

import { useActionState, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/native-select";
import { BotaoRemover } from "@/components/botao-remover";
import {
  criarItemCatalogo,
  atualizarItemCatalogo,
  removerItemCatalogo,
} from "./catalogo-actions";
import type { CatalogoFormState } from "./catalogo-actions";

export type ColunaCatalogo = {
  chave: string;
  rotulo: string;
  tipo: "text" | "number" | "select";
  opcoes?: { value: string; label: string }[];
  obrigatorio?: boolean;
};

export function TabelaCatalogo({
  titulo,
  descricao,
  tabela,
  colunas,
  itens,
}: {
  titulo: string;
  descricao?: string;
  tabela: string;
  colunas: ColunaCatalogo[];
  itens: Record<string, unknown>[];
}) {
  const campos = colunas.map((c) => c.chave);

  return (
    <div className="flex h-full flex-col rounded-lg border border-border bg-card p-4">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-foreground">{titulo}</h3>
          {descricao && (
            <p className="mt-0.5 text-xs text-muted-foreground">{descricao}</p>
          )}
        </div>
        <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
          {itens.length}
        </span>
      </div>

      <FormularioAdicionar colunas={colunas} tabela={tabela} campos={campos} />

      <div className="mt-3 overflow-x-auto rounded-md border border-border">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border text-xs uppercase text-muted-foreground">
            <tr>
              {colunas.map((c) => (
                <th key={c.chave} className="px-3 py-2 font-medium">
                  {c.rotulo}
                </th>
              ))}
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {itens.map((item) => (
              <LinhaCatalogo
                key={String(item.id)}
                item={item}
                colunas={colunas}
                tabela={tabela}
                campos={campos}
              />
            ))}
            {itens.length === 0 && (
              <tr>
                <td
                  colSpan={colunas.length + 1}
                  className="px-3 py-6 text-center text-muted-foreground"
                >
                  Nenhum item cadastrado ainda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function LinhaCatalogo({
  item,
  colunas,
  tabela,
  campos,
}: {
  item: Record<string, unknown>;
  colunas: ColunaCatalogo[];
  tabela: string;
  campos: string[];
}) {
  const [editando, setEditando] = useState(false);
  const action = atualizarItemCatalogo.bind(null, tabela, String(item.id), campos);
  const [state, formAction, pending] = useActionState<CatalogoFormState, FormData>(
    action,
    undefined,
  );

  useEffect(() => {
    if (state && "ok" in state) setEditando(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  if (editando) {
    return (
      <tr className="border-b border-border bg-muted/20 last:border-0">
        <td colSpan={colunas.length + 1} className="p-3">
          <form action={formAction} className="flex flex-wrap items-end gap-2">
            {state && "error" in state && (
              <p className="w-full rounded-md bg-danger-bg px-3 py-2 text-sm text-danger">
                {state.error}
              </p>
            )}
            {colunas.map((c) => (
              <CampoCatalogo key={c.chave} coluna={c} valorInicial={item[c.chave]} />
            ))}
            <Button type="submit" size="sm" disabled={pending}>
              {pending ? "Salvando..." : "Salvar"}
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => setEditando(false)}>
              Cancelar
            </Button>
          </form>
        </td>
      </tr>
    );
  }

  return (
    <tr className="border-b border-border last:border-0 hover:bg-muted/30">
      {colunas.map((c) => (
        <td key={c.chave} className="px-3 py-2 text-foreground">
          {c.tipo === "select"
            ? c.opcoes?.find((o) => o.value === item[c.chave])?.label ?? String(item[c.chave] ?? "—")
            : String(item[c.chave] ?? "—")}
        </td>
      ))}
      <td className="px-3 py-2 text-right">
        <div className="flex justify-end gap-1">
          <Button variant="ghost" size="sm" onClick={() => setEditando(true)}>
            Editar
          </Button>
          <BotaoRemover action={() => removerItemCatalogo(tabela, String(item.id))} />
        </div>
      </td>
    </tr>
  );
}

function FormularioAdicionar({
  colunas,
  tabela,
  campos,
}: {
  colunas: ColunaCatalogo[];
  tabela: string;
  campos: string[];
}) {
  const action = criarItemCatalogo.bind(null, tabela, campos);
  const [state, formAction, pending] = useActionState<CatalogoFormState, FormData>(
    action,
    undefined,
  );
  const [chaveForm, setChaveForm] = useState(0);

  useEffect(() => {
    if (state && "ok" in state) setChaveForm((k) => k + 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <form
      key={chaveForm}
      action={formAction}
      className="flex flex-wrap items-end gap-2 rounded-md bg-[#faf9f7] p-3"
    >
      {state && "error" in state && (
        <p className="w-full rounded-md bg-danger-bg px-3 py-2 text-sm text-danger">
          {state.error}
        </p>
      )}
      {colunas.map((c) => (
        <CampoCatalogo key={c.chave} coluna={c} />
      ))}
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "Adicionando..." : "+ Adicionar"}
      </Button>
    </form>
  );
}

function CampoCatalogo({
  coluna,
  valorInicial,
}: {
  coluna: ColunaCatalogo;
  valorInicial?: unknown;
}) {
  if (coluna.tipo === "select") {
    return (
      <NativeSelect
        name={coluna.chave}
        required={coluna.obrigatorio}
        defaultValue={valorInicial != null ? String(valorInicial) : ""}
        className="w-40"
      >
        <option value="" disabled>
          {coluna.rotulo}
        </option>
        {coluna.opcoes?.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </NativeSelect>
    );
  }

  return (
    <Input
      name={coluna.chave}
      type={coluna.tipo}
      required={coluna.obrigatorio}
      defaultValue={valorInicial != null ? String(valorInicial) : ""}
      placeholder={coluna.rotulo}
      className="w-36 flex-1"
    />
  );
}
