"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { NativeSelect } from "@/components/native-select";
import { Textarea } from "@/components/ui/textarea";
import { PainelAdicionar } from "@/components/painel-adicionar";
import { InfoBanner } from "@/components/info-banner";
import { BITRIX_USUARIOS, TIPO_EVENTO_LABEL } from "@/lib/constants/bitrix-usuarios";
import type { RegraBitrix } from "@/lib/data/bitrix-regras";
import {
  criarRegraBitrix,
  atualizarRegraBitrix,
  atualizarRegraBitrixAtiva,
  type BitrixFormState,
} from "./bitrix-actions";

const TIPOS_EVENTO = Object.keys(TIPO_EVENTO_LABEL);

export function BitrixTab({ regras }: { regras: RegraBitrix[] }) {
  return (
    <div className="space-y-4">
      <InfoBanner>
        Cada regra cria uma tarefa no Bitrix24 automaticamente, uma vez por
        evento (nunca duplica) — uma rotina roda 1x por dia conferindo quem
        se encaixa. O <strong>Responsável</strong> é obrigatório;{" "}
        <strong>Corresponsáveis</strong> é pra quando mais de uma pessoa
        precisa ficar sabendo (ex.: ASO e Treinamentos obrigatórios).
      </InfoBanner>

      <div className="rounded-lg border border-border bg-card p-4">
        <div className="mb-3 flex items-start justify-between gap-2">
          <h3 className="text-sm font-semibold text-foreground">
            Regras de notificação
          </h3>
          <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
            {regras.length}
          </span>
        </div>

        <PainelAdicionar rotulo="+ Nova regra">
          {(fechar) => <FormularioRegra aoSalvar={fechar} />}
        </PainelAdicionar>

        <div className="mt-3 overflow-x-auto rounded-md border border-border">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-3 py-2 font-medium">Evento</th>
                <th className="px-3 py-2 font-medium">Antecedência</th>
                <th className="px-3 py-2 font-medium">Responsável</th>
                <th className="px-3 py-2 font-medium">Corresponsáveis</th>
                <th className="px-3 py-2 font-medium">Ativa</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {regras.map((r) => (
                <LinhaRegra key={r.id} regra={r} />
              ))}
              {regras.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-3 py-6 text-center text-muted-foreground">
                    Nenhuma regra cadastrada ainda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function LinhaRegra({ regra }: { regra: RegraBitrix }) {
  const [ativo, setAtivo] = useState(regra.ativo);
  const [editando, setEditando] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <>
      <tr className="border-b border-border last:border-0">
        <td className="px-3 py-2 text-foreground">
          {TIPO_EVENTO_LABEL[regra.tipo_evento] ?? regra.tipo_evento}
          <p className="text-xs text-muted-foreground">{regra.titulo_template}</p>
        </td>
        <td className="px-3 py-2 text-muted-foreground">
          {regra.dias_antecedencia === 0 ? "No dia" : `${regra.dias_antecedencia} dia(s) antes`}
        </td>
        <td className="px-3 py-2 text-foreground">{regra.responsavel_bitrix_nome}</td>
        <td className="px-3 py-2 text-muted-foreground">
          {regra.corresponsaveis_bitrix_nomes?.join(", ") || "—"}
        </td>
        <td className="px-3 py-2">
          <Checkbox
            checked={ativo}
            disabled={pending}
            onCheckedChange={(v) => {
              const novo = !!v;
              setAtivo(novo);
              startTransition(() => {
                atualizarRegraBitrixAtiva(regra.id, novo);
              });
            }}
          />
        </td>
        <td className="px-3 py-2 text-right">
          <Button variant="ghost" size="sm" onClick={() => setEditando((v) => !v)}>
            Editar
          </Button>
        </td>
      </tr>
      {editando && (
        <tr className="border-b border-border bg-muted/20 last:border-0">
          <td colSpan={6} className="p-3">
            <FormularioRegra
              regra={regra}
              aoSalvar={() => setEditando(false)}
              aoCancelar={() => setEditando(false)}
            />
          </td>
        </tr>
      )}
    </>
  );
}

function FormularioRegra({
  regra,
  aoSalvar,
  aoCancelar,
}: {
  regra?: RegraBitrix;
  aoSalvar: () => void;
  aoCancelar?: () => void;
}) {
  const action = regra ? atualizarRegraBitrix.bind(null, regra.id) : criarRegraBitrix;
  const [state, formAction, pending] = useActionState<BitrixFormState, FormData>(
    action,
    undefined,
  );
  const [corresponsaveis, setCorresponsaveis] = useState<Set<number>>(
    new Set(regra?.corresponsaveis_bitrix_ids ?? []),
  );

  useEffect(() => {
    if (state && "ok" in state) aoSalvar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <form
      action={formAction}
      className="mt-3 max-w-2xl space-y-4 rounded-lg border border-border bg-card p-4"
    >
      {state && "error" in state && (
        <p className="rounded-md bg-danger-bg px-3 py-2 text-sm text-danger">
          {state.error}
        </p>
      )}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="br_tipo">Evento</Label>
          <NativeSelect
            id="br_tipo"
            name="tipo_evento"
            required
            defaultValue={regra?.tipo_evento ?? ""}
          >
            <option value="" disabled>
              Selecione...
            </option>
            {TIPOS_EVENTO.map((t) => (
              <option key={t} value={t}>
                {TIPO_EVENTO_LABEL[t]}
              </option>
            ))}
          </NativeSelect>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="br_dias">Antecedência (dias)</Label>
          <Input
            id="br_dias"
            name="dias_antecedencia"
            type="number"
            min={0}
            required
            defaultValue={regra?.dias_antecedencia ?? 0}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="br_responsavel">Responsável</Label>
          <NativeSelect
            id="br_responsavel"
            name="responsavel_bitrix_id"
            required
            defaultValue={regra?.responsavel_bitrix_id ?? ""}
          >
            <option value="" disabled>
              Selecione...
            </option>
            {BITRIX_USUARIOS.map((u) => (
              <option key={u.id} value={u.id}>
                {u.nome}
              </option>
            ))}
          </NativeSelect>
        </div>
        <div className="space-y-1.5">
          <Label>Corresponsáveis (opcional)</Label>
          <div className="grid max-h-32 grid-cols-1 gap-1 overflow-y-auto rounded-md border border-border p-2">
            {BITRIX_USUARIOS.map((u) => (
              <label key={u.id} className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={corresponsaveis.has(u.id)}
                  onCheckedChange={() => {
                    setCorresponsaveis((atual) => {
                      const novo = new Set(atual);
                      if (novo.has(u.id)) novo.delete(u.id);
                      else novo.add(u.id);
                      return novo;
                    });
                  }}
                />
                {corresponsaveis.has(u.id) && (
                  <input type="hidden" name="corresponsaveis_bitrix_ids" value={u.id} />
                )}
                {u.nome}
              </label>
            ))}
          </div>
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="br_titulo">Título da tarefa</Label>
        <Input
          id="br_titulo"
          name="titulo_template"
          required
          defaultValue={regra?.titulo_template ?? ""}
          placeholder="Ex.: Aniversário de {{nome}} em {{data}}"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="br_descricao">Descrição (opcional)</Label>
        <Textarea
          id="br_descricao"
          name="descricao_template"
          rows={2}
          defaultValue={regra?.descricao_template ?? ""}
        />
        <p className="text-xs text-muted-foreground">
          Pode usar {"{{nome}}"} e {"{{data}}"} no título/descrição — a rotina
          troca pelos dados reais de cada colaborador.
        </p>
      </div>
      <div className="flex justify-end gap-2">
        {aoCancelar && (
          <Button type="button" variant="ghost" onClick={aoCancelar}>
            Cancelar
          </Button>
        )}
        <Button type="submit" disabled={pending}>
          {pending ? "Salvando..." : regra ? "Salvar alterações" : "Criar regra"}
        </Button>
      </div>
    </form>
  );
}
