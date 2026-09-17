"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/native-select";
import { PainelAdicionar } from "@/components/painel-adicionar";
import { StatTile } from "@/components/stat-tile";
import { StatusBadge } from "@/components/status-badge";
import { formatarData, hojeISO } from "@/lib/date";
import { situacaoVencimento } from "@/lib/vencimento";
import type { NrColaboradorItem } from "@/lib/data/treinamentos";
import { registrarNrLote, renovarNr, atualizarRegistroNr } from "./actions";
import type { TreinamentoFormState } from "./actions";
import { SelecaoParticipantes } from "./selecao-participantes";

type Colaborador = { id: string; nome: string; setor_nome: string | null };
type NrCatalogo = { id: string; nr: string; nome: string; periodicidade_meses: number | null };

export function NrTab({
  nrPorColaborador,
  nrsCatalogo,
  colaboradoresAtivos,
}: {
  nrPorColaborador: NrColaboradorItem[];
  nrsCatalogo: NrCatalogo[];
  colaboradoresAtivos: Colaborador[];
}) {
  const [visao, setVisao] = useState<"lista" | "linha_do_tempo">("lista");

  const semNrCount = useMemo(() => {
    const comNr = new Set(nrPorColaborador.map((n) => n.colaborador_id));
    return colaboradoresAtivos.filter((c) => !comNr.has(c.id)).length;
  }, [nrPorColaborador, colaboradoresAtivos]);

  const porColaborador = useMemo(() => {
    const mapa = new Map<
      string,
      { nome: string; setor_nome: string | null; entradas: NrColaboradorItem[] }
    >();
    for (const n of nrPorColaborador) {
      if (!mapa.has(n.colaborador_id)) {
        mapa.set(n.colaborador_id, {
          nome: n.colaborador_nome,
          setor_nome: n.setor_nome,
          entradas: [],
        });
      }
      mapa.get(n.colaborador_id)!.entradas.push(n);
    }
    return Array.from(mapa.entries()).sort((a, b) =>
      a[1].nome.localeCompare(b[1].nome),
    );
  }, [nrPorColaborador]);

  const timeline = useMemo(() => {
    const vencidos: NrColaboradorItem[] = [];
    const porMes = new Map<string, NrColaboradorItem[]>();
    for (const n of nrPorColaborador) {
      const situacao = situacaoVencimento(n.data_vencimento);
      if (situacao?.tone === "danger") {
        vencidos.push(n);
        continue;
      }
      const mes = n.data_vencimento ? n.data_vencimento.slice(0, 7) : "sem-vencimento";
      if (!porMes.has(mes)) porMes.set(mes, []);
      porMes.get(mes)!.push(n);
    }
    const meses = Array.from(porMes.keys()).sort();
    return { vencidos, meses, porMes };
  }, [nrPorColaborador]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatTile label="Colaboradores com NR registrada" valor={String(porColaborador.length)} accent />
        <StatTile label="Sem NR registrada" valor={String(semNrCount)} />
        <StatTile
          label="Vencidos"
          valor={String(nrPorColaborador.filter((n) => situacaoVencimento(n.data_vencimento)?.tone === "danger").length)}
          accent
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-lg border border-border p-1">
          <button
            type="button"
            onClick={() => setVisao("lista")}
            className={`rounded-md px-3 py-1 text-sm font-medium ${visao === "lista" ? "bg-muted text-foreground" : "text-muted-foreground"}`}
          >
            Lista
          </button>
          <button
            type="button"
            onClick={() => setVisao("linha_do_tempo")}
            className={`rounded-md px-3 py-1 text-sm font-medium ${visao === "linha_do_tempo" ? "bg-muted text-foreground" : "text-muted-foreground"}`}
          >
            Linha do tempo
          </button>
        </div>

        <PainelAdicionar rotulo="+ Registrar treinamento de NR">
          {(fechar) => (
            <FormularioRegistroLote
              nrsCatalogo={nrsCatalogo}
              colaboradoresAtivos={colaboradoresAtivos}
              nrPorColaborador={nrPorColaborador}
              aoSalvar={fechar}
            />
          )}
        </PainelAdicionar>
      </div>

      {visao === "lista" ? (
        <div className="space-y-2">
          {porColaborador.map(([colaboradorId, info]) => (
            <LinhaColaborador
              key={colaboradorId}
              colaboradorId={colaboradorId}
              nome={info.nome}
              setorNome={info.setor_nome}
              entradas={info.entradas}
            />
          ))}
          {porColaborador.length === 0 && (
            <p className="rounded-lg border border-border p-6 text-center text-sm text-muted-foreground">
              Nenhum colaborador com NR registrada.
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {timeline.vencidos.length > 0 && (
            <div>
              <h3 className="mb-2 text-sm font-semibold text-danger">Vencidos</h3>
              <div className="space-y-1">
                {timeline.vencidos.map((n) => (
                  <LinhaTimeline key={`${n.colaborador_id}-${n.nr_numero}`} item={n} />
                ))}
              </div>
            </div>
          )}
          {timeline.meses.map((mes) => (
            <div key={mes}>
              <h3 className="mb-2 text-sm font-semibold text-foreground">
                {mes === "sem-vencimento" ? "Sem vencimento" : formatarMes(mes)}
              </h3>
              <div className="space-y-1">
                {timeline.porMes.get(mes)!.map((n) => (
                  <LinhaTimeline key={`${n.colaborador_id}-${n.nr_numero}`} item={n} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function formatarMes(mesIso: string) {
  const [ano, mes] = mesIso.split("-");
  const data = new Date(Number(ano), Number(mes) - 1, 1);
  return data.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
}

function LinhaColaborador({
  colaboradorId,
  nome,
  setorNome,
  entradas,
}: {
  colaboradorId: string;
  nome: string;
  setorNome: string | null;
  entradas: NrColaboradorItem[];
}) {
  const [aberto, setAberto] = useState(false);
  const piorSituacao = entradas
    .map((e) => situacaoVencimento(e.data_vencimento))
    .sort((a, b) => peso(b?.tone) - peso(a?.tone))[0];

  return (
    <div className="rounded-lg border border-border">
      <button
        type="button"
        onClick={() => setAberto(!aberto)}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
      >
        <div>
          <p className="font-medium text-foreground">{nome}</p>
          <p className="text-xs text-muted-foreground">
            {setorNome ?? "—"} · {entradas.length} curso(s) de NR
          </p>
        </div>
        {piorSituacao && (
          <StatusBadge tone={piorSituacao.tone}>{piorSituacao.texto}</StatusBadge>
        )}
      </button>
      {aberto && (
        <div className="border-t border-border p-4">
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase text-muted-foreground">
              <tr>
                <th className="py-1 font-medium">Curso</th>
                <th className="py-1 font-medium">Última data</th>
                <th className="py-1 font-medium">Vencimento</th>
                <th className="py-1 font-medium">Status</th>
                <th className="py-1" />
              </tr>
            </thead>
            <tbody>
              {entradas.map((e) => (
                <LinhaNr key={e.nr_numero} item={e} colaboradorId={colaboradorId} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function peso(tone: string | undefined) {
  if (tone === "danger") return 3;
  if (tone === "warning") return 2;
  if (tone === "success") return 1;
  return 0;
}

function LinhaNr({
  item,
  colaboradorId,
}: {
  item: NrColaboradorItem;
  colaboradorId: string;
}) {
  const [modo, setModo] = useState<"nenhum" | "editando" | "renovando">("nenhum");
  const situacao = situacaoVencimento(item.data_vencimento);

  return (
    <>
      <tr className="border-t border-border">
        <td className="py-2">
          {item.nr} — {item.nr_nome}
        </td>
        <td className="py-2 text-muted-foreground">{formatarData(item.data)}</td>
        <td className="py-2 text-muted-foreground">
          {formatarData(item.data_vencimento)}
        </td>
        <td className="py-2">
          {situacao && <StatusBadge tone={situacao.tone}>{situacao.texto}</StatusBadge>}
        </td>
        <td className="py-2 text-right">
          <div className="flex justify-end gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setModo(modo === "editando" ? "nenhum" : "editando")}
            >
              Editar
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setModo(modo === "renovando" ? "nenhum" : "renovando")}
            >
              Renovar
            </Button>
          </div>
        </td>
      </tr>
      {modo === "editando" && (
        <tr>
          <td colSpan={5} className="pb-3">
            <FormularioEditarNr item={item} aoSalvar={() => setModo("nenhum")} />
          </td>
        </tr>
      )}
      {modo === "renovando" && (
        <tr>
          <td colSpan={5} className="pb-3">
            <FormularioRenovar
              colaboradorId={colaboradorId}
              nrCatalogoId={item.nr_numero}
              aoSalvar={() => setModo("nenhum")}
            />
          </td>
        </tr>
      )}
    </>
  );
}

function LinhaTimeline({ item }: { item: NrColaboradorItem }) {
  const [modo, setModo] = useState<"nenhum" | "editando" | "renovando">("nenhum");
  const situacao = situacaoVencimento(item.data_vencimento);

  return (
    <div className="rounded-lg border border-border p-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-foreground">
            {item.colaborador_nome}{" "}
            <span className="font-normal text-muted-foreground">
              · {item.nr} — {item.nr_nome}
            </span>
          </p>
          <p className="text-xs text-muted-foreground">
            Vencimento: {formatarData(item.data_vencimento)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {situacao && <StatusBadge tone={situacao.tone}>{situacao.texto}</StatusBadge>}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setModo(modo === "editando" ? "nenhum" : "editando")}
          >
            Editar
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setModo(modo === "renovando" ? "nenhum" : "renovando")}
          >
            Renovar
          </Button>
        </div>
      </div>
      {modo === "editando" && (
        <div className="mt-3">
          <FormularioEditarNr item={item} aoSalvar={() => setModo("nenhum")} />
        </div>
      )}
      {modo === "renovando" && (
        <div className="mt-3">
          <FormularioRenovar
            colaboradorId={item.colaborador_id}
            nrCatalogoId={item.nr_numero}
            aoSalvar={() => setModo("nenhum")}
          />
        </div>
      )}
    </div>
  );
}

function FormularioRenovar({
  colaboradorId,
  nrCatalogoId,
  aoSalvar,
}: {
  colaboradorId: string;
  nrCatalogoId: string;
  aoSalvar: () => void;
}) {
  const action = renovarNr.bind(null, colaboradorId, nrCatalogoId);
  const [state, formAction, pending] = useActionState<TreinamentoFormState, FormData>(
    action,
    undefined,
  );

  useEffect(() => {
    if (state && "ok" in state) aoSalvar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <form
      action={formAction}
      className="grid grid-cols-2 gap-3 rounded-md border border-border bg-muted/30 p-3 sm:grid-cols-4"
    >
      {state && "error" in state && (
        <p className="col-span-4 rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">
          {state.error}
        </p>
      )}
      <div className="space-y-1">
        <Label htmlFor="ren_data">Data de realização</Label>
        <Input id="ren_data" name="data" type="date" required defaultValue={hojeISO()} />
      </div>
      <div className="space-y-1">
        <Label htmlFor="ren_carga">Carga horária</Label>
        <Input id="ren_carga" name="carga_horaria" type="number" step="0.5" required />
      </div>
      <div className="space-y-1">
        <Label htmlFor="ren_custo">Custo</Label>
        <Input id="ren_custo" name="custo_total" type="number" step="0.01" />
      </div>
      <div className="space-y-1">
        <Label htmlFor="ren_instrutor">Instrutor</Label>
        <Input id="ren_instrutor" name="instrutor" />
      </div>
      <div className="col-span-4 flex justify-end">
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Salvando..." : "Confirmar renovação"}
        </Button>
      </div>
    </form>
  );
}

function FormularioEditarNr({
  item,
  aoSalvar,
}: {
  item: NrColaboradorItem;
  aoSalvar: () => void;
}) {
  const [state, formAction, pending] = useActionState<TreinamentoFormState, FormData>(
    atualizarRegistroNr.bind(null, item.treinamento_id),
    undefined,
  );

  useEffect(() => {
    if (state && "ok" in state) aoSalvar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <form
      action={formAction}
      className="grid grid-cols-2 gap-3 rounded-md border border-border bg-muted/30 p-3 sm:grid-cols-4"
    >
      {state && "error" in state && (
        <p className="col-span-4 rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">
          {state.error}
        </p>
      )}
      <div className="space-y-1">
        <Label htmlFor="ed_data">Data de realização</Label>
        <Input id="ed_data" name="data" type="date" required defaultValue={item.data} />
      </div>
      <div className="space-y-1">
        <Label htmlFor="ed_carga">Carga horária</Label>
        <Input
          id="ed_carga"
          name="carga_horaria"
          type="number"
          step="0.5"
          required
          defaultValue={item.carga_horaria}
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="ed_custo">Custo</Label>
        <Input
          id="ed_custo"
          name="custo_total"
          type="number"
          step="0.01"
          defaultValue={item.custo_total ?? ""}
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="ed_instrutor">Instrutor</Label>
        <Input id="ed_instrutor" name="instrutor" defaultValue={item.instrutor ?? ""} />
      </div>
      <div className="space-y-1 sm:col-span-2">
        <Label htmlFor="ed_vencimento">Vencimento</Label>
        <Input
          id="ed_vencimento"
          name="data_vencimento"
          type="date"
          defaultValue={item.data_vencimento ?? ""}
        />
      </div>
      <div className="col-span-2 flex items-end justify-end gap-2 sm:col-span-4">
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Salvando..." : "Salvar"}
        </Button>
      </div>
    </form>
  );
}

function FormularioRegistroLote({
  nrsCatalogo,
  colaboradoresAtivos,
  nrPorColaborador,
  aoSalvar,
}: {
  nrsCatalogo: NrCatalogo[];
  colaboradoresAtivos: Colaborador[];
  nrPorColaborador: NrColaboradorItem[];
  aoSalvar: () => void;
}) {
  const [state, formAction, pending] = useActionState<TreinamentoFormState, FormData>(
    registrarNrLote,
    undefined,
  );
  const [nrSelecionado, setNrSelecionado] = useState("");
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (state && "ok" in state) aoSalvar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  function aoTrocarNr(nrCatalogoId: string) {
    setNrSelecionado(nrCatalogoId);
    // Pré-marca só quem já fez esse curso antes e está vencido/a vencer — nunca quem
    // nunca fez (pode ser que a função da pessoa não exija aquela NR).
    const pendentes = new Set(
      nrPorColaborador
        .filter((n) => n.nr_numero === nrCatalogoId)
        .filter((n) => {
          const s = situacaoVencimento(n.data_vencimento);
          return s?.tone === "danger" || s?.tone === "warning";
        })
        .map((n) => n.colaborador_id),
    );
    setSelecionados(pendentes);
  }

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
          <Label htmlFor="nr_curso">Curso de NR</Label>
          <NativeSelect
            id="nr_curso"
            name="nr_catalogo_id"
            required
            value={nrSelecionado}
            onChange={(e) => aoTrocarNr(e.target.value)}
          >
            <option value="" disabled>
              Selecione...
            </option>
            {nrsCatalogo.map((n) => (
              <option key={n.id} value={n.id}>
                {n.nr} — {n.nome}
              </option>
            ))}
          </NativeSelect>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="nr_data">Data</Label>
          <Input id="nr_data" name="data" type="date" required defaultValue={hojeISO()} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="nr_carga">Carga horária</Label>
          <Input id="nr_carga" name="carga_horaria" type="number" step="0.5" required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="nr_custo">Custo total</Label>
          <Input id="nr_custo" name="custo_total" type="number" step="0.01" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="nr_instrutor">Instrutor</Label>
          <Input id="nr_instrutor" name="instrutor" />
        </div>
      </div>

      <SelecaoParticipantes
        colaboradores={colaboradoresAtivos}
        selecionados={selecionados}
        onChange={setSelecionados}
      />

      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Salvando..." : "Registrar"}
        </Button>
      </div>
    </form>
  );
}
