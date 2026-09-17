"use client";

import { useActionState, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/native-select";
import { PainelAdicionar } from "@/components/painel-adicionar";
import { BotaoRemover } from "@/components/botao-remover";
import { formatarData, hojeISO } from "@/lib/date";
import type { SubRecursoState } from "./sub-recursos-actions";
import type { HistoricoRow } from "@/lib/data/colaborador-detalhe";

type HistoricoItem = HistoricoRow;

function formatarMoeda(valor: number | null) {
  if (valor == null) return "—";
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function HistoricoTab({
  historico,
  cargoAtualNome,
  opcoesCargo,
  opcoesMotivo,
  adicionarAction,
  removerAction,
}: {
  historico: HistoricoItem[];
  cargoAtualNome: string | null;
  opcoesCargo: { id: string; nome: string }[];
  opcoesMotivo: { id: string; motivo: string }[];
  adicionarAction: (
    prevState: SubRecursoState,
    formData: FormData,
  ) => Promise<SubRecursoState>;
  removerAction: (historicoId: string) => Promise<void>;
}) {
  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border bg-muted/40 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-2 font-medium">Data</th>
              <th className="px-4 py-2 font-medium">Cargo anterior</th>
              <th className="px-4 py-2 font-medium">Cargo novo</th>
              <th className="px-4 py-2 font-medium">Salário anterior</th>
              <th className="px-4 py-2 font-medium">Salário novo</th>
              <th className="px-4 py-2 font-medium">Motivo</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody>
            {historico.map((h) => (
              <tr key={h.id} className="border-b border-border last:border-0">
                <td className="px-4 py-2 text-muted-foreground">
                  {formatarData(h.data)}
                </td>
                <td className="px-4 py-2 text-muted-foreground">
                  {h.cargo_anterior ?? "—"}
                </td>
                <td className="px-4 py-2">{h.cargo_novo ?? "—"}</td>
                <td className="px-4 py-2 text-muted-foreground">
                  {formatarMoeda(h.salario_anterior)}
                </td>
                <td className="px-4 py-2">{formatarMoeda(h.salario_novo)}</td>
                <td className="px-4 py-2 text-muted-foreground">
                  {h.config_motivos_evolucao_salarial?.motivo ?? "—"}
                </td>
                <td className="px-4 py-2 text-right">
                  <BotaoRemover
                    action={() => removerAction(h.id)}
                    confirmar="Remover este lançamento? Ele fica marcado como inativo (histórico de auditoria não é apagado de verdade)."
                  />
                </td>
              </tr>
            ))}
            {historico.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-muted-foreground">
                  Nenhum lançamento de histórico salarial.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <PainelAdicionar rotulo="+ Adicionar lançamento">
        {(fechar) => (
          <FormularioHistorico
            action={adicionarAction}
            cargoAtualNome={cargoAtualNome}
            opcoesCargo={opcoesCargo}
            opcoesMotivo={opcoesMotivo}
            aoSalvar={fechar}
          />
        )}
      </PainelAdicionar>
    </div>
  );
}

function FormularioHistorico({
  action,
  cargoAtualNome,
  opcoesCargo,
  opcoesMotivo,
  aoSalvar,
}: {
  action: (
    prevState: SubRecursoState,
    formData: FormData,
  ) => Promise<SubRecursoState>;
  cargoAtualNome: string | null;
  opcoesCargo: { id: string; nome: string }[];
  opcoesMotivo: { id: string; motivo: string }[];
  aoSalvar: () => void;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const hoje = hojeISO();
  const [data, setData] = useState(hoje);
  const [atualizarAtual, setAtualizarAtual] = useState(true);
  const [cargoNovoId, setCargoNovoId] = useState("");

  useEffect(() => {
    if (state && "ok" in state) aoSalvar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  function aoMudarData(novaData: string) {
    setData(novaData);
    setAtualizarAtual(novaData === hoje);
  }

  const cargoNovoNome = opcoesCargo.find((c) => c.id === cargoNovoId)?.nome ?? "";

  return (
    <form
      action={formAction}
      className="max-w-2xl space-y-4 rounded-lg border border-border bg-card p-4"
    >
      {state && "error" in state && (
        <p className="rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">
          {state.error}
        </p>
      )}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="hist_data">Data</Label>
          <Input
            id="hist_data"
            name="data"
            type="date"
            required
            value={data}
            onChange={(e) => aoMudarData(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="hist_motivo">Motivo</Label>
          <NativeSelect id="hist_motivo" name="motivo_id" defaultValue="">
            <option value="">Nenhum</option>
            {opcoesMotivo.map((m) => (
              <option key={m.id} value={m.id}>
                {m.motivo}
              </option>
            ))}
          </NativeSelect>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="hist_cargo_anterior">Cargo anterior</Label>
          <Input
            id="hist_cargo_anterior"
            name="cargo_anterior"
            defaultValue={cargoAtualNome ?? ""}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="hist_cargo_novo">Cargo novo</Label>
          <NativeSelect
            id="hist_cargo_novo"
            name="cargo_novo_id"
            value={cargoNovoId}
            onChange={(e) => setCargoNovoId(e.target.value)}
          >
            <option value="">Sem alteração de cargo</option>
            {opcoesCargo.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </NativeSelect>
          <input type="hidden" name="cargo_novo_nome" value={cargoNovoNome} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="hist_salario_anterior">Salário anterior</Label>
          <Input
            id="hist_salario_anterior"
            name="salario_anterior"
            type="number"
            step="0.01"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="hist_salario_novo">Salário novo</Label>
          <Input
            id="hist_salario_novo"
            name="salario_novo"
            type="number"
            step="0.01"
            required
          />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={atualizarAtual}
          onChange={(e) => setAtualizarAtual(e.target.checked)}
        />
        Atualizar o cargo/salário atual do colaborador com este lançamento
      </label>
      <input
        type="hidden"
        name="atualizar_atual"
        value={atualizarAtual ? "true" : "false"}
      />
      <p
        className={
          atualizarAtual
            ? "rounded-md bg-success/10 px-3 py-2 text-sm text-success"
            : "rounded-md bg-warning/10 px-3 py-2 text-sm text-warning"
        }
      >
        {atualizarAtual
          ? "Isso vai atualizar o cargo/salário atual do colaborador."
          : "Isso NÃO vai atualizar o cargo/salário atual do colaborador (só registra no histórico)."}
      </p>

      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Salvando..." : "Adicionar"}
        </Button>
      </div>
    </form>
  );
}
