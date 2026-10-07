"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/native-select";
import { PainelAdicionar } from "@/components/painel-adicionar";
import { StatTile } from "@/components/stat-tile";
import { StatusBadge } from "@/components/status-badge";
import { InfoBanner } from "@/components/info-banner";
import { ColaboradorAvatar } from "@/components/colaborador-avatar";
import { formatarData, hojeISO } from "@/lib/date";
import { situacaoVencimento, type SituacaoVencimento } from "@/lib/vencimento";
import type { NrColaboradorItem } from "@/lib/data/treinamentos";
import {
  registrarNrLote,
  renovarNr,
  atualizarRegistroNr,
  atualizarAcompanhamentoNr,
  ativarAcompanhamentoNrNovo,
} from "./actions";
import type { TreinamentoFormState } from "./actions";
import { SelecaoParticipantes } from "./selecao-participantes";

type Colaborador = { id: string; nome: string; setor_nome: string | null };
type NrCatalogo = { id: string; nr: string; nome: string; periodicidade_meses: number | null };

function peso(tone: string | undefined) {
  if (tone === "danger") return 3;
  if (tone === "warning") return 2;
  if (tone === "success") return 1;
  return 0;
}

// "Sem registro" é uma pendência (curso acompanhado que nunca foi feito) — diferente de
// não ter badge nenhum. Só se aplica a itens com acompanhar=true; itens desativados têm
// seu próprio rótulo ("Sem acompanhamento"), tratado à parte na renderização.
function situacaoNr(item: NrColaboradorItem): SituacaoVencimento {
  if (!item.treinamento_id) return { tone: "danger", texto: "Sem registro" };
  return situacaoVencimento(item.data_vencimento) ?? { tone: "success", texto: "Sem vencimento" };
}

function piorSituacaoDoColaborador(entradas: NrColaboradorItem[]) {
  const acompanhadas = entradas.filter((e) => e.acompanhar);
  if (acompanhadas.length === 0) return undefined;
  return acompanhadas
    .map((e) => ({ item: e, situacao: situacaoNr(e) }))
    .sort((a, b) => peso(b.situacao.tone) - peso(a.situacao.tone))[0];
}

export function NrTab({
  nrPorColaborador,
  nrsCatalogo,
  colaboradoresAtivos,
  colaboradoresNoFiltro,
}: {
  nrPorColaborador: NrColaboradorItem[];
  nrsCatalogo: NrCatalogo[];
  colaboradoresAtivos: Colaborador[];
  colaboradoresNoFiltro: Colaborador[];
}) {
  const [visao, setVisao] = useState<"lista" | "linha_do_tempo">("lista");

  const porColaborador = useMemo(() => {
    const mapa = new Map<
      string,
      {
        nome: string;
        cargo_nome: string | null;
        setor_nome: string | null;
        entradas: NrColaboradorItem[];
      }
    >();
    for (const n of nrPorColaborador) {
      if (!mapa.has(n.colaborador_id)) {
        mapa.set(n.colaborador_id, {
          nome: n.colaborador_nome,
          cargo_nome: n.cargo_nome,
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

  const kpis = useMemo(() => {
    let emDia = 0;
    let pendente = 0;
    let comAcompanhamento = 0;
    for (const [, info] of porColaborador) {
      const pior = piorSituacaoDoColaborador(info.entradas);
      // Sem nenhuma NR acompanhada (função não exige nada, ou tudo foi desligado
      // manualmente) não entra em nenhum dos dois buckets — não é pendência.
      if (!pior) continue;
      comAcompanhamento++;
      if (peso(pior.situacao.tone) <= 1) emDia++;
      else pendente++;
    }
    const semAcompanhamento = Math.max(0, colaboradoresNoFiltro.length - comAcompanhamento);
    const cursosARenovar = nrPorColaborador.filter((n) => {
      if (!n.acompanhar || !n.treinamento_id) return false;
      const s = situacaoVencimento(n.data_vencimento);
      return s?.tone === "danger" || s?.tone === "warning";
    }).length;
    return { emDia, pendente, semAcompanhamento, cursosARenovar };
  }, [porColaborador, nrPorColaborador, colaboradoresNoFiltro]);

  const timeline = useMemo(() => {
    const vencidos: NrColaboradorItem[] = [];
    const porMes = new Map<string, NrColaboradorItem[]>();
    for (const n of nrPorColaborador) {
      if (!n.acompanhar) continue;
      // Cursos sem vencimento cadastrado não entram na linha do tempo (não há prazo pra
      // acompanhar) — ficam visíveis só na Lista.
      if (!n.data_vencimento) continue;
      const situacao = situacaoVencimento(n.data_vencimento);
      if (situacao?.tone === "danger") {
        vencidos.push(n);
        continue;
      }
      const mes = n.data_vencimento.slice(0, 7);
      if (!porMes.has(mes)) porMes.set(mes, []);
      porMes.get(mes)!.push(n);
    }
    vencidos.sort((a, b) => (a.data_vencimento ?? "").localeCompare(b.data_vencimento ?? ""));
    const meses = Array.from(porMes.keys()).sort();
    for (const itensDoMes of porMes.values()) {
      itensDoMes.sort((a, b) => a.colaborador_nome.localeCompare(b.colaborador_nome));
    }
    return { vencidos, meses, porMes };
  }, [nrPorColaborador]);

  return (
    <div className="space-y-4">
      <InfoBanner>
        Controle de validade das NRs: uma linha por colaborador, com o status
        de cada curso calculado a partir do registro mais recente — o filtro
        de <strong>Período</strong> não esconde NRs vencidas antigas. Cada NR
        tem um <strong>acompanhamento</strong> próprio (ligado automaticamente
        quando a função exige, editável a qualquer momento): desligar não
        apaga o curso nem o certificado, só tira aquela NR dos alertas e
        indicadores — útil quando a pessoa muda de função e ela deixa de
        precisar renovar. A matriz de NR por função fica em{" "}
        <strong>Configurações → Treinamentos</strong>.
      </InfoBanner>

      <div className="flex flex-wrap items-center justify-between gap-3">
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
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label="Colaboradores com NR em dia"
          valor={String(kpis.emDia)}
          subtitulo={`de ${colaboradoresNoFiltro.length} no filtro atual`}
          accent
        />
        <StatTile
          label="Colaboradores com NR pendente"
          valor={String(kpis.pendente)}
          subtitulo="vencida, a vencer ou sem registro"
        />
        <StatTile
          label="Sem nenhuma NR acompanhada"
          valor={String(kpis.semAcompanhamento)}
          subtitulo="função não exige, ou foi desligado manualmente"
        />
        <StatTile
          label="Cursos a renovar"
          valor={String(kpis.cursosARenovar)}
          subtitulo="vencidos ou a vencer, no total"
          accent
        />
      </div>

      {visao === "lista" ? (
        <div className="overflow-x-auto rounded-lg border border-border bg-card">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border text-xs uppercase text-muted-foreground">
              <tr>
                <th className="w-8 px-3 py-3" />
                <th className="px-3 py-3 font-medium">Colaborador</th>
                <th className="px-3 py-3 font-medium">Setor</th>
                <th className="px-3 py-3 font-medium">Situação geral</th>
                <th className="px-3 py-3 font-medium">Próxima pendência</th>
                <th className="px-3 py-3" />
              </tr>
            </thead>
            <tbody>
              {porColaborador.map(([colaboradorId, info]) => (
                <LinhaColaborador
                  key={colaboradorId}
                  colaboradorId={colaboradorId}
                  nome={info.nome}
                  cargoNome={info.cargo_nome}
                  setorNome={info.setor_nome}
                  entradas={info.entradas}
                  nrsCatalogo={nrsCatalogo}
                />
              ))}
              {porColaborador.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                    Nenhum colaborador com NR registrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="space-y-6">
          {timeline.vencidos.length > 0 && (
            <TabelaTimeline
              titulo={`Vencidos (${timeline.vencidos.length})`}
              tituloTone="danger"
              itens={timeline.vencidos}
            />
          )}
          {timeline.meses.map((mes) => (
            <TabelaTimeline
              key={mes}
              titulo={`${formatarMes(mes)} (${timeline.porMes.get(mes)!.length})`}
              itens={timeline.porMes.get(mes)!}
            />
          ))}
          {timeline.vencidos.length === 0 && timeline.meses.length === 0 && (
            <p className="rounded-lg border border-border p-6 text-center text-sm text-muted-foreground">
              Nada a vencer no filtro atual.
            </p>
          )}
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
  cargoNome,
  setorNome,
  entradas,
  nrsCatalogo,
}: {
  colaboradorId: string;
  nome: string;
  cargoNome: string | null;
  setorNome: string | null;
  entradas: NrColaboradorItem[];
  nrsCatalogo: NrCatalogo[];
}) {
  const [aberto, setAberto] = useState(false);
  const [renovandoRapido, setRenovandoRapido] = useState(false);
  const pior = piorSituacaoDoColaborador(entradas);
  const temPendencia = pior ? peso(pior.situacao.tone) >= 2 : false;
  const proximaPendenciaTexto = pior
    ? `${pior.item.nr} — ${pior.item.nr_nome}${
        pior.item.data_vencimento ? ` · vence ${formatarData(pior.item.data_vencimento)}` : ""
      }`
    : "—";
  const nrsJaPresentes = new Set(entradas.map((e) => e.nr_numero));
  const nrsDisponiveis = nrsCatalogo.filter((n) => !nrsJaPresentes.has(n.id));

  return (
    <>
      <tr
        className="cursor-pointer border-b border-border last:border-0 hover:bg-muted/30"
        onClick={() => setAberto((v) => !v)}
      >
        <td className="px-3 py-3 text-center text-muted-foreground">{aberto ? "▾" : "▸"}</td>
        <td className="px-3 py-3">
          <div className="flex items-center gap-3">
            <ColaboradorAvatar nome={nome} size="sm" />
            <div>
              <p className="font-medium text-foreground">{nome}</p>
              <p className="text-xs text-muted-foreground">{cargoNome ?? "—"}</p>
            </div>
          </div>
        </td>
        <td className="px-3 py-3 text-muted-foreground">{setorNome ?? "—"}</td>
        <td className="px-3 py-3">
          {pior?.situacao ? (
            <StatusBadge tone={pior.situacao.tone}>{pior.situacao.texto}</StatusBadge>
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
        </td>
        <td className="px-3 py-3 text-muted-foreground">{proximaPendenciaTexto}</td>
        <td className="px-3 py-3 text-right">
          {temPendencia && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setRenovandoRapido((v) => !v);
              }}
            >
              ↻ Renovar
            </Button>
          )}
        </td>
      </tr>

      {/* Atalho de renovação rápida — não precisa expandir a linha pra agir numa pendência. */}
      {renovandoRapido && (
        <tr className="border-b border-border bg-muted/20 last:border-0">
          <td />
          <td colSpan={5} className="p-3">
            <FormularioRenovar
              colaboradorId={colaboradorId}
              nrCatalogoId={pior!.item.nr_numero}
              aoSalvar={() => setRenovandoRapido(false)}
            />
          </td>
        </tr>
      )}

      {aberto && (
        <tr className="border-b border-border bg-muted/20 last:border-0">
          <td />
          <td colSpan={5} className="p-4">
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
            {nrsDisponiveis.length > 0 && (
              <div className="mt-3">
                <AcompanharNovaNr colaboradorId={colaboradorId} opcoes={nrsDisponiveis} />
              </div>
            )}
          </td>
        </tr>
      )}
    </>
  );
}

function LinhaNr({
  item,
  colaboradorId,
}: {
  item: NrColaboradorItem;
  colaboradorId: string;
}) {
  const [modo, setModo] = useState<"nenhum" | "editando" | "renovando">("nenhum");
  const [pendente, setPendente] = useState(false);
  const situacao = situacaoNr(item);

  function alternarAcompanhamento() {
    setPendente(true);
    atualizarAcompanhamentoNr(item.acompanhamento_id, !item.acompanhar).finally(() =>
      setPendente(false),
    );
  }

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
          {item.acompanhar ? (
            <StatusBadge tone={situacao.tone}>{situacao.texto}</StatusBadge>
          ) : (
            <StatusBadge tone="neutral">Sem acompanhamento</StatusBadge>
          )}
        </td>
        <td className="py-2 text-right">
          <div className="flex justify-end gap-1">
            {item.treinamento_id && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setModo(modo === "editando" ? "nenhum" : "editando")}
              >
                Editar
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setModo(modo === "renovando" ? "nenhum" : "renovando")}
            >
              Renovar
            </Button>
            <Button
              variant="ghost"
              size="sm"
              disabled={pendente}
              onClick={alternarAcompanhamento}
            >
              {item.acompanhar ? "Desativar acompanhamento" : "Ativar acompanhamento"}
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

// Liga o acompanhamento de uma NR que a função do colaborador não exige (ou ainda não foi
// feita) — pra quando alguém quer monitorar uma certificação extra mesmo sem ser exigência.
function AcompanharNovaNr({
  colaboradorId,
  opcoes,
}: {
  colaboradorId: string;
  opcoes: NrCatalogo[];
}) {
  const [nrId, setNrId] = useState("");
  const [pendente, setPendente] = useState(false);

  function ativar() {
    if (!nrId) return;
    setPendente(true);
    ativarAcompanhamentoNrNovo(colaboradorId, nrId).finally(() => {
      setPendente(false);
      setNrId("");
    });
  }

  return (
    <div className="flex items-end gap-2">
      <div className="w-64 space-y-1">
        <Label htmlFor={`nova_nr_${colaboradorId}`}>Acompanhar outra NR</Label>
        <NativeSelect
          id={`nova_nr_${colaboradorId}`}
          value={nrId}
          onChange={(e) => setNrId(e.target.value)}
        >
          <option value="">Selecione...</option>
          {opcoes.map((n) => (
            <option key={n.id} value={n.id}>
              {n.nr} — {n.nome}
            </option>
          ))}
        </NativeSelect>
      </div>
      <Button type="button" size="sm" variant="outline" disabled={!nrId || pendente} onClick={ativar}>
        {pendente ? "Ativando..." : "Ativar"}
      </Button>
    </div>
  );
}

function TabelaTimeline({
  titulo,
  tituloTone,
  itens,
}: {
  titulo: string;
  tituloTone?: "danger";
  itens: NrColaboradorItem[];
}) {
  return (
    <div>
      <h3 className={`mb-2 text-sm font-semibold ${tituloTone === "danger" ? "text-danger" : "text-foreground"}`}>
        {titulo}
      </h3>
      <div className="overflow-x-auto rounded-lg border border-border bg-card">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-3 py-2 font-medium">Colaborador</th>
              <th className="px-3 py-2 font-medium">Setor</th>
              <th className="px-3 py-2 font-medium">Curso</th>
              <th className="px-3 py-2 font-medium">Vencimento</th>
              <th className="px-3 py-2 font-medium">Status</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {itens.map((n) => (
              <LinhaTimeline key={`${n.colaborador_id}-${n.nr_numero}`} item={n} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function LinhaTimeline({ item }: { item: NrColaboradorItem }) {
  const [modo, setModo] = useState<"nenhum" | "editando" | "renovando">("nenhum");
  const situacao = situacaoVencimento(item.data_vencimento);

  return (
    <>
      <tr className="border-b border-border last:border-0 hover:bg-muted/30">
        <td className="px-3 py-2">
          <div className="flex items-center gap-3">
            <ColaboradorAvatar nome={item.colaborador_nome} size="sm" />
            <div>
              <p className="font-medium text-foreground">{item.colaborador_nome}</p>
              <p className="text-xs text-muted-foreground">{item.cargo_nome ?? "—"}</p>
            </div>
          </div>
        </td>
        <td className="px-3 py-2 text-muted-foreground">{item.setor_nome ?? "—"}</td>
        <td className="px-3 py-2">
          {item.nr} — {item.nr_nome}
        </td>
        <td className="px-3 py-2 text-muted-foreground">{formatarData(item.data_vencimento)}</td>
        <td className="px-3 py-2">
          {situacao && <StatusBadge tone={situacao.tone}>{situacao.texto}</StatusBadge>}
        </td>
        <td className="px-3 py-2 text-right">
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
          <td colSpan={6} className="p-3">
            <FormularioEditarNr item={item} aoSalvar={() => setModo("nenhum")} />
          </td>
        </tr>
      )}
      {modo === "renovando" && (
        <tr>
          <td colSpan={6} className="p-3">
            <FormularioRenovar
              colaboradorId={item.colaborador_id}
              nrCatalogoId={item.nr_numero}
              aoSalvar={() => setModo("nenhum")}
            />
          </td>
        </tr>
      )}
    </>
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
        <p className="col-span-4 rounded-md bg-danger-bg px-3 py-2 text-sm text-danger">
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
  // Só renderizado quando item.treinamento_id existe (ver guarda em LinhaNr) — não há o
  // que editar num item "Sem registro".
  const [state, formAction, pending] = useActionState<TreinamentoFormState, FormData>(
    atualizarRegistroNr.bind(null, item.treinamento_id!, item.colaborador_id),
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
        <p className="col-span-4 rounded-md bg-danger-bg px-3 py-2 text-sm text-danger">
          {state.error}
        </p>
      )}
      <div className="space-y-1">
        <Label htmlFor="ed_data">Data de realização</Label>
        <Input id="ed_data" name="data" type="date" required defaultValue={item.data ?? hojeISO()} />
      </div>
      <div className="space-y-1">
        <Label htmlFor="ed_carga">Carga horária</Label>
        <Input
          id="ed_carga"
          name="carga_horaria"
          type="number"
          step="0.5"
          required
          defaultValue={item.carga_horaria ?? ""}
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
        <p className="rounded-md bg-danger-bg px-3 py-2 text-sm text-danger">
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
