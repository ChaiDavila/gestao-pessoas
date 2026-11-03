"use client";

import { useActionState, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BotaoRemover } from "@/components/botao-remover";
import { formatarData, hojeISO } from "@/lib/date";
import { FORCAS_CONTINUUM } from "@/lib/perfil-comportamental";
import type { PerfilComportamentalItem } from "@/lib/data/perfil-comportamental";
import type { SubRecursoState } from "./sub-recursos-actions";
import { DiscChart } from "./disc-chart";
import { ForcasImpulsionadorasChart } from "./forcas-impulsionadoras-chart";

type Acao = (prevState: SubRecursoState, formData: FormData) => Promise<SubRecursoState>;

export function PerfilComportamentalTab({
  perfil,
  salvarAction,
  removerAction,
}: {
  perfil: PerfilComportamentalItem | null;
  salvarAction: Acao;
  removerAction: () => Promise<void>;
}) {
  const [editando, setEditando] = useState(false);

  if (!perfil) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Nenhum perfil comportamental cadastrado ainda. Preencha com os
          valores do relatório de avaliação (DISC Natural e as 12 Forças
          Impulsionadoras).
        </p>
        <FormularioPerfilComportamental
          action={salvarAction}
          textoBotao="Salvar perfil"
          aoSalvar={() => {}}
        />
      </div>
    );
  }

  if (editando) {
    return (
      <FormularioPerfilComportamental
        perfil={perfil}
        action={salvarAction}
        textoBotao="Salvar alterações"
        aoSalvar={() => setEditando(false)}
        aoCancelar={() => setEditando(false)}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          {perfil.data_avaliacao
            ? `Avaliação de ${formatarData(perfil.data_avaliacao)}`
            : "Sem data de avaliação informada"}
        </p>
        <div className="flex gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={() => setEditando(true)}>
            Editar
          </Button>
          <BotaoRemover
            action={removerAction}
            confirmar="Remover o perfil comportamental deste colaborador? Pode cadastrar de novo depois, se precisar."
          />
        </div>
      </div>

      <DiscChart d={perfil.disc_d} i={perfil.disc_i} s={perfil.disc_s} c={perfil.disc_c} />
      <ForcasImpulsionadorasChart perfil={perfil} />
    </div>
  );
}

function FormularioPerfilComportamental({
  perfil,
  action,
  textoBotao,
  aoSalvar,
  aoCancelar,
}: {
  perfil?: PerfilComportamentalItem;
  action: Acao;
  textoBotao: string;
  aoSalvar: () => void;
  aoCancelar?: () => void;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);

  useEffect(() => {
    if (state && "ok" in state) aoSalvar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <form
      action={formAction}
      className="max-w-3xl space-y-6 rounded-lg border border-border bg-card p-4"
    >
      {state && "error" in state && (
        <p className="rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">
          {state.error}
        </p>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="pc_data">Data da avaliação</Label>
        <Input
          id="pc_data"
          name="data_avaliacao"
          type="date"
          defaultValue={perfil?.data_avaliacao ?? hojeISO()}
          className="max-w-48"
        />
      </div>

      <div className="space-y-2">
        <p className="text-sm font-semibold text-foreground">DISC Natural</p>
        <div className="grid grid-cols-4 gap-3">
          <CampoNumero id="pc_disc_d" name="disc_d" label="D" defaultValue={perfil?.disc_d} />
          <CampoNumero id="pc_disc_i" name="disc_i" label="I" defaultValue={perfil?.disc_i} />
          <CampoNumero id="pc_disc_s" name="disc_s" label="S" defaultValue={perfil?.disc_s} />
          <CampoNumero id="pc_disc_c" name="disc_c" label="C" defaultValue={perfil?.disc_c} />
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-sm font-semibold text-foreground">
          Forças Impulsionadoras
        </p>
        {FORCAS_CONTINUUM.map((continuum) => (
          <div key={continuum.titulo} className="space-y-1.5">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {continuum.titulo}
            </p>
            <div className="grid grid-cols-2 gap-3">
              <CampoNumero
                id={`pc_${continuum.esquerda.chave}`}
                name={continuum.esquerda.chave}
                label={continuum.esquerda.nome}
                defaultValue={perfil?.[continuum.esquerda.chave]}
              />
              <CampoNumero
                id={`pc_${continuum.direita.chave}`}
                name={continuum.direita.chave}
                label={continuum.direita.nome}
                defaultValue={perfil?.[continuum.direita.chave]}
              />
            </div>
          </div>
        ))}
      </div>

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

function CampoNumero({
  id,
  name,
  label,
  defaultValue,
}: {
  id: string;
  name: string;
  label: string;
  defaultValue: number | undefined;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        name={name}
        type="number"
        min={0}
        max={100}
        required
        defaultValue={defaultValue ?? ""}
      />
    </div>
  );
}
