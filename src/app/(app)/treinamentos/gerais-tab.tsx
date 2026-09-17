"use client";

import { useActionState, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/native-select";
import { PainelAdicionar } from "@/components/painel-adicionar";
import { BotaoRemover } from "@/components/botao-remover";
import { formatarData } from "@/lib/date";
import { formatarMoeda } from "@/lib/formatacao";
import type { TreinamentoItem } from "@/lib/data/treinamentos";
import { criarTreinamentoGeral, atualizarTreinamentoGeral, removerTreinamento } from "./actions";
import type { TreinamentoFormState } from "./actions";
import { SelecaoParticipantes } from "./selecao-participantes";

type Colaborador = { id: string; nome: string; setor_nome: string | null };

export function GeraisTab({
  treinamentos,
  categorias,
  colaboradoresAtivos,
}: {
  treinamentos: TreinamentoItem[];
  categorias: { id: string; nome: string }[];
  colaboradoresAtivos: Colaborador[];
}) {
  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-2 font-medium">Nome</th>
              <th className="px-4 py-2 font-medium">Categoria</th>
              <th className="px-4 py-2 font-medium">Data</th>
              <th className="px-4 py-2 font-medium">Carga horária</th>
              <th className="px-4 py-2 font-medium">Custo</th>
              <th className="px-4 py-2 font-medium">Instrutor</th>
              <th className="px-4 py-2 font-medium">Participantes</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody>
            {treinamentos.map((t) => (
              <LinhaTreinamentoGeral key={t.id} treinamento={t} categorias={categorias} />
            ))}
            {treinamentos.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-6 text-center text-muted-foreground">
                  Nenhum treinamento geral registrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <PainelAdicionar rotulo="+ Novo treinamento geral">
        {(fechar) => (
          <FormularioTreinamentoGeral
            categorias={categorias}
            colaboradoresAtivos={colaboradoresAtivos}
            aoSalvar={fechar}
          />
        )}
      </PainelAdicionar>
    </div>
  );
}

function LinhaTreinamentoGeral({
  treinamento,
  categorias,
}: {
  treinamento: TreinamentoItem;
  categorias: { id: string; nome: string }[];
}) {
  const [editando, setEditando] = useState(false);

  if (editando) {
    return (
      <tr className="border-b border-border last:border-0">
        <td colSpan={8} className="px-4 py-3">
          <FormularioEdicaoTreinamentoGeral
            treinamento={treinamento}
            categorias={categorias}
            aoSalvar={() => setEditando(false)}
            aoCancelar={() => setEditando(false)}
          />
        </td>
      </tr>
    );
  }

  return (
    <tr className="border-b border-border last:border-0">
      <td className="px-4 py-2 font-medium text-foreground">{treinamento.nome}</td>
      <td className="px-4 py-2 text-muted-foreground">{treinamento.categoria_nome ?? "—"}</td>
      <td className="px-4 py-2 text-muted-foreground">{formatarData(treinamento.data)}</td>
      <td className="px-4 py-2 text-muted-foreground">{treinamento.carga_horaria}h</td>
      <td className="px-4 py-2 text-muted-foreground">
        {formatarMoeda(treinamento.custo_total) ?? "—"}
      </td>
      <td className="px-4 py-2 text-muted-foreground">{treinamento.instrutor ?? "—"}</td>
      <td className="px-4 py-2 text-muted-foreground">{treinamento.total_participantes}</td>
      <td className="px-4 py-2 text-right">
        <div className="flex justify-end gap-1">
          <Button type="button" variant="ghost" size="sm" onClick={() => setEditando(true)}>
            Editar
          </Button>
          <BotaoRemover
            action={() => removerTreinamento(treinamento.id)}
            confirmar="Remover este treinamento? Todas as participações vinculadas somem junto."
          />
        </div>
      </td>
    </tr>
  );
}

function FormularioEdicaoTreinamentoGeral({
  treinamento,
  categorias,
  aoSalvar,
  aoCancelar,
}: {
  treinamento: TreinamentoItem;
  categorias: { id: string; nome: string }[];
  aoSalvar: () => void;
  aoCancelar: () => void;
}) {
  const [state, formAction, pending] = useActionState<TreinamentoFormState, FormData>(
    atualizarTreinamentoGeral.bind(null, treinamento.id),
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
        <div className="space-y-1.5">
          <Label htmlFor="tge_nome">Nome</Label>
          <Input id="tge_nome" name="nome" required defaultValue={treinamento.nome} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="tge_categoria">Categoria</Label>
          <NativeSelect
            id="tge_categoria"
            name="categoria_id"
            required
            defaultValue={treinamento.categoria_id ?? ""}
          >
            <option value="" disabled>
              Selecione...
            </option>
            {categorias.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </NativeSelect>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="tge_data">Data</Label>
          <Input id="tge_data" name="data" type="date" required defaultValue={treinamento.data} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="tge_carga">Carga horária</Label>
          <Input
            id="tge_carga"
            name="carga_horaria"
            type="number"
            step="0.5"
            required
            defaultValue={treinamento.carga_horaria}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="tge_custo">Custo total</Label>
          <Input
            id="tge_custo"
            name="custo_total"
            type="number"
            step="0.01"
            defaultValue={treinamento.custo_total ?? ""}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="tge_instrutor">Instrutor</Label>
          <Input id="tge_instrutor" name="instrutor" defaultValue={treinamento.instrutor ?? ""} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="tge_vencimento">Vencimento (opcional)</Label>
          <Input
            id="tge_vencimento"
            name="data_vencimento"
            type="date"
            defaultValue={treinamento.data_vencimento ?? ""}
          />
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={aoCancelar}>
          Cancelar
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? "Salvando..." : "Salvar"}
        </Button>
      </div>
    </form>
  );
}

function FormularioTreinamentoGeral({
  categorias,
  colaboradoresAtivos,
  aoSalvar,
}: {
  categorias: { id: string; nome: string }[];
  colaboradoresAtivos: Colaborador[];
  aoSalvar: () => void;
}) {
  const [state, formAction, pending] = useActionState<TreinamentoFormState, FormData>(
    criarTreinamentoGeral,
    undefined,
  );
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set());

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
        <div className="space-y-1.5">
          <Label htmlFor="tg_nome">Nome</Label>
          <Input id="tg_nome" name="nome" required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="tg_categoria">Categoria</Label>
          <NativeSelect id="tg_categoria" name="categoria_id" required defaultValue="">
            <option value="" disabled>
              Selecione...
            </option>
            {categorias.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </NativeSelect>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="tg_data">Data</Label>
          <Input id="tg_data" name="data" type="date" required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="tg_carga">Carga horária</Label>
          <Input id="tg_carga" name="carga_horaria" type="number" step="0.5" required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="tg_custo">Custo total</Label>
          <Input id="tg_custo" name="custo_total" type="number" step="0.01" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="tg_instrutor">Instrutor</Label>
          <Input id="tg_instrutor" name="instrutor" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="tg_vencimento">Vencimento (opcional)</Label>
          <Input id="tg_vencimento" name="data_vencimento" type="date" />
        </div>
      </div>

      <SelecaoParticipantes
        colaboradores={colaboradoresAtivos}
        selecionados={selecionados}
        onChange={setSelecionados}
      />

      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Salvando..." : "Criar treinamento"}
        </Button>
      </div>
    </form>
  );
}
