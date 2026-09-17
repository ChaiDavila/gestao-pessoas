"use client";

import { useActionState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/native-select";
import { PainelAdicionar } from "@/components/painel-adicionar";
import { BotaoRemover } from "@/components/botao-remover";
import { StatusBadge } from "@/components/status-badge";
import type { SubRecursoState } from "./sub-recursos-actions";
import type { FormacaoRow } from "@/lib/data/colaborador-detalhe";

type Formacao = FormacaoRow;

export function FormacaoTab({
  formacoes,
  opcoesNivel,
  adicionarAction,
  removerAction,
}: {
  formacoes: Formacao[];
  opcoesNivel: { id: string; nome: string }[];
  adicionarAction: (
    prevState: SubRecursoState,
    formData: FormData,
  ) => Promise<SubRecursoState>;
  removerAction: (formacaoId: string) => Promise<void>;
}) {
  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-2 font-medium">Nível</th>
              <th className="px-4 py-2 font-medium">Curso</th>
              <th className="px-4 py-2 font-medium">Instituição</th>
              <th className="px-4 py-2 font-medium">Conclusão</th>
              <th className="px-4 py-2 font-medium">Status</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody>
            {formacoes.map((f, i) => (
              <tr key={f.id} className="border-b border-border last:border-0">
                <td className="px-4 py-2">
                  <div className="flex items-center gap-2">
                    {f.config_formacoes?.nome ?? "—"}
                    {i === 0 && <StatusBadge tone="success">Atual</StatusBadge>}
                  </div>
                </td>
                <td className="px-4 py-2 text-muted-foreground">
                  {f.curso ?? "—"}
                </td>
                <td className="px-4 py-2 text-muted-foreground">
                  {f.instituicao ?? "—"}
                </td>
                <td className="px-4 py-2 text-muted-foreground">
                  {f.ano_conclusao ?? "—"}
                </td>
                <td className="px-4 py-2 text-muted-foreground">
                  {f.status}
                </td>
                <td className="px-4 py-2 text-right">
                  <BotaoRemover action={() => removerAction(f.id)} />
                </td>
              </tr>
            ))}
            {formacoes.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">
                  Nenhuma formação cadastrada.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <PainelAdicionar rotulo="+ Adicionar formação">
        {(fechar) => (
          <FormularioFormacao
            action={adicionarAction}
            opcoesNivel={opcoesNivel}
            aoSalvar={fechar}
          />
        )}
      </PainelAdicionar>
    </div>
  );
}

function FormularioFormacao({
  action,
  opcoesNivel,
  aoSalvar,
}: {
  action: (
    prevState: SubRecursoState,
    formData: FormData,
  ) => Promise<SubRecursoState>;
  opcoesNivel: { id: string; nome: string }[];
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
          <Label htmlFor="form_nivel">Nível</Label>
          <NativeSelect id="form_nivel" name="nivel_id" required defaultValue="">
            <option value="" disabled>
              Selecione...
            </option>
            {opcoesNivel.map((o) => (
              <option key={o.id} value={o.id}>
                {o.nome}
              </option>
            ))}
          </NativeSelect>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="form_status">Status</Label>
          <NativeSelect id="form_status" name="status" defaultValue="Concluído">
            <option value="Concluído">Concluído</option>
            <option value="Em andamento">Em andamento</option>
            <option value="Trancado">Trancado</option>
          </NativeSelect>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="form_curso">Curso</Label>
          <Input id="form_curso" name="curso" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="form_instituicao">Instituição</Label>
          <Input id="form_instituicao" name="instituicao" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="form_ano">Ano de conclusão</Label>
          <Input id="form_ano" name="ano_conclusao" type="number" />
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Salvando..." : "Adicionar"}
        </Button>
      </div>
    </form>
  );
}
