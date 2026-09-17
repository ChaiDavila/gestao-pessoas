"use client";

import { useActionState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/native-select";
import { PainelAdicionar } from "@/components/painel-adicionar";
import { BotaoRemover } from "@/components/botao-remover";
import { calcularIdade, formatarData } from "@/lib/date";
import type { SubRecursoState } from "./sub-recursos-actions";

type Dependente = {
  id: string;
  nome: string;
  parentesco: string;
  data_nascimento: string | null;
  sexo: string | null;
};

const LABEL_SEXO: Record<string, string> = { M: "Masculino", F: "Feminino" };

export function DependentesTab({
  dependentes,
  adicionarAction,
  removerAction,
}: {
  dependentes: Dependente[];
  adicionarAction: (
    prevState: SubRecursoState,
    formData: FormData,
  ) => Promise<SubRecursoState>;
  removerAction: (dependenteId: string) => Promise<void>;
}) {
  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border bg-muted/40 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-2 font-medium">Nome</th>
              <th className="px-4 py-2 font-medium">Parentesco</th>
              <th className="px-4 py-2 font-medium">Nascimento</th>
              <th className="px-4 py-2 font-medium">Idade</th>
              <th className="px-4 py-2 font-medium">Sexo</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody>
            {dependentes.map((d) => (
              <tr key={d.id} className="border-b border-border last:border-0">
                <td className="px-4 py-2">{d.nome}</td>
                <td className="px-4 py-2 text-muted-foreground">
                  {d.parentesco}
                </td>
                <td className="px-4 py-2 text-muted-foreground">
                  {formatarData(d.data_nascimento)}
                </td>
                <td className="px-4 py-2 text-muted-foreground">
                  {calcularIdade(d.data_nascimento) ?? "—"}
                </td>
                <td className="px-4 py-2 text-muted-foreground">
                  {d.sexo ? LABEL_SEXO[d.sexo] : "—"}
                </td>
                <td className="px-4 py-2 text-right">
                  <BotaoRemover action={() => removerAction(d.id)} />
                </td>
              </tr>
            ))}
            {dependentes.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">
                  Nenhum dependente cadastrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <PainelAdicionar rotulo="+ Adicionar dependente">
        {(fechar) => (
          <FormularioDependente
            action={adicionarAction}
            aoSalvar={fechar}
          />
        )}
      </PainelAdicionar>
    </div>
  );
}

function FormularioDependente({
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
          <Label htmlFor="dep_nome">Nome</Label>
          <Input id="dep_nome" name="nome" required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="dep_parentesco">Parentesco</Label>
          <NativeSelect id="dep_parentesco" name="parentesco" required defaultValue="">
            <option value="" disabled>
              Selecione...
            </option>
            <option value="Filho">Filho</option>
            <option value="Filha">Filha</option>
            <option value="Enteado">Enteado</option>
            <option value="Enteada">Enteada</option>
            <option value="Outro">Outro</option>
          </NativeSelect>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="dep_nascimento">Data de nascimento</Label>
          <Input id="dep_nascimento" name="data_nascimento" type="date" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="dep_sexo">Sexo</Label>
          <NativeSelect id="dep_sexo" name="sexo" defaultValue="">
            <option value="">Inferir do parentesco</option>
            <option value="M">Masculino</option>
            <option value="F">Feminino</option>
          </NativeSelect>
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
