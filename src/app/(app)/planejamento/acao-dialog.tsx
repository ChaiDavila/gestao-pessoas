"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { ArrowDown, ArrowUp, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { NativeSelect } from "@/components/native-select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatarData } from "@/lib/date";
import { formatarMoeda } from "@/lib/formatacao";
import {
  STATUS_LABEL,
  progressoChecklist,
  type AcaoPlanejamento,
  type CategoriaPlanejamento,
  type DespesaPlanejamento,
  type StatusAcao,
  type TarefaPlanejamento,
  type TipoAcao,
} from "@/lib/planejamento";
import { salvarAcao, excluirAcao, duplicarAcao, type AcaoFormState } from "./actions";

type TarefaForm = { id?: string; descricao: string; prazo: string; concluida: boolean };
type DespesaForm = { id?: string; data: string; descricao: string; valor: string };

export type EditorEstado =
  | { modo: "fechado" }
  | { modo: "novo"; dataSugerida: string; tipoInicial?: TipoAcao }
  | { modo: "editar"; acaoId: string };

export function AcaoDialog({
  estado,
  onFechar,
  acoes,
  tarefasPorAcao,
  despesasPorAcao,
  categorias,
  podeEditar,
}: {
  estado: EditorEstado;
  onFechar: () => void;
  acoes: AcaoPlanejamento[];
  tarefasPorAcao: Map<string, TarefaPlanejamento[]>;
  despesasPorAcao: Map<string, DespesaPlanejamento[]>;
  categorias: CategoriaPlanejamento[];
  podeEditar: boolean;
}) {
  const aberto = estado.modo !== "fechado";
  const acao = estado.modo === "editar" ? acoes.find((a) => a.id === estado.acaoId) : undefined;
  // Remonta o formulário a cada abertura (estado limpo, sem rascunho de uma ação anterior).
  const chave = estado.modo === "editar" ? estado.acaoId : estado.modo === "novo" ? `novo-${estado.dataSugerida}` : "x";

  return (
    <Dialog open={aberto} onOpenChange={(o) => !o && onFechar()}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto sm:max-w-3xl">
        {aberto && (
          <FormularioAcao
            key={chave}
            acao={acao}
            dataSugerida={estado.modo === "novo" ? estado.dataSugerida : ""}
            tipoInicial={estado.modo === "novo" ? estado.tipoInicial : undefined}
            tarefasIniciais={acao ? (tarefasPorAcao.get(acao.id) ?? []) : []}
            despesasIniciais={acao ? (despesasPorAcao.get(acao.id) ?? []) : []}
            categorias={categorias}
            podeEditar={podeEditar}
            onFechar={onFechar}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function FormularioAcao({
  acao,
  dataSugerida,
  tipoInicial,
  tarefasIniciais,
  despesasIniciais,
  categorias,
  podeEditar,
  onFechar,
}: {
  acao: AcaoPlanejamento | undefined;
  dataSugerida: string;
  tipoInicial?: TipoAcao;
  tarefasIniciais: TarefaPlanejamento[];
  despesasIniciais: DespesaPlanejamento[];
  categorias: CategoriaPlanejamento[];
  podeEditar: boolean;
  onFechar: () => void;
}) {
  const [state, formAction, pending] = useActionState<AcaoFormState, FormData>(
    salvarAcao.bind(null, acao?.id ?? null),
    undefined,
  );
  const [tipo, setTipo] = useState<TipoAcao>(acao?.tipo ?? tipoInicial ?? "pontual");
  const verba = tipo === "verba";
  const [status, setStatus] = useState<StatusAcao>(acao?.status ?? "planejada");
  const [tarefas, setTarefas] = useState<TarefaForm[]>(
    tarefasIniciais.map((t) => ({ id: t.id, descricao: t.descricao, prazo: t.prazo ?? "", concluida: t.concluida })),
  );
  const [despesas, setDespesas] = useState<DespesaForm[]>(
    despesasIniciais.map((d) => ({ id: d.id, data: d.data, descricao: d.descricao, valor: String(d.valor) })),
  );
  const [erroLocal, setErroLocal] = useState<string | null>(null);
  const [pendingAux, startTransition] = useTransition();
  const [anoDuplicar, setAnoDuplicar] = useState(
    String(Number((acao?.data_inicio ?? dataSugerida).slice(0, 4)) + 1),
  );
  const [msgDuplicar, setMsgDuplicar] = useState<string | null>(null);

  useEffect(() => {
    if (state && "ok" in state) onFechar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  const categoriasOpcoes = categorias.filter((c) => c.ativo || c.id === acao?.categoria_id);
  const progresso = progressoChecklist(
    tarefas.map((t, i) => ({ ...t, id: String(i), acao_id: "", prazo: t.prazo || null, concluida_em: null, ordem: i })),
  );
  const totalDespesas = despesas.reduce((s, d) => s + (Number(d.valor.replace(",", ".")) || 0), 0);

  function moverTarefa(i: number, delta: number) {
    const j = i + delta;
    if (j < 0 || j >= tarefas.length) return;
    const nova = [...tarefas];
    [nova[i], nova[j]] = [nova[j], nova[i]];
    setTarefas(nova);
  }

  const tarefasJson = JSON.stringify(
    tarefas
      .filter((t) => t.descricao.trim() || t.id)
      .map((t) => ({ id: t.id, descricao: t.descricao.trim(), prazo: t.prazo || null, concluida: t.concluida })),
  );
  const despesasJson = JSON.stringify(
    despesas.map((d) => ({
      id: d.id,
      data: d.data,
      descricao: d.descricao.trim(),
      valor: Number(d.valor.replace(",", ".")) || 0,
    })),
  );

  const titulo = verba
    ? !acao
      ? "Nova verba anual"
      : podeEditar
        ? "Editar verba anual"
        : "Detalhes da verba anual"
    : !acao
      ? "Nova ação / atividade"
      : podeEditar
        ? "Editar ação / atividade"
        : "Detalhes da ação";
  const erro = erroLocal ?? (state && "error" in state ? state.error : null);

  return (
    <>
      <DialogHeader>
        <DialogTitle>{titulo}</DialogTitle>
      </DialogHeader>

      <form id="form-acao-planejamento" action={formAction} className="space-y-5">
        <input type="hidden" name="tarefas" value={tarefasJson} />
        <input type="hidden" name="despesas" value={despesasJson} />

        {erro && <p className="rounded-md bg-danger-bg px-3 py-2 text-sm text-danger">{erro}</p>}

        <fieldset disabled={!podeEditar} className="space-y-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="titulo">Nome da ação *</Label>
              <Input id="titulo" name="titulo" required maxLength={150} defaultValue={acao?.titulo ?? ""} placeholder="Ex.: Semana da SIPAT" />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea id="descricao" name="descricao" rows={2} defaultValue={acao?.descricao ?? ""} placeholder="Objetivo, público, informações importantes" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="categoria_id">Categoria *</Label>
              <NativeSelect id="categoria_id" name="categoria_id" required defaultValue={acao?.categoria_id ?? ""}>
                <option value="" disabled>
                  Selecione
                </option>
                {categoriasOpcoes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome}
                  </option>
                ))}
              </NativeSelect>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tipo">Tipo de registro *</Label>
              <NativeSelect id="tipo" name="tipo" value={tipo} onChange={(e) => setTipo(e.target.value as TipoAcao)}>
                <option value="pontual">Ação pontual</option>
                <option value="periodo">Atividade com período de execução</option>
                <option value="verba">Verba anual (só orçamento, sem data)</option>
              </NativeSelect>
            </div>
            {verba ? (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="ano">Ano *</Label>
                  <Input
                    id="ano"
                    name="ano"
                    type="number"
                    min="2000"
                    max="2100"
                    required
                    defaultValue={(acao?.data_inicio ?? dataSugerida).slice(0, 4)}
                  />
                </div>
                <p className="self-end pb-1 text-xs text-muted-foreground sm:col-span-1">
                  Aparece só na aba Orçamentos. Lance cada compra como despesa, com a data em que foi feita.
                </p>
              </>
            ) : (
            <div className="space-y-1.5">
              <Label htmlFor="data_inicio">{tipo === "periodo" ? "Data de início *" : "Data da ação *"}</Label>
              <Input id="data_inicio" name="data_inicio" type="date" required defaultValue={acao?.data_inicio ?? dataSugerida} />
            </div>
            )}
            {verba ? null : tipo === "periodo" ? (
              <div className="space-y-1.5">
                <Label htmlFor="data_fim">Data de término prevista *</Label>
                <Input id="data_fim" name="data_fim" type="date" required defaultValue={acao?.data_fim ?? ""} />
              </div>
            ) : (
              <div className="hidden sm:block" />
            )}
            {!verba && (
            <div className="space-y-1.5">
              <Label htmlFor="status">Status</Label>
              <NativeSelect id="status" name="status" value={status} onChange={(e) => setStatus(e.target.value as StatusAcao)}>
                {(Object.keys(STATUS_LABEL) as StatusAcao[]).map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABEL[s]}
                  </option>
                ))}
              </NativeSelect>
              {status === "concluida" && (
                <p className="text-xs text-muted-foreground">
                  {acao?.status === "concluida" && acao.data_conclusao
                    ? `Concluída em ${formatarData(acao.data_conclusao)}.`
                    : "A data de conclusão será registrada como hoje ao salvar."}
                </p>
              )}
            </div>
            )}
          </div>

          {/* Checklist (verba anual não tem) */}
          <section className={`space-y-2 border-t border-border pt-4 ${verba ? "hidden" : ""}`}>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">Checklist e prazos</h3>
              {progresso.total > 0 && (
                <span className="text-xs text-muted-foreground">
                  {progresso.concluidas} de {progresso.total} tarefas concluídas ({progresso.percentual}%)
                </span>
              )}
            </div>
            {tarefas.length === 0 && <p className="text-xs text-muted-foreground">Nenhuma tarefa cadastrada.</p>}
            {tarefas.map((t, i) => (
              <div key={t.id ?? `nova-${i}`} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  className="h-4 w-4 shrink-0 accent-[var(--primary)]"
                  checked={t.concluida}
                  title="Concluída"
                  onChange={(e) => setTarefas(tarefas.map((x, k) => (k === i ? { ...x, concluida: e.target.checked } : x)))}
                />
                <Input
                  value={t.descricao}
                  maxLength={200}
                  placeholder="O que precisa ser feito?"
                  className={`flex-1 ${t.concluida ? "text-muted-foreground line-through" : ""}`}
                  onChange={(e) => setTarefas(tarefas.map((x, k) => (k === i ? { ...x, descricao: e.target.value } : x)))}
                />
                <Input
                  type="date"
                  value={t.prazo}
                  title="Prazo (opcional)"
                  className="w-40"
                  onChange={(e) => setTarefas(tarefas.map((x, k) => (k === i ? { ...x, prazo: e.target.value } : x)))}
                />
                {podeEditar && (
                  <div className="flex shrink-0">
                    <Button type="button" variant="ghost" size="icon-sm" title="Subir" disabled={i === 0} onClick={() => moverTarefa(i, -1)}>
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button type="button" variant="ghost" size="icon-sm" title="Descer" disabled={i === tarefas.length - 1} onClick={() => moverTarefa(i, 1)}>
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                    <Button type="button" variant="ghost" size="icon-sm" title="Remover tarefa" onClick={() => setTarefas(tarefas.filter((_, k) => k !== i))}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            ))}
            {podeEditar && (
              <Button type="button" variant="ghost" size="sm" onClick={() => setTarefas([...tarefas, { descricao: "", prazo: "", concluida: false }])}>
                + Adicionar tarefa
              </Button>
            )}
          </section>

          {/* Orçamento */}
          <section className="space-y-3 border-t border-border pt-4">
            <h3 className="text-sm font-semibold text-foreground">Orçamento</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="orcamento_previsto">Valor previsto (R$)</Label>
                <Input
                  id="orcamento_previsto"
                  name="orcamento_previsto"
                  type="number"
                  min="0"
                  step="0.01"
                  defaultValue={acao?.orcamento_previsto ?? ""}
                  placeholder="Não informado"
                />
                <p className="text-xs text-muted-foreground">Deixe em branco se não houver orçamento definido.</p>
              </div>
              <div className="space-y-1.5">
                <Label>Valor realizado</Label>
                <p className="flex h-8 items-center text-sm font-semibold text-foreground">
                  {formatarMoeda(totalDespesas)}
                </p>
                <p className="text-xs text-muted-foreground">Soma das despesas lançadas abaixo.</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Despesas realizadas</Label>
              {despesas.length === 0 && <p className="text-xs text-muted-foreground">Nenhuma despesa lançada.</p>}
              {despesas.map((d, i) => (
                <div key={d.id ?? `nova-${i}`} className="flex items-center gap-2">
                  <Input
                    type="date"
                    value={d.data}
                    required
                    className="w-40"
                    onChange={(e) => setDespesas(despesas.map((x, k) => (k === i ? { ...x, data: e.target.value } : x)))}
                  />
                  <Input
                    value={d.descricao}
                    required
                    maxLength={200}
                    placeholder="Descrição (fornecedor, item...)"
                    className="flex-1"
                    onChange={(e) => setDespesas(despesas.map((x, k) => (k === i ? { ...x, descricao: e.target.value } : x)))}
                  />
                  <Input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={d.valor}
                    required
                    placeholder="Valor"
                    className="w-32"
                    onChange={(e) => setDespesas(despesas.map((x, k) => (k === i ? { ...x, valor: e.target.value } : x)))}
                  />
                  {podeEditar && (
                    <Button type="button" variant="ghost" size="icon-sm" title="Remover despesa" onClick={() => setDespesas(despesas.filter((_, k) => k !== i))}>
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              {podeEditar && (
                <Button type="button" variant="ghost" size="sm" onClick={() => setDespesas([...despesas, { data: "", descricao: "", valor: "" }])}>
                  + Adicionar despesa
                </Button>
              )}
            </div>
          </section>

          <section className="space-y-1.5 border-t border-border pt-4">
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea id="observacoes" name="observacoes" rows={2} defaultValue={acao?.observacoes ?? ""} placeholder="Fornecedor, condições, justificativas" />
          </section>
        </fieldset>
      </form>

      {acao && podeEditar && (
        <section className="flex flex-wrap items-center gap-2 border-t border-border pt-4 text-sm">
          <span className="text-muted-foreground">Duplicar para o ano</span>
          <Input type="number" min="2000" max="2100" value={anoDuplicar} onChange={(e) => setAnoDuplicar(e.target.value)} className="w-24" />
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={pendingAux}
            onClick={() =>
              startTransition(async () => {
                setMsgDuplicar(null);
                const r = await duplicarAcao(acao.id, Number(anoDuplicar));
                if ("error" in r) setErroLocal(r.error);
                else setMsgDuplicar(`Cópia criada em ${anoDuplicar} (com o checklist, sem as despesas).`);
              })
            }
          >
            Duplicar
          </Button>
          {msgDuplicar && <span className="text-xs text-success">{msgDuplicar}</span>}
        </section>
      )}

      <DialogFooter className="sm:justify-between">
        {acao && podeEditar ? (
          <Button
            type="button"
            variant="ghost"
            className="text-danger hover:text-danger"
            disabled={pendingAux}
            onClick={() => {
              if (!window.confirm(`Excluir "${acao.titulo}"? A ação e o checklist deixam de aparecer em todas as visões.`)) return;
              startTransition(async () => {
                try {
                  await excluirAcao(acao.id);
                  onFechar();
                } catch (e) {
                  setErroLocal((e as Error).message);
                }
              });
            }}
          >
            Excluir ação
          </Button>
        ) : (
          <span />
        )}
        <div className="flex flex-col-reverse gap-2 sm:flex-row">
          <Button type="button" variant="ghost" onClick={onFechar}>
            {podeEditar ? "Cancelar" : "Fechar"}
          </Button>
          {podeEditar && (
            <Button type="submit" form="form-acao-planejamento" disabled={pending}>
              {pending ? "Salvando..." : "Salvar"}
            </Button>
          )}
        </div>
      </DialogFooter>
    </>
  );
}
