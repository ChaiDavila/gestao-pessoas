"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/native-select";
import { PainelAdicionar } from "@/components/painel-adicionar";
import { BotaoRemover } from "@/components/botao-remover";
import { StatusBadge } from "@/components/status-badge";
import { formatarData, hojeISO, somarMeses } from "@/lib/date";
import { situacaoVencimento, situacaoPgr } from "@/lib/vencimento";
import type { SubRecursoState } from "./sub-recursos-actions";
import type { PgrColaboradorItem } from "@/lib/data/aso";
import {
  atualizarAcompanhamentoExame,
  ativarAcompanhamentoExameNovo,
} from "@/app/(app)/aso/actions";

type AsoItem = {
  id: string;
  tipo_exame: string;
  data: string;
  resultado: string;
  data_vencimento: string | null;
};

type Acao = (prevState: SubRecursoState, formData: FormData) => Promise<SubRecursoState>;
type AcaoComId = (
  registroId: string,
  prevState: SubRecursoState,
  formData: FormData,
) => Promise<SubRecursoState>;

const TIPO_EXAME_LABEL: Record<string, string> = {
  admissional: "Admissional",
  periodico: "Periódico",
  demissional: "Demissional",
  mudanca_funcao: "Mudança de função",
  retorno_trabalho: "Retorno ao trabalho",
};

export function ExamesTab({
  colaboradorId,
  asoRegistros,
  examesComplementares,
  opcoesExame,
  adicionarAsoAction,
  atualizarAsoAction,
  removerAsoAction,
  adicionarExameAction,
  atualizarExameAction,
  removerExameAction,
}: {
  colaboradorId: string;
  asoRegistros: AsoItem[];
  examesComplementares: PgrColaboradorItem[];
  opcoesExame: { id: string; nome: string; periodicidade_meses: number | null }[];
  adicionarAsoAction: Acao;
  atualizarAsoAction: AcaoComId;
  removerAsoAction: (asoId: string) => Promise<void>;
  adicionarExameAction: Acao;
  atualizarExameAction: AcaoComId;
  removerExameAction: (exameRegistroId: string) => Promise<void>;
}) {
  const exameIdsAtuais = new Set(examesComplementares.map((e) => e.exame_id));
  const opcoesDisponiveis = opcoesExame.filter((o) => !exameIdsAtuais.has(o.id));
  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-foreground">ASO</h3>
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-2 font-medium">Tipo</th>
                <th className="px-4 py-2 font-medium">Data</th>
                <th className="px-4 py-2 font-medium">Resultado</th>
                <th className="px-4 py-2 font-medium">Vencimento</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody>
              {asoRegistros.map((a) => (
                <LinhaAso
                  key={a.id}
                  aso={a}
                  atualizarAction={atualizarAsoAction.bind(null, a.id)}
                  removerAction={() => removerAsoAction(a.id)}
                />
              ))}
              {asoRegistros.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">
                    Nenhum ASO registrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <PainelAdicionar rotulo="+ Registrar ASO">
          {(fechar) => (
            <FormularioAso action={adicionarAsoAction} textoBotao="Registrar" aoSalvar={fechar} />
          )}
        </PainelAdicionar>
      </section>

      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-foreground">
          Exames complementares (PGR)
        </h3>
        <p className="text-xs text-muted-foreground">
          Mesmas regras e situações do módulo ASO: um exame exigido pela
          função aparece aqui mesmo sem nenhum registro ainda (&quot;Sem
          registro&quot;). Desativar o acompanhamento preserva o histórico,
          só tira dos alertas.
        </p>
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-2 font-medium">Exame</th>
                <th className="px-4 py-2 font-medium">Data</th>
                <th className="px-4 py-2 font-medium">Vencimento</th>
                <th className="px-4 py-2 font-medium">Situação</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody>
              {examesComplementares.map((e) => (
                <LinhaExameComplementar
                  key={e.exame_id}
                  exame={e}
                  atualizarAction={e.registro_id ? atualizarExameAction.bind(null, e.registro_id) : null}
                  removerAction={e.registro_id ? () => removerExameAction(e.registro_id!) : null}
                  adicionarAction={adicionarExameAction}
                />
              ))}
              {examesComplementares.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">
                    Nenhum exame complementar acompanhado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <PainelAdicionar rotulo="+ Registrar exame complementar">
            {(fechar) => (
              <FormularioExameComplementar
                action={adicionarExameAction}
                opcoesExame={opcoesExame}
                textoBotao="Registrar"
                aoSalvar={fechar}
              />
            )}
          </PainelAdicionar>
          {opcoesDisponiveis.length > 0 && (
            <AcompanharNovoExame colaboradorId={colaboradorId} opcoes={opcoesDisponiveis} />
          )}
        </div>
      </section>
    </div>
  );
}

function LinhaAso({
  aso,
  atualizarAction,
  removerAction,
}: {
  aso: AsoItem;
  atualizarAction: Acao;
  removerAction: () => Promise<void>;
}) {
  const [editando, setEditando] = useState(false);
  const situacao = situacaoVencimento(aso.data_vencimento);

  if (editando) {
    return (
      <tr className="border-b border-border last:border-0">
        <td colSpan={5} className="px-4 py-3">
          <FormularioAso
            action={atualizarAction}
            valoresIniciais={aso}
            textoBotao="Salvar"
            aoSalvar={() => setEditando(false)}
            aoCancelar={() => setEditando(false)}
          />
        </td>
      </tr>
    );
  }

  return (
    <tr className="border-b border-border last:border-0">
      <td className="px-4 py-2">{TIPO_EXAME_LABEL[aso.tipo_exame] ?? aso.tipo_exame}</td>
      <td className="px-4 py-2 text-muted-foreground">{formatarData(aso.data)}</td>
      <td className="px-4 py-2">
        <StatusBadge tone={aso.resultado === "apto" ? "success" : "danger"}>
          {aso.resultado === "apto" ? "Apto" : "Inapto"}
        </StatusBadge>
      </td>
      <td className="px-4 py-2 text-muted-foreground">
        {formatarData(aso.data_vencimento)}
        {situacao && <StatusBadge tone={situacao.tone}> {situacao.texto}</StatusBadge>}
      </td>
      <td className="px-4 py-2 text-right">
        <div className="flex justify-end gap-1">
          <Button type="button" variant="ghost" size="sm" onClick={() => setEditando(true)}>
            Editar
          </Button>
          <BotaoRemover action={removerAction} />
        </div>
      </td>
    </tr>
  );
}

function LinhaExameComplementar({
  exame,
  atualizarAction,
  removerAction,
  adicionarAction,
}: {
  exame: PgrColaboradorItem;
  atualizarAction: Acao | null;
  removerAction: (() => Promise<void>) | null;
  adicionarAction: Acao;
}) {
  const [modo, setModo] = useState<"nenhum" | "editando" | "registrando">("nenhum");
  const [pendenteAcompanhamento, setPendenteAcompanhamento] = useState(false);
  const situacao = situacaoPgr(exame);

  function alternarAcompanhamento() {
    setPendenteAcompanhamento(true);
    atualizarAcompanhamentoExame(exame.acompanhamento_id, !exame.acompanhar).finally(() =>
      setPendenteAcompanhamento(false),
    );
  }

  return (
    <>
      <tr className="border-b border-border last:border-0">
        <td className="px-4 py-2">{exame.exame_nome}</td>
        <td className="px-4 py-2 text-muted-foreground">
          {exame.data ? formatarData(exame.data) : "—"}
        </td>
        <td className="px-4 py-2 text-muted-foreground">
          {exame.data_vencimento
            ? formatarData(exame.data_vencimento)
            : exame.periodicidade_meses === null
              ? "Somente na admissão"
              : "—"}
        </td>
        <td className="px-4 py-2">
          {exame.acompanhar ? (
            <StatusBadge tone={situacao.tone}>{situacao.texto}</StatusBadge>
          ) : (
            <StatusBadge tone="neutral">Sem acompanhamento</StatusBadge>
          )}
        </td>
        <td className="px-4 py-2 text-right">
          <div className="flex justify-end gap-1">
            {atualizarAction && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setModo(modo === "editando" ? "nenhum" : "editando")}
              >
                Editar
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setModo(modo === "registrando" ? "nenhum" : "registrando")}
            >
              Registrar
            </Button>
            {removerAction && <BotaoRemover action={removerAction} />}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={pendenteAcompanhamento}
              onClick={alternarAcompanhamento}
            >
              {exame.acompanhar ? "Desativar acompanhamento" : "Ativar acompanhamento"}
            </Button>
          </div>
        </td>
      </tr>
      {modo === "editando" && atualizarAction && (
        <tr>
          <td colSpan={5} className="px-4 pb-3">
            <FormularioEditarExameComplementarFicha
              action={atualizarAction}
              data={exame.data ?? hojeISO()}
              dataVencimento={exame.data_vencimento}
              aoSalvar={() => setModo("nenhum")}
            />
          </td>
        </tr>
      )}
      {modo === "registrando" && (
        <tr>
          <td colSpan={5} className="px-4 pb-3">
            <FormularioRegistrarExameRapido
              action={adicionarAction}
              exameId={exame.exame_id}
              periodicidadeMeses={exame.periodicidade_meses}
              aoSalvar={() => setModo("nenhum")}
            />
          </td>
        </tr>
      )}
    </>
  );
}

function FormularioEditarExameComplementarFicha({
  action,
  data,
  dataVencimento,
  aoSalvar,
}: {
  action: Acao;
  data: string;
  dataVencimento: string | null;
  aoSalvar: () => void;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);

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
      <div className="space-y-1">
        <Label htmlFor="edc_data">Data</Label>
        <Input id="edc_data" name="data" type="date" required defaultValue={data} />
      </div>
      <div className="space-y-1">
        <Label htmlFor="edc_vencimento">Vencimento</Label>
        <Input
          id="edc_vencimento"
          name="data_vencimento"
          type="date"
          defaultValue={dataVencimento ?? ""}
        />
      </div>
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

function FormularioRegistrarExameRapido({
  action,
  exameId,
  periodicidadeMeses,
  aoSalvar,
}: {
  action: Acao;
  exameId: string;
  periodicidadeMeses: number | null;
  aoSalvar: () => void;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);

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
      <input type="hidden" name="exame_id" value={exameId} />
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

// Liga o acompanhamento de um exame complementar que a função do colaborador não exige
// (certificação/exame extra que alguém quer monitorar mesmo sem ser exigência do PGR).
function AcompanharNovoExame({
  colaboradorId,
  opcoes,
}: {
  colaboradorId: string;
  opcoes: { id: string; nome: string }[];
}) {
  const [exameId, setExameId] = useState("");
  const [pendente, setPendente] = useState(false);

  function ativar() {
    if (!exameId) return;
    setPendente(true);
    ativarAcompanhamentoExameNovo(colaboradorId, exameId).finally(() => {
      setPendente(false);
      setExameId("");
    });
  }

  return (
    <div className="flex items-end gap-2">
      <div className="w-64 space-y-1">
        <Label htmlFor="novo_exame_ficha">Acompanhar outro exame</Label>
        <NativeSelect
          id="novo_exame_ficha"
          value={exameId}
          onChange={(e) => setExameId(e.target.value)}
        >
          <option value="">Selecione...</option>
          {opcoes.map((o) => (
            <option key={o.id} value={o.id}>
              {o.nome}
            </option>
          ))}
        </NativeSelect>
      </div>
      <Button type="button" size="sm" variant="outline" disabled={!exameId || pendente} onClick={ativar}>
        {pendente ? "Ativando..." : "Ativar"}
      </Button>
    </div>
  );
}

function FormularioAso({
  action,
  valoresIniciais,
  textoBotao,
  aoSalvar,
  aoCancelar,
}: {
  action: Acao;
  valoresIniciais?: AsoItem;
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
      className="max-w-xl space-y-4 rounded-lg border border-border bg-card p-4"
    >
      {state && "error" in state && (
        <p className="rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">
          {state.error}
        </p>
      )}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="aso_tipo">Tipo de exame</Label>
          <NativeSelect
            id="aso_tipo"
            name="tipo_exame"
            required
            defaultValue={valoresIniciais?.tipo_exame ?? ""}
          >
            <option value="" disabled>
              Selecione...
            </option>
            {Object.entries(TIPO_EXAME_LABEL).map(([valor, label]) => (
              <option key={valor} value={valor}>
                {label}
              </option>
            ))}
          </NativeSelect>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="aso_resultado">Resultado</Label>
          <NativeSelect
            id="aso_resultado"
            name="resultado"
            required
            defaultValue={valoresIniciais?.resultado ?? ""}
          >
            <option value="" disabled>
              Selecione...
            </option>
            <option value="apto">Apto</option>
            <option value="inapto">Inapto</option>
          </NativeSelect>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="aso_data">Data</Label>
          <Input id="aso_data" name="data" type="date" required defaultValue={valoresIniciais?.data ?? ""} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="aso_vencimento">Vencimento</Label>
          <Input
            id="aso_vencimento"
            name="data_vencimento"
            type="date"
            defaultValue={valoresIniciais?.data_vencimento ?? ""}
          />
          {!valoresIniciais && (
            <p className="text-xs text-muted-foreground">
              Deixe em branco num ASO periódico pra calcular sozinho pela
              periodicidade da função, se configurada.
            </p>
          )}
        </div>
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

// Só pra registrar um exame complementar NOVO (que ainda não tinha nenhuma linha de
// acompanhamento) — editar ou renovar um já existente usa os formulários dedicados acima.
function FormularioExameComplementar({
  action,
  opcoesExame,
  textoBotao,
  aoSalvar,
  aoCancelar,
}: {
  action: Acao;
  opcoesExame: { id: string; nome: string; periodicidade_meses: number | null }[];
  textoBotao: string;
  aoSalvar: () => void;
  aoCancelar?: () => void;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const [exameId, setExameId] = useState("");
  const [data, setData] = useState(hojeISO());

  useEffect(() => {
    if (state && "ok" in state) aoSalvar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  const exameSelecionado = opcoesExame.find((e) => e.id === exameId);
  const vencimentoPrevisto = useMemo(() => {
    if (!exameSelecionado?.periodicidade_meses || !data) return null;
    return somarMeses(data, exameSelecionado.periodicidade_meses);
  }, [exameSelecionado, data]);

  return (
    <form
      action={formAction}
      className="max-w-xl space-y-4 rounded-lg border border-border bg-card p-4"
    >
      {state && "error" in state && (
        <p className="rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">
          {state.error}
        </p>
      )}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="exame_id">Exame</Label>
          <NativeSelect
            id="exame_id"
            name="exame_id"
            required
            value={exameId}
            onChange={(e) => setExameId(e.target.value)}
          >
            <option value="" disabled>
              Selecione...
            </option>
            {opcoesExame.map((e) => (
              <option key={e.id} value={e.id}>
                {e.nome}
              </option>
            ))}
          </NativeSelect>
          <input
            type="hidden"
            name="periodicidade_meses"
            value={exameSelecionado?.periodicidade_meses ?? ""}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="exame_data">Data</Label>
          <Input
            id="exame_data"
            name="data"
            type="date"
            required
            value={data}
            onChange={(e) => setData(e.target.value)}
          />
        </div>
      </div>
      <p className="text-sm text-muted-foreground">
        {exameSelecionado?.periodicidade_meses
          ? `Vencimento calculado automaticamente: ${vencimentoPrevisto ? formatarData(vencimentoPrevisto) : "—"}`
          : "Este exame é somente na admissão (sem vencimento)."}
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
