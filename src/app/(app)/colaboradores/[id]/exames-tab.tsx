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
import type { SubRecursoState } from "./sub-recursos-actions";
import type { ExameComplementarRow } from "@/lib/data/colaborador-detalhe";

type AsoItem = {
  id: string;
  tipo_exame: string;
  data: string;
  resultado: string;
  data_vencimento: string | null;
};

type ExameComplementarItem = ExameComplementarRow;

const TIPO_EXAME_LABEL: Record<string, string> = {
  admissional: "Admissional",
  periodico: "Periódico",
  demissional: "Demissional",
  mudanca_funcao: "Mudança de função",
  retorno_trabalho: "Retorno ao trabalho",
};

function situacaoVencimento(dataVencimento: string | null) {
  if (!dataVencimento) return null;
  const hoje = hojeISO();
  if (dataVencimento < hoje) return { tone: "danger" as const, texto: "Vencido" };
  const em30dias = somarMeses(hoje, 1);
  if (dataVencimento <= em30dias) return { tone: "warning" as const, texto: "A vencer" };
  return { tone: "success" as const, texto: "Em dia" };
}

export function ExamesTab({
  asoRegistros,
  examesComplementares,
  opcoesExame,
  adicionarAsoAction,
  removerAsoAction,
  adicionarExameAction,
  removerExameAction,
}: {
  asoRegistros: AsoItem[];
  examesComplementares: ExameComplementarItem[];
  opcoesExame: { id: string; nome: string; periodicidade_meses: number | null }[];
  adicionarAsoAction: (
    prevState: SubRecursoState,
    formData: FormData,
  ) => Promise<SubRecursoState>;
  removerAsoAction: (asoId: string) => Promise<void>;
  adicionarExameAction: (
    prevState: SubRecursoState,
    formData: FormData,
  ) => Promise<SubRecursoState>;
  removerExameAction: (exameRegistroId: string) => Promise<void>;
}) {
  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-foreground">ASO</h3>
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-muted/40 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-2 font-medium">Tipo</th>
                <th className="px-4 py-2 font-medium">Data</th>
                <th className="px-4 py-2 font-medium">Resultado</th>
                <th className="px-4 py-2 font-medium">Vencimento</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody>
              {asoRegistros.map((a) => {
                const situacao = situacaoVencimento(a.data_vencimento);
                return (
                  <tr key={a.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-2">
                      {TIPO_EXAME_LABEL[a.tipo_exame] ?? a.tipo_exame}
                    </td>
                    <td className="px-4 py-2 text-muted-foreground">
                      {formatarData(a.data)}
                    </td>
                    <td className="px-4 py-2">
                      <StatusBadge tone={a.resultado === "apto" ? "success" : "danger"}>
                        {a.resultado === "apto" ? "Apto" : "Inapto"}
                      </StatusBadge>
                    </td>
                    <td className="px-4 py-2 text-muted-foreground">
                      {formatarData(a.data_vencimento)}
                      {situacao && (
                        <StatusBadge tone={situacao.tone}> {situacao.texto}</StatusBadge>
                      )}
                    </td>
                    <td className="px-4 py-2 text-right">
                      <BotaoRemover action={() => removerAsoAction(a.id)} />
                    </td>
                  </tr>
                );
              })}
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
            <FormularioAso action={adicionarAsoAction} aoSalvar={fechar} />
          )}
        </PainelAdicionar>
      </section>

      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-foreground">
          Exames complementares
        </h3>
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-muted/40 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-2 font-medium">Exame</th>
                <th className="px-4 py-2 font-medium">Data</th>
                <th className="px-4 py-2 font-medium">Vencimento</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody>
              {examesComplementares.map((e) => {
                const situacao = situacaoVencimento(e.data_vencimento);
                return (
                  <tr key={e.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-2">
                      {e.config_tipos_exame?.nome ?? "—"}
                    </td>
                    <td className="px-4 py-2 text-muted-foreground">
                      {formatarData(e.data)}
                    </td>
                    <td className="px-4 py-2 text-muted-foreground">
                      {e.data_vencimento ? formatarData(e.data_vencimento) : "Somente na admissão"}
                      {situacao && (
                        <StatusBadge tone={situacao.tone}> {situacao.texto}</StatusBadge>
                      )}
                    </td>
                    <td className="px-4 py-2 text-right">
                      <BotaoRemover action={() => removerExameAction(e.id)} />
                    </td>
                  </tr>
                );
              })}
              {examesComplementares.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-muted-foreground">
                    Nenhum exame complementar registrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <PainelAdicionar rotulo="+ Registrar exame complementar">
          {(fechar) => (
            <FormularioExameComplementar
              action={adicionarExameAction}
              opcoesExame={opcoesExame}
              aoSalvar={fechar}
            />
          )}
        </PainelAdicionar>
      </section>
    </div>
  );
}

function FormularioAso({
  action,
  aoSalvar,
}: {
  action: (
    prevState: SubRecursoState,
    formData: FormData,
  ) => Promise<SubRecursoState>;
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
          <NativeSelect id="aso_tipo" name="tipo_exame" required defaultValue="">
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
          <NativeSelect id="aso_resultado" name="resultado" required defaultValue="">
            <option value="" disabled>
              Selecione...
            </option>
            <option value="apto">Apto</option>
            <option value="inapto">Inapto</option>
          </NativeSelect>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="aso_data">Data</Label>
          <Input id="aso_data" name="data" type="date" required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="aso_vencimento">Vencimento</Label>
          <Input id="aso_vencimento" name="data_vencimento" type="date" />
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Salvando..." : "Registrar"}
        </Button>
      </div>
    </form>
  );
}

function FormularioExameComplementar({
  action,
  opcoesExame,
  aoSalvar,
}: {
  action: (
    prevState: SubRecursoState,
    formData: FormData,
  ) => Promise<SubRecursoState>;
  opcoesExame: { id: string; nome: string; periodicidade_meses: number | null }[];
  aoSalvar: () => void;
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
        <Button type="submit" disabled={pending}>
          {pending ? "Salvando..." : "Registrar"}
        </Button>
      </div>
    </form>
  );
}
