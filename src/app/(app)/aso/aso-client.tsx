"use client";

import { useEffect, useMemo, useState } from "react";
import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/native-select";
import { PainelAdicionar } from "@/components/painel-adicionar";
import { BotaoRemover } from "@/components/botao-remover";
import { StatusBadge } from "@/components/status-badge";
import { StatTile } from "@/components/stat-tile";
import { InfoBanner } from "@/components/info-banner";
import { ColaboradorAvatar } from "@/components/colaborador-avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatarData, hojeISO } from "@/lib/date";
import { situacaoVencimento, type SituacaoVencimento } from "@/lib/vencimento";
import type { AsoColaboradorItem, PgrColaboradorItem } from "@/lib/data/aso";
import {
  adicionarAso,
  atualizarAso,
  removerAso,
  adicionarExameComplementar,
  atualizarExameComplementar,
  removerExameComplementar,
} from "./actions";
import type { AsoFormState } from "./actions";

const TIPO_EXAME_LABEL: Record<string, string> = {
  admissional: "Admissional",
  periodico: "Periódico",
  demissional: "Demissional",
  mudanca_funcao: "Mudança de função",
  retorno_trabalho: "Retorno ao trabalho",
};

function situacaoPgr(item: PgrColaboradorItem): SituacaoVencimento {
  if (!item.registro_id) {
    // Exame só-na-admissão (sem periodicidade) nunca registrado: falta só lançar o dado,
    // não tem prazo correndo atrás dele — não é uma pendência de conformidade recorrente
    // como um exame periódico vencido, então não entra como alerta (fica visível só no
    // detalhe do colaborador).
    if (item.periodicidade_meses === null) {
      return { tone: "neutral", texto: "Pendente de registro" };
    }
    return { tone: "danger", texto: "Nunca registrado" };
  }
  return situacaoVencimento(item.data_vencimento) ?? { tone: "success", texto: "Sem vencimento" };
}

// "neutral" (exame só-admissão pendente só de registro) pesa igual a "success" — não conta
// como pendência de conformidade, só aparece no detalhe.
function peso(tone: string) {
  if (tone === "danger") return 3;
  if (tone === "warning") return 2;
  return 1;
}

type Grupo = {
  colaboradorId: string;
  nome: string;
  cargoNome: string | null;
  setorNome: string | null;
  asoItens: AsoColaboradorItem[];
  pgrItens: PgrColaboradorItem[];
};

type LinhaResumo = {
  nome: string;
  data: string | null;
  dataVencimento: string | null;
  situacao: SituacaoVencimento;
};

// Toda pessoa entra com pelo menos a linha "ASO" (mesmo sem nenhum registro — nesse caso
// entra como "Nunca registrado", já que ASO admissional é obrigatório pra todo CLT), então
// o "pior" nunca fica indefinido e a situação geral sempre reflete a real pendência, mesmo
// de quem não tem nenhum exame complementar exigido pelo PGR.
function linhasResumoDoGrupo(g: Grupo): LinhaResumo[] {
  const linhas: LinhaResumo[] = [];
  const a = g.asoItens[0] ?? null;
  linhas.push({
    nome: a ? `ASO — ${TIPO_EXAME_LABEL[a.tipo_exame] ?? a.tipo_exame}` : "ASO",
    data: a?.data ?? null,
    dataVencimento: a?.data_vencimento ?? null,
    situacao: a
      ? (situacaoVencimento(a.data_vencimento) ?? { tone: "success", texto: "Sem vencimento" })
      : { tone: "danger", texto: "Nunca registrado" },
  });
  for (const p of g.pgrItens) {
    linhas.push({
      nome: p.exame_nome,
      data: p.data,
      dataVencimento: p.data_vencimento,
      situacao: situacaoPgr(p),
    });
  }
  return linhas;
}

function piorLinha(linhas: LinhaResumo[]): LinhaResumo {
  return linhas.reduce((pior, l) => (peso(l.situacao.tone) > peso(pior.situacao.tone) ? l : pior), linhas[0]);
}

type ItemTimeline = {
  chave: string;
  colaboradorId: string;
  colaboradorNome: string;
  cargoNome: string | null;
  setorNome: string | null;
  rotulo: string;
  resultado: string | null;
  dataVencimento: string | null;
  situacao: SituacaoVencimento;
};

export function AsoClient({
  asoColaboradores,
  pgrColaboradores,
  tiposExame,
  colaboradoresNoFiltro,
}: {
  asoColaboradores: AsoColaboradorItem[];
  pgrColaboradores: PgrColaboradorItem[];
  tiposExame: { id: string; nome: string; periodicidade_meses: number | null }[];
  colaboradoresNoFiltro: { id: string; nome: string; setor_nome: string | null; cargo_nome: string | null }[];
}) {
  const searchParams = useSearchParams();
  const situacaoFiltro = searchParams.get("situacao") ?? ""; // "", "pendente", "valido"
  const [visao, setVisao] = useState<"lista" | "linha_do_tempo">("lista");
  // null = dialog fechado; "" = aberto sem colaborador pré-selecionado (botão do topo);
  // um id = aberto já com aquele colaborador (atalho "+ Registrar" da linha do tempo).
  const [dialogColaboradorId, setDialogColaboradorId] = useState<string | null>(null);

  // Base = todo colaborador que passou nos filtros da tela (não só quem já tem ASO/PGR
  // registrado) — assim quem nunca teve nenhum exame lançado também aparece, com a
  // pendência real (em vez de simplesmente sumir da lista).
  const grupos = useMemo(() => {
    const mapa = new Map<string, Grupo>();
    for (const c of colaboradoresNoFiltro) {
      mapa.set(c.id, {
        colaboradorId: c.id,
        nome: c.nome,
        cargoNome: c.cargo_nome,
        setorNome: c.setor_nome,
        asoItens: [],
        pgrItens: [],
      });
    }
    for (const a of asoColaboradores) {
      const g = mapa.get(a.colaborador_id);
      if (!g) continue;
      g.asoItens.push(a);
    }
    for (const p of pgrColaboradores) {
      const g = mapa.get(p.colaborador_id);
      if (!g) continue;
      g.pgrItens.push(p);
    }
    return Array.from(mapa.values()).sort((a, b) => a.nome.localeCompare(b.nome));
  }, [asoColaboradores, pgrColaboradores, colaboradoresNoFiltro]);

  // KPIs refletem o filtro de entidade/status/busca da tela, mas não o de Situação — do
  // contrário não daria pra ver "9 colaboradores com pendência" depois de já ter
  // escolhido "Situação: tudo em dia" (mesma regra do resto do app: filtro de recorte não
  // esconde a pendência real).
  const kpis = useMemo(() => {
    let emDia = 0;
    let comPendencia = 0;
    let nuncaRealizados = 0;
    let pendentesNotificacao = 0;
    for (const g of grupos) {
      const linhas = linhasResumoDoGrupo(g);
      const pior = piorLinha(linhas);
      if (peso(pior.situacao.tone) <= 1) emDia++;
      else comPendencia++;
      for (const l of linhas) {
        if (l.situacao.texto === "Nunca registrado") nuncaRealizados++;
        if (peso(l.situacao.tone) >= 2) pendentesNotificacao++;
      }
    }
    return { total: grupos.length, emDia, comPendencia, nuncaRealizados, pendentesNotificacao };
  }, [grupos]);

  const gruposComPior = useMemo(
    () => grupos.map((g) => ({ grupo: g, linhas: linhasResumoDoGrupo(g), pior: piorLinha(linhasResumoDoGrupo(g)) })),
    [grupos],
  );

  const listaFinal = useMemo(() => {
    let lista = gruposComPior;
    if (situacaoFiltro === "pendente") lista = lista.filter((x) => peso(x.pior.situacao.tone) >= 2);
    if (situacaoFiltro === "valido") lista = lista.filter((x) => peso(x.pior.situacao.tone) <= 1);
    return lista
      .slice()
      .sort((a, b) => peso(b.pior.situacao.tone) - peso(a.pior.situacao.tone) || a.grupo.nome.localeCompare(b.grupo.nome));
  }, [gruposComPior, situacaoFiltro]);

  const timeline = useMemo(() => {
    const itens: ItemTimeline[] = [];
    for (const g of grupos) {
      for (const a of g.asoItens) {
        const s = situacaoVencimento(a.data_vencimento);
        if (!s) continue;
        itens.push({
          chave: `aso-${a.registro_id}`,
          colaboradorId: g.colaboradorId,
          colaboradorNome: g.nome,
          cargoNome: g.cargoNome,
          setorNome: g.setorNome,
          rotulo: `ASO — ${TIPO_EXAME_LABEL[a.tipo_exame] ?? a.tipo_exame}`,
          resultado: a.resultado,
          dataVencimento: a.data_vencimento,
          situacao: s,
        });
      }
      for (const p of g.pgrItens) {
        const s = situacaoPgr(p);
        // Exame só-admissão nunca registrado não tem vencimento correndo — não faz sentido
        // aparecer na linha do tempo (nem em "sem vencimento"), só no detalhe do colaborador.
        if (s.tone === "neutral") continue;
        itens.push({
          chave: `pgr-${p.colaborador_id}-${p.exame_id}`,
          colaboradorId: g.colaboradorId,
          colaboradorNome: g.nome,
          cargoNome: g.cargoNome,
          setorNome: g.setorNome,
          rotulo: p.exame_nome,
          resultado: null,
          dataVencimento: p.data_vencimento,
          situacao: s,
        });
      }
    }
    const vencidos = itens
      .filter((i) => i.situacao.tone === "danger")
      .sort((a, b) => (a.dataVencimento ?? "").localeCompare(b.dataVencimento ?? ""));
    const porMes = new Map<string, ItemTimeline[]>();
    for (const i of itens) {
      if (i.situacao.tone === "danger") continue;
      const mes = i.dataVencimento ? i.dataVencimento.slice(0, 7) : "sem-vencimento";
      if (!porMes.has(mes)) porMes.set(mes, []);
      porMes.get(mes)!.push(i);
    }
    const meses = Array.from(porMes.keys()).sort();
    for (const itensDoMes of porMes.values()) {
      itensDoMes.sort((a, b) => a.colaboradorNome.localeCompare(b.colaboradorNome));
    }
    return { vencidos, meses, porMes };
  }, [grupos]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Colaboradores em dia" valor={String(kpis.emDia)} subtitulo={`de ${kpis.total} no filtro atual`} accent />
        <StatTile label="Colaboradores com pendência" valor={String(kpis.comPendencia)} subtitulo="algum exame a vencer, vencido ou nunca feito" />
        <StatTile label="Exames nunca realizados" valor={String(kpis.nuncaRealizados)} subtitulo="exigidos pelo PGR (ou ASO), sem nenhum registro" />
        <StatTile label="Exames a vencer ou vencidos" valor={String(kpis.pendentesNotificacao)} subtitulo="soma de todos os exames pendentes, de todo mundo" />
      </div>

      <InfoBanner>
        A lista de qual exame cada função exige, e com que periodicidade, é definida
        em <strong>Configurações → ASO e PGR → Exames exigidos por função (PGR)</strong>.
        Clique num colaborador para ver o detalhe; o histórico completo de exames
        antigos fica na ficha do colaborador, aba &quot;Exames ocupacionais&quot;.
        Quem tem um tipo de contrato marcado como isento (ex.: PJ, Estágio) nem
        aparece aqui — ajuste em <strong>Configurações → ASO e PGR → Exigência de
        ASO/PGR por tipo de contrato</strong>.
      </InfoBanner>

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
        <Button onClick={() => setDialogColaboradorId("")}>+ Registrar exame</Button>
        <RegistrarExameDialog
          key={dialogColaboradorId ?? "fechado"}
          aberto={dialogColaboradorId !== null}
          colaboradorInicialId={dialogColaboradorId ?? ""}
          colaboradores={colaboradoresNoFiltro}
          tiposExame={tiposExame}
          onOpenChange={(v) => setDialogColaboradorId(v ? (dialogColaboradorId ?? "") : null)}
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
              {listaFinal.map(({ grupo, pior }) => (
                <LinhaColaborador
                  key={grupo.colaboradorId}
                  grupo={grupo}
                  pior={pior}
                  tiposExame={tiposExame}
                />
              ))}
              {listaFinal.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                    Nenhum colaborador encontrado com os filtros atuais.
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
              aoRegistrar={setDialogColaboradorId}
            />
          )}
          {timeline.meses.map((mes) => {
            const itensDoMes = timeline.porMes.get(mes)!;
            return (
              <TabelaTimeline
                key={mes}
                titulo={`${mes === "sem-vencimento" ? "Sem vencimento" : formatarMes(mes)} (${itensDoMes.length})`}
                itens={itensDoMes}
                aoRegistrar={setDialogColaboradorId}
              />
            );
          })}
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

function TabelaTimeline({
  titulo,
  tituloTone,
  itens,
  aoRegistrar,
}: {
  titulo: string;
  tituloTone?: "danger";
  itens: ItemTimeline[];
  aoRegistrar: (colaboradorId: string) => void;
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
              <th className="px-3 py-2 font-medium">Exame</th>
              <th className="px-3 py-2 font-medium">Vencimento</th>
              <th className="px-3 py-2 font-medium">Status</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {itens.map((i) => (
              <tr key={i.chave} className="border-b border-border last:border-0 hover:bg-muted/30">
                <td className="px-3 py-2">
                  <div className="flex items-center gap-3">
                    <ColaboradorAvatar nome={i.colaboradorNome} size="sm" />
                    <div>
                      <p className="font-medium text-foreground">{i.colaboradorNome}</p>
                      <p className="text-xs text-muted-foreground">{i.cargoNome ?? "—"}</p>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-2 text-muted-foreground">{i.setorNome ?? "—"}</td>
                <td className="px-3 py-2">
                  {i.rotulo}
                  {i.resultado && (
                    <span className="ml-1.5 rounded-full bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                      {i.resultado === "apto" ? "Apto" : "Inapto"}
                    </span>
                  )}
                </td>
                <td className="px-3 py-2 text-muted-foreground">{formatarData(i.dataVencimento)}</td>
                <td className="px-3 py-2">
                  <StatusBadge tone={i.situacao.tone}>{i.situacao.texto}</StatusBadge>
                </td>
                <td className="px-3 py-2 text-right">
                  <Button variant="outline" size="sm" onClick={() => aoRegistrar(i.colaboradorId)}>
                    + Registrar
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function LinhaColaborador({
  grupo,
  pior,
  tiposExame,
}: {
  grupo: Grupo;
  pior: LinhaResumo;
  tiposExame: { id: string; nome: string; periodicidade_meses: number | null }[];
}) {
  const [aberto, setAberto] = useState(false);
  const emDia = peso(pior.situacao.tone) <= 1;
  const proximaPendenciaTexto = emDia
    ? "—"
    : `${pior.nome}${
        pior.dataVencimento
          ? ` · vence ${formatarData(pior.dataVencimento)}`
          : pior.situacao.texto === "Nunca registrado"
            ? " · nunca realizado"
            : ""
      }`;

  return (
    <>
      <tr
        className="cursor-pointer border-b border-border last:border-0 hover:bg-muted/30"
        onClick={() => setAberto((v) => !v)}
      >
        <td className="px-3 py-3 text-center text-muted-foreground">{aberto ? "▾" : "▸"}</td>
        <td className="px-3 py-3">
          <div className="flex items-center gap-3">
            <ColaboradorAvatar nome={grupo.nome} size="sm" />
            <div>
              <p className="font-medium text-foreground">{grupo.nome}</p>
              <p className="text-xs text-muted-foreground">{grupo.cargoNome ?? "—"}</p>
            </div>
          </div>
        </td>
        <td className="px-3 py-3 text-muted-foreground">{grupo.setorNome ?? "—"}</td>
        <td className="px-3 py-3">
          {emDia ? (
            <StatusBadge tone="success">Em dia</StatusBadge>
          ) : (
            <StatusBadge tone={pior.situacao.tone}>{pior.situacao.texto}</StatusBadge>
          )}
        </td>
        <td className="px-3 py-3 text-muted-foreground">{proximaPendenciaTexto}</td>
        <td className="px-3 py-3 text-right">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setAberto(true);
            }}
          >
            + Registrar
          </Button>
        </td>
      </tr>
      {aberto && (
        <tr className="border-b border-border bg-muted/20 last:border-0">
          <td />
          <td colSpan={5} className="space-y-6 p-4">
            <div>
              <h4 className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
                ASO
              </h4>
              <table className="w-full text-left text-sm">
                <tbody>
                  {grupo.asoItens.map((a) => (
                    <LinhaAsoRegistro key={a.registro_id} item={a} />
                  ))}
                  {grupo.asoItens.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-2 text-muted-foreground">
                        Nenhum ASO registrado.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
              <div className="mt-2">
                <PainelAdicionar rotulo="+ Registrar ASO">
                  {(fechar) => (
                    <FormularioAso colaboradorId={grupo.colaboradorId} aoSalvar={fechar} />
                  )}
                </PainelAdicionar>
              </div>
            </div>

            <div>
              <h4 className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
                Exames complementares (PGR)
              </h4>
              <table className="w-full text-left text-sm">
                <tbody>
                  {grupo.pgrItens
                    .slice()
                    .sort((a, b) => peso(situacaoPgr(b).tone) - peso(situacaoPgr(a).tone))
                    .map((p) => {
                      const s = situacaoPgr(p);
                      return (
                        <LinhaPgr
                          key={p.exame_id}
                          item={p}
                          situacao={s}
                          colaboradorId={grupo.colaboradorId}
                        />
                      );
                    })}
                  {grupo.pgrItens.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-2 text-muted-foreground">
                        Nenhum exame complementar exigido para esta função (PGR não
                        cadastrado).
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
              <div className="mt-2">
                <PainelAdicionar rotulo="+ Registrar exame complementar">
                  {(fechar) => (
                    <FormularioExameComplementar
                      colaboradorId={grupo.colaboradorId}
                      tiposExame={tiposExame}
                      aoSalvar={fechar}
                    />
                  )}
                </PainelAdicionar>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

function RegistrarExameDialog({
  aberto,
  colaboradorInicialId,
  colaboradores,
  tiposExame,
  onOpenChange,
}: {
  aberto: boolean;
  colaboradorInicialId: string;
  colaboradores: { id: string; nome: string; setor_nome: string | null }[];
  tiposExame: { id: string; nome: string; periodicidade_meses: number | null }[];
  onOpenChange: (aberto: boolean) => void;
}) {
  const [colaboradorId, setColaboradorId] = useState(colaboradorInicialId);

  return (
    <Dialog open={aberto} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Registrar exame</DialogTitle>
        </DialogHeader>
        <div className="space-y-1.5">
          <Label htmlFor="reg_colaborador">Colaborador</Label>
          <NativeSelect
            id="reg_colaborador"
            value={colaboradorId}
            onChange={(e) => setColaboradorId(e.target.value)}
          >
            <option value="">Selecione...</option>
            {colaboradores.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
                {c.setor_nome ? ` · ${c.setor_nome}` : ""}
              </option>
            ))}
          </NativeSelect>
        </div>
        {colaboradorId && (
          <div className="space-y-4">
            <div>
              <h4 className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
                ASO
              </h4>
              <FormularioAso colaboradorId={colaboradorId} aoSalvar={() => onOpenChange(false)} />
            </div>
            <div>
              <h4 className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
                Exame complementar
              </h4>
              <FormularioExameComplementar
                colaboradorId={colaboradorId}
                tiposExame={tiposExame}
                aoSalvar={() => onOpenChange(false)}
              />
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function LinhaAsoRegistro({ item }: { item: AsoColaboradorItem }) {
  const [editando, setEditando] = useState(false);
  const s = situacaoVencimento(item.data_vencimento);

  if (editando) {
    return (
      <tr className="border-b border-border last:border-0">
        <td colSpan={6} className="py-2">
          <FormularioEditarAso item={item} aoSalvar={() => setEditando(false)} />
        </td>
      </tr>
    );
  }

  return (
    <tr className="border-b border-border last:border-0">
      <td className="py-2">{TIPO_EXAME_LABEL[item.tipo_exame] ?? item.tipo_exame}</td>
      <td className="py-2 text-muted-foreground">{formatarData(item.data)}</td>
      <td className="py-2">
        <StatusBadge tone={item.resultado === "apto" ? "success" : "danger"}>
          {item.resultado === "apto" ? "Apto" : "Inapto"}
        </StatusBadge>
      </td>
      <td className="py-2 text-muted-foreground">{formatarData(item.data_vencimento)}</td>
      <td className="py-2">{s && <StatusBadge tone={s.tone}>{s.texto}</StatusBadge>}</td>
      <td className="py-2 text-right">
        <div className="flex justify-end gap-1">
          <Button type="button" variant="ghost" size="sm" onClick={() => setEditando(true)}>
            Editar
          </Button>
          <BotaoRemover action={() => removerAso(item.registro_id)} />
        </div>
      </td>
    </tr>
  );
}

function FormularioEditarAso({
  item,
  aoSalvar,
}: {
  item: AsoColaboradorItem;
  aoSalvar: () => void;
}) {
  const [state, formAction, pending] = useActionState<AsoFormState, FormData>(
    atualizarAso.bind(null, item.registro_id),
    undefined,
  );

  useEffect(() => {
    if (state && "ok" in state) aoSalvar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <form
      action={formAction}
      className="grid max-w-xl grid-cols-2 gap-3 rounded-md border border-border bg-muted/30 p-3"
    >
      {state && "error" in state && (
        <p className="col-span-2 rounded-md bg-danger-bg px-3 py-2 text-sm text-danger">
          {state.error}
        </p>
      )}
      <div className="space-y-1">
        <Label htmlFor="ea_tipo">Tipo de exame</Label>
        <NativeSelect id="ea_tipo" name="tipo_exame" required defaultValue={item.tipo_exame}>
          <option value="" disabled>
            Selecione...
          </option>
          {Object.entries(TIPO_EXAME_LABEL).map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </NativeSelect>
      </div>
      <div className="space-y-1">
        <Label htmlFor="ea_resultado">Resultado</Label>
        <NativeSelect id="ea_resultado" name="resultado" required defaultValue={item.resultado}>
          <option value="" disabled>
            Selecione...
          </option>
          <option value="apto">Apto</option>
          <option value="inapto">Inapto</option>
        </NativeSelect>
      </div>
      <div className="space-y-1">
        <Label htmlFor="ea_data">Data</Label>
        <Input id="ea_data" name="data" type="date" required defaultValue={item.data} />
      </div>
      <div className="space-y-1">
        <Label htmlFor="ea_vencimento">Vencimento</Label>
        <Input
          id="ea_vencimento"
          name="data_vencimento"
          type="date"
          defaultValue={item.data_vencimento ?? ""}
        />
      </div>
      <div className="col-span-2 flex justify-end gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={aoSalvar}>
          Cancelar
        </Button>
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Salvando..." : "Salvar"}
        </Button>
      </div>
    </form>
  );
}

function LinhaPgr({
  item,
  situacao,
  colaboradorId,
}: {
  item: PgrColaboradorItem;
  situacao: SituacaoVencimento;
  colaboradorId: string;
}) {
  const [modo, setModo] = useState<"nenhum" | "editando" | "registrando">("nenhum");

  return (
    <>
      <tr className="border-b border-border last:border-0">
        <td className="py-2">{item.exame_nome}</td>
        <td className="py-2 text-muted-foreground">
          {item.data ? formatarData(item.data) : "—"}
        </td>
        <td className="py-2 text-muted-foreground">
          {item.data_vencimento ? formatarData(item.data_vencimento) : "—"}
        </td>
        <td className="py-2">
          <StatusBadge tone={situacao.tone}>{situacao.texto}</StatusBadge>
        </td>
        <td className="py-2 text-right">
          <div className="flex items-center justify-end gap-2">
            {item.registro_id && (
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
              onClick={() => setModo(modo === "registrando" ? "nenhum" : "registrando")}
            >
              Registrar
            </Button>
            {item.registro_id && (
              <BotaoRemover action={() => removerExameComplementar(item.registro_id!)} />
            )}
          </div>
        </td>
      </tr>
      {modo === "editando" && item.registro_id && (
        <tr>
          <td colSpan={5} className="pb-3">
            <FormularioEditarExameComplementar
              registroId={item.registro_id}
              data={item.data!}
              periodicidadeMeses={item.periodicidade_meses}
              aoSalvar={() => setModo("nenhum")}
            />
          </td>
        </tr>
      )}
      {modo === "registrando" && (
        <tr>
          <td colSpan={5} className="pb-3">
            <FormularioExameComplementarRapido
              colaboradorId={colaboradorId}
              exameId={item.exame_id}
              periodicidadeMeses={item.periodicidade_meses}
              aoSalvar={() => setModo("nenhum")}
            />
          </td>
        </tr>
      )}
    </>
  );
}

function FormularioEditarExameComplementar({
  registroId,
  data,
  periodicidadeMeses,
  aoSalvar,
}: {
  registroId: string;
  data: string;
  periodicidadeMeses: number | null;
  aoSalvar: () => void;
}) {
  const [state, formAction, pending] = useActionState<AsoFormState, FormData>(
    atualizarExameComplementar.bind(null, registroId),
    undefined,
  );

  useEffect(() => {
    if (state && "ok" in state) aoSalvar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <form
      action={formAction}
      className="flex flex-wrap items-end gap-3 rounded-md border border-border bg-muted/30 p-3"
    >
      {state && "error" in state && (
        <p className="w-full rounded-md bg-danger-bg px-3 py-2 text-sm text-danger">
          {state.error}
        </p>
      )}
      <input type="hidden" name="periodicidade_meses" value={periodicidadeMeses ?? ""} />
      <div className="space-y-1">
        <Label htmlFor="edc_data">Data</Label>
        <Input id="edc_data" name="data" type="date" required defaultValue={data} />
      </div>
      <p className="text-xs text-muted-foreground">
        {periodicidadeMeses
          ? "O vencimento é recalculado automaticamente a partir desta data."
          : "Este exame é somente na admissão (sem vencimento)."}
      </p>
      <div className="flex gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={aoSalvar}>
          Cancelar
        </Button>
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Salvando..." : "Salvar"}
        </Button>
      </div>
    </form>
  );
}

function FormularioAso({
  colaboradorId,
  aoSalvar,
}: {
  colaboradorId: string;
  aoSalvar: () => void;
}) {
  const action = adicionarAso.bind(null, colaboradorId);
  const [state, formAction, pending] = useActionState<AsoFormState, FormData>(action, undefined);

  useEffect(() => {
    if (state && "ok" in state) aoSalvar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <form
      action={formAction}
      className="grid max-w-xl grid-cols-2 gap-3 rounded-md border border-border bg-muted/30 p-3"
    >
      {state && "error" in state && (
        <p className="col-span-2 rounded-md bg-danger-bg px-3 py-2 text-sm text-danger">
          {state.error}
        </p>
      )}
      <div className="space-y-1">
        <Label htmlFor="aso_tipo">Tipo de exame</Label>
        <NativeSelect id="aso_tipo" name="tipo_exame" required defaultValue="">
          <option value="" disabled>
            Selecione...
          </option>
          {Object.entries(TIPO_EXAME_LABEL).map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </NativeSelect>
      </div>
      <div className="space-y-1">
        <Label htmlFor="aso_resultado">Resultado</Label>
        <NativeSelect id="aso_resultado" name="resultado" required defaultValue="">
          <option value="" disabled>
            Selecione...
          </option>
          <option value="apto">Apto</option>
          <option value="inapto">Inapto</option>
        </NativeSelect>
      </div>
      <div className="space-y-1">
        <Label htmlFor="aso_data">Data</Label>
        <Input id="aso_data" name="data" type="date" required defaultValue={hojeISO()} />
      </div>
      <div className="space-y-1">
        <Label htmlFor="aso_vencimento">Vencimento</Label>
        <Input id="aso_vencimento" name="data_vencimento" type="date" />
      </div>
      <div className="col-span-2 flex justify-end">
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Salvando..." : "Registrar"}
        </Button>
      </div>
    </form>
  );
}

function FormularioExameComplementar({
  colaboradorId,
  tiposExame,
  aoSalvar,
}: {
  colaboradorId: string;
  tiposExame: { id: string; nome: string; periodicidade_meses: number | null }[];
  aoSalvar: () => void;
}) {
  const [exameId, setExameId] = useState("");
  const exame = tiposExame.find((e) => e.id === exameId);
  const action = exameId
    ? adicionarExameComplementar.bind(null, colaboradorId, exameId)
    : async (prevState: AsoFormState) => prevState;
  const [state, formAction, pending] = useActionState<AsoFormState, FormData>(
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
      className="grid max-w-xl grid-cols-2 gap-3 rounded-md border border-border bg-muted/30 p-3"
    >
      {state && "error" in state && (
        <p className="col-span-2 rounded-md bg-danger-bg px-3 py-2 text-sm text-danger">
          {state.error}
        </p>
      )}
      <div className="space-y-1">
        <Label htmlFor="exame_sel">Exame</Label>
        <NativeSelect
          id="exame_sel"
          value={exameId}
          onChange={(e) => setExameId(e.target.value)}
          required
        >
          <option value="" disabled>
            Selecione...
          </option>
          {tiposExame.map((e) => (
            <option key={e.id} value={e.id}>
              {e.nome}
            </option>
          ))}
        </NativeSelect>
        <input type="hidden" name="periodicidade_meses" value={exame?.periodicidade_meses ?? ""} />
      </div>
      <div className="space-y-1">
        <Label htmlFor="exame_data">Data</Label>
        <Input id="exame_data" name="data" type="date" required defaultValue={hojeISO()} />
      </div>
      <div className="col-span-2 flex justify-end">
        <Button type="submit" size="sm" disabled={pending || !exameId}>
          {pending ? "Salvando..." : "Registrar"}
        </Button>
      </div>
    </form>
  );
}

function FormularioExameComplementarRapido({
  colaboradorId,
  exameId,
  periodicidadeMeses,
  aoSalvar,
}: {
  colaboradorId: string;
  exameId: string;
  periodicidadeMeses: number | null;
  aoSalvar: () => void;
}) {
  const action = adicionarExameComplementar.bind(null, colaboradorId, exameId);
  const [state, formAction, pending] = useActionState<AsoFormState, FormData>(action, undefined);

  useEffect(() => {
    if (state && "ok" in state) aoSalvar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <form
      action={formAction}
      className="flex items-end gap-3 rounded-md border border-border bg-muted/30 p-3"
    >
      {state && "error" in state && (
        <p className="rounded-md bg-danger-bg px-3 py-2 text-sm text-danger">{state.error}</p>
      )}
      <input type="hidden" name="periodicidade_meses" value={periodicidadeMeses ?? ""} />
      <div className="space-y-1">
        <Label htmlFor="rapido_data">Data</Label>
        <Input id="rapido_data" name="data" type="date" required defaultValue={hojeISO()} />
      </div>
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "Salvando..." : "Confirmar"}
      </Button>
    </form>
  );
}
