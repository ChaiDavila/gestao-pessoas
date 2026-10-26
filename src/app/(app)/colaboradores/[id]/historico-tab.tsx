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
type AcaoComId = (
  historicoId: string,
  prevState: SubRecursoState,
  formData: FormData,
) => Promise<SubRecursoState>;

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
  corrigirAction,
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
  corrigirAction: AcaoComId;
  removerAction: (historicoId: string) => Promise<void>;
}) {
  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border text-xs uppercase text-muted-foreground">
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
              <LinhaHistorico
                key={h.id}
                item={h}
                cargoAtualNome={cargoAtualNome}
                opcoesCargo={opcoesCargo}
                opcoesMotivo={opcoesMotivo}
                corrigirAction={corrigirAction.bind(null, h.id)}
                removerAction={() => removerAction(h.id)}
              />
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
            textoBotao="Adicionar"
            aoSalvar={fechar}
          />
        )}
      </PainelAdicionar>
    </div>
  );
}

function LinhaHistorico({
  item,
  cargoAtualNome,
  opcoesCargo,
  opcoesMotivo,
  corrigirAction,
  removerAction,
}: {
  item: HistoricoItem;
  cargoAtualNome: string | null;
  opcoesCargo: { id: string; nome: string }[];
  opcoesMotivo: { id: string; motivo: string }[];
  corrigirAction: (
    prevState: SubRecursoState,
    formData: FormData,
  ) => Promise<SubRecursoState>;
  removerAction: () => Promise<void>;
}) {
  const [corrigindo, setCorrigindo] = useState(false);

  if (corrigindo) {
    return (
      <tr className="border-b border-border last:border-0">
        <td colSpan={7} className="px-4 py-3">
          <FormularioHistorico
            action={corrigirAction}
            cargoAtualNome={cargoAtualNome}
            opcoesCargo={opcoesCargo}
            opcoesMotivo={opcoesMotivo}
            valoresIniciais={item}
            textoBotao="Salvar correção"
            aoSalvar={() => setCorrigindo(false)}
            aoCancelar={() => setCorrigindo(false)}
          />
        </td>
      </tr>
    );
  }

  return (
    <tr className="border-b border-border last:border-0">
      <td className="px-4 py-2 text-muted-foreground">{formatarData(item.data)}</td>
      <td className="px-4 py-2 text-muted-foreground">{item.cargo_anterior ?? "—"}</td>
      <td className="px-4 py-2">{item.cargo_novo ?? "—"}</td>
      <td className="px-4 py-2 text-muted-foreground">
        {formatarMoeda(item.salario_anterior)}
      </td>
      <td className="px-4 py-2">{formatarMoeda(item.salario_novo)}</td>
      <td className="px-4 py-2 text-muted-foreground">
        {item.config_motivos_evolucao_salarial?.motivo ?? "—"}
      </td>
      <td className="px-4 py-2 text-right">
        <div className="flex justify-end gap-1">
          <Button type="button" variant="ghost" size="sm" onClick={() => setCorrigindo(true)}>
            Corrigir
          </Button>
          <BotaoRemover
            action={removerAction}
            confirmar="Remover este lançamento? Ele fica marcado como inativo (histórico de auditoria não é apagado de verdade)."
          />
        </div>
      </td>
    </tr>
  );
}

function FormularioHistorico({
  action,
  cargoAtualNome,
  opcoesCargo,
  opcoesMotivo,
  valoresIniciais,
  textoBotao,
  aoSalvar,
  aoCancelar,
}: {
  action: (
    prevState: SubRecursoState,
    formData: FormData,
  ) => Promise<SubRecursoState>;
  cargoAtualNome: string | null;
  opcoesCargo: { id: string; nome: string }[];
  opcoesMotivo: { id: string; motivo: string }[];
  valoresIniciais?: HistoricoItem;
  textoBotao: string;
  aoSalvar: () => void;
  aoCancelar?: () => void;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const hoje = hojeISO();
  const [data, setData] = useState(valoresIniciais?.data ?? hoje);
  const [atualizarAtual, setAtualizarAtual] = useState(
    (valoresIniciais?.data ?? hoje) === hoje,
  );
  const [cargoNovoId, setCargoNovoId] = useState(
    () => opcoesCargo.find((c) => c.nome === valoresIniciais?.cargo_novo)?.id ?? "",
  );

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
          <NativeSelect
            id="hist_motivo"
            name="motivo_id"
            defaultValue={valoresIniciais?.motivo_id ?? ""}
          >
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
            defaultValue={valoresIniciais?.cargo_anterior ?? cargoAtualNome ?? ""}
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
            defaultValue={valoresIniciais?.salario_anterior ?? ""}
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
            defaultValue={valoresIniciais?.salario_novo ?? ""}
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
        {aoCancelar && (
          <Button type="button" variant="ghost" onClick={aoCancelar}>
            Cancelar
          </Button>
        )}
        <Button type="submit" disabled={pending}>
          {pending ? "Salvando..." : textoBotao}
        </Button>
      </div>
    </form>
  );
}
