"use client";

import { useEffect, useMemo, useState } from "react";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/native-select";
import { PainelAdicionar } from "@/components/painel-adicionar";
import { BotaoRemover } from "@/components/botao-remover";
import { StatusBadge } from "@/components/status-badge";
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
  if (!item.registro_id) return { tone: "danger", texto: "Nunca registrado" };
  return situacaoVencimento(item.data_vencimento) ?? { tone: "success", texto: "Sem vencimento" };
}

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

export function AsoClient({
  asoColaboradores,
  pgrColaboradores,
  tiposExame,
}: {
  asoColaboradores: AsoColaboradorItem[];
  pgrColaboradores: PgrColaboradorItem[];
  tiposExame: { id: string; nome: string; periodicidade_meses: number | null }[];
}) {
  const [busca, setBusca] = useState("");
  const [visao, setVisao] = useState<"lista" | "linha_do_tempo">("lista");

  const grupos = useMemo(() => {
    const mapa = new Map<string, Grupo>();
    for (const a of asoColaboradores) {
      if (!mapa.has(a.colaborador_id)) {
        mapa.set(a.colaborador_id, {
          colaboradorId: a.colaborador_id,
          nome: a.colaborador_nome,
          cargoNome: a.cargo_nome,
          setorNome: a.setor_nome,
          asoItens: [],
          pgrItens: [],
        });
      }
      mapa.get(a.colaborador_id)!.asoItens.push(a);
    }
    for (const p of pgrColaboradores) {
      if (!mapa.has(p.colaborador_id)) {
        mapa.set(p.colaborador_id, {
          colaboradorId: p.colaborador_id,
          nome: p.colaborador_nome,
          cargoNome: p.cargo_nome,
          setorNome: p.setor_nome,
          asoItens: [],
          pgrItens: [],
        });
      }
      mapa.get(p.colaborador_id)!.pgrItens.push(p);
    }
    let lista = Array.from(mapa.values());
    if (busca.trim()) {
      const b = busca.trim().toLowerCase();
      lista = lista.filter((g) => g.nome.toLowerCase().includes(b));
    }
    return lista.sort((a, b) => a.nome.localeCompare(b.nome));
  }, [asoColaboradores, pgrColaboradores, busca]);

  const timeline = useMemo(() => {
    type ItemTimeline = {
      chave: string;
      colaboradorId: string;
      colaboradorNome: string;
      rotulo: string;
      dataVencimento: string | null;
      situacao: SituacaoVencimento;
      exameId?: string;
      periodicidadeMeses?: number | null;
    };
    const itens: ItemTimeline[] = [];
    for (const g of grupos) {
      for (const a of g.asoItens) {
        const s = situacaoVencimento(a.data_vencimento);
        if (!s) continue;
        itens.push({
          chave: `aso-${a.registro_id}`,
          colaboradorId: g.colaboradorId,
          colaboradorNome: g.nome,
          rotulo: `ASO — ${TIPO_EXAME_LABEL[a.tipo_exame] ?? a.tipo_exame}`,
          dataVencimento: a.data_vencimento,
          situacao: s,
        });
      }
      for (const p of g.pgrItens) {
        const s = situacaoPgr(p);
        itens.push({
          chave: `pgr-${p.colaborador_id}-${p.exame_id}`,
          colaboradorId: g.colaboradorId,
          colaboradorNome: g.nome,
          rotulo: p.exame_nome,
          dataVencimento: p.data_vencimento,
          situacao: s,
          exameId: p.exame_id,
          periodicidadeMeses: p.periodicidade_meses,
        });
      }
    }
    const vencidos = itens.filter((i) => i.situacao.tone === "danger");
    const porMes = new Map<string, ItemTimeline[]>();
    for (const i of itens) {
      if (i.situacao.tone === "danger") continue;
      const mes = i.dataVencimento ? i.dataVencimento.slice(0, 7) : "sem-vencimento";
      if (!porMes.has(mes)) porMes.set(mes, []);
      porMes.get(mes)!.push(i);
    }
    const meses = Array.from(porMes.keys()).sort();
    return { vencidos, meses, porMes };
  }, [grupos]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por nome do colaborador..."
          className="w-64"
        />
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

      {visao === "lista" ? (
        <div className="space-y-2">
          {grupos.map((g) => (
            <LinhaColaborador key={g.colaboradorId} grupo={g} tiposExame={tiposExame} />
          ))}
          {grupos.length === 0 && (
            <p className="rounded-lg border border-border p-6 text-center text-sm text-muted-foreground">
              Nenhum colaborador encontrado.
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {timeline.vencidos.length > 0 && (
            <div>
              <h3 className="mb-2 text-sm font-semibold text-danger">Vencidos</h3>
              <div className="space-y-1">
                {timeline.vencidos.map((i) => (
                  <div key={i.chave} className="rounded-lg border border-border p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {i.colaboradorNome}{" "}
                          <span className="font-normal text-muted-foreground">
                            · {i.rotulo}
                          </span>
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Vencimento: {formatarData(i.dataVencimento)}
                        </p>
                      </div>
                      <StatusBadge tone={i.situacao.tone}>{i.situacao.texto}</StatusBadge>
                    </div>
                  </div>
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
                {timeline.porMes.get(mes)!.map((i) => (
                  <div key={i.chave} className="rounded-lg border border-border p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {i.colaboradorNome}{" "}
                          <span className="font-normal text-muted-foreground">
                            · {i.rotulo}
                          </span>
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Vencimento: {formatarData(i.dataVencimento)}
                        </p>
                      </div>
                      <StatusBadge tone={i.situacao.tone}>{i.situacao.texto}</StatusBadge>
                    </div>
                  </div>
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
  grupo,
  tiposExame,
}: {
  grupo: Grupo;
  tiposExame: { id: string; nome: string; periodicidade_meses: number | null }[];
}) {
  const [aberto, setAberto] = useState(false);

  const situacoes = [
    ...grupo.asoItens.map((a) => situacaoVencimento(a.data_vencimento)).filter(Boolean),
    ...grupo.pgrItens.map((p) => situacaoPgr(p)),
  ] as SituacaoVencimento[];
  const pior = situacoes.sort((a, b) => peso(b.tone) - peso(a.tone))[0];

  return (
    <div className="rounded-lg border border-border">
      <button
        type="button"
        onClick={() => setAberto(!aberto)}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
      >
        <div>
          <p className="font-medium text-foreground">{grupo.nome}</p>
          <p className="text-xs text-muted-foreground">
            {grupo.cargoNome ?? "—"} · {grupo.setorNome ?? "—"}
          </p>
        </div>
        {pior && <StatusBadge tone={pior.tone}>{pior.texto}</StatusBadge>}
      </button>
      {aberto && (
        <div className="space-y-6 border-t border-border p-4">
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
        </div>
      )}
    </div>
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
        <p className="col-span-2 rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">
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
        <p className="w-full rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">
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
        <p className="col-span-2 rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">
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
        <p className="col-span-2 rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">
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
        <p className="rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">{state.error}</p>
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
