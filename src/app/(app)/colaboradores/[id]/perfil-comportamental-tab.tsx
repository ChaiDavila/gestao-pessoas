"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BotaoRemover } from "@/components/botao-remover";
import { formatarDataDeTimestamp, hojeISO } from "@/lib/date";
import {
  FORCAS_CONTINUUM,
  gruposEmpatados,
  type GrupoEmpatado,
} from "@/lib/perfil-comportamental";
import type { PerfilComportamentalItem } from "@/lib/data/perfil-comportamental";
import type { SubRecursoState } from "./sub-recursos-actions";
import { DiscChart } from "./disc-chart";
import { ForcasImpulsionadorasChart } from "./forcas-impulsionadoras-chart";
import { resolverEmpateForcas } from "./perfil-comportamental-actions";

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
      <div className="space-y-4">
        {gruposEmpatados(perfil).map((grupo) => (
          <AvisoEmpateForcas
            key={grupo.valor}
            colaboradorId={perfil.colaborador_id}
            grupo={grupo}
          />
        ))}
        <FormularioPerfilComportamental
          perfil={perfil}
          action={salvarAction}
          textoBotao="Salvar alterações"
          aoSalvar={() => setEditando(false)}
          aoCancelar={() => setEditando(false)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          Atualizado em {formatarDataDeTimestamp(perfil.atualizado_em)}
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

// Quando duas (ou mais) forças empatam na mesma pontuação, a ordem exibida precisa de uma
// escolha manual (a pontuação sozinha não diz qual vem primeiro). Só aparece no modo de
// edição (não na visualização normal) — resolvida ou não, dá pra reabrir e corrigir.
function AvisoEmpateForcas({
  colaboradorId,
  grupo,
}: {
  colaboradorId: string;
  grupo: GrupoEmpatado;
}) {
  const [editando, setEditando] = useState(!grupo.resolvido);
  const [ordem, setOrdem] = useState(grupo.forcas.map((f) => f.chave));
  const [pending, startTransition] = useTransition();
  const nomesPorChave = new Map(grupo.forcas.map((f) => [f.chave, f.nome]));

  function mover(index: number, direcao: -1 | 1) {
    const alvo = index + direcao;
    if (alvo < 0 || alvo >= ordem.length) return;
    const nova = [...ordem];
    [nova[index], nova[alvo]] = [nova[alvo], nova[index]];
    setOrdem(nova);
  }

  if (!editando) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm">
        <p className="text-muted-foreground">
          Empate em {grupo.valor} pontos resolvido manualmente:{" "}
          {grupo.forcas.map((f, i) => `${i + 1}º ${f.nome}`).join(", ")}.
        </p>
        <Button type="button" variant="ghost" size="sm" onClick={() => setEditando(true)}>
          Corrigir ordem
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-2 rounded-lg border border-amber-300 bg-amber-50 p-3">
      <p className="text-sm font-medium text-amber-900">
        Empate em {grupo.valor} pontos entre {grupo.forcas.map((f) => f.nome).join(" e ")}.
        A ordem abaixo é um palpite — confira no PDF e ajuste se precisar:
      </p>
      <ol className="space-y-1">
        {ordem.map((chave, index) => (
          <li
            key={chave}
            className="flex items-center justify-between gap-2 rounded-md bg-card px-3 py-1.5 text-sm"
          >
            <span>
              {index + 1}º — {nomesPorChave.get(chave)}
            </span>
            <div className="flex gap-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={index === 0}
                onClick={() => mover(index, -1)}
              >
                ↑
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={index === ordem.length - 1}
                onClick={() => mover(index, 1)}
              >
                ↓
              </Button>
            </div>
          </li>
        ))}
      </ol>
      <div className="flex gap-2">
        <Button
          type="button"
          size="sm"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              await resolverEmpateForcas(colaboradorId, ordem);
              setEditando(false);
            })
          }
        >
          {pending ? "Salvando..." : "Salvar ordem"}
        </Button>
        {grupo.resolvido && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={pending}
            onClick={() => setEditando(false)}
          >
            Cancelar
          </Button>
        )}
      </div>
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
