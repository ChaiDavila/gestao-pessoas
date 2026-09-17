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
import { criarTreinamentoGeral, removerTreinamento } from "./actions";
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
          <thead className="border-b border-border bg-muted/40 text-xs uppercase text-muted-foreground">
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
              <tr key={t.id} className="border-b border-border last:border-0">
                <td className="px-4 py-2 font-medium text-foreground">{t.nome}</td>
                <td className="px-4 py-2 text-muted-foreground">
                  {t.categoria_nome ?? "—"}
                </td>
                <td className="px-4 py-2 text-muted-foreground">
                  {formatarData(t.data)}
                </td>
                <td className="px-4 py-2 text-muted-foreground">
                  {t.carga_horaria}h
                </td>
                <td className="px-4 py-2 text-muted-foreground">
                  {formatarMoeda(t.custo_total) ?? "—"}
                </td>
                <td className="px-4 py-2 text-muted-foreground">
                  {t.instrutor ?? "—"}
                </td>
                <td className="px-4 py-2 text-muted-foreground">
                  {t.total_participantes}
                </td>
                <td className="px-4 py-2 text-right">
                  <BotaoRemover
                    action={() => removerTreinamento(t.id)}
                    confirmar="Remover este treinamento? Todas as participações vinculadas somem junto."
                  />
                </td>
              </tr>
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
