"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { NativeSelect } from "@/components/native-select";
import type { DesligamentoState } from "../actions";

type Motivo = { id: string; motivo: string; tipo_padrao: string };

type DesligamentoPanelProps = {
  statusRh: string;
  desativarAction: (
    prevState: DesligamentoState,
    formData: FormData,
  ) => Promise<DesligamentoState>;
  reativarAction: () => Promise<void>;
  motivos: Motivo[];
};

export function DesligamentoPanel({
  statusRh,
  desativarAction,
  reativarAction,
  motivos,
}: DesligamentoPanelProps) {
  const [aberto, setAberto] = useState(false);
  const [state, formAction, pending] = useActionState(
    desativarAction,
    undefined,
  );

  if (statusRh === "desligado") {
    return (
      <form action={reativarAction}>
        <Button type="submit" variant="outline">
          Reativar colaborador
        </Button>
      </form>
    );
  }

  if (!aberto) {
    return (
      <Button variant="outline" onClick={() => setAberto(true)}>
        Desativar
      </Button>
    );
  }

  return (
    <form
      action={formAction}
      className="w-full max-w-lg space-y-4 rounded-lg border border-border bg-card p-4"
    >
      <h3 className="text-sm font-semibold text-foreground">
        Desligar colaborador
      </h3>
      {state?.error && (
        <p className="rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">
          {state.error}
        </p>
      )}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="data">Data</Label>
          <Input id="data" name="data" type="date" required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="tipo">Tipo</Label>
          <NativeSelect id="tipo" name="tipo" required defaultValue="">
            <option value="" disabled>
              Selecione...
            </option>
            <option value="voluntario">Voluntário</option>
            <option value="involuntario">Involuntário</option>
          </NativeSelect>
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="motivo_id">Motivo</Label>
        <NativeSelect id="motivo_id" name="motivo_id" defaultValue="">
          <option value="">Nenhum</option>
          {motivos.map((m) => (
            <option key={m.id} value={m.id}>
              {m.motivo}
            </option>
          ))}
        </NativeSelect>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="descricao">Descrição</Label>
        <Textarea id="descricao" name="descricao" rows={3} />
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={() => setAberto(false)}>
          Cancelar
        </Button>
        <Button type="submit" variant="destructive" disabled={pending}>
          {pending ? "Salvando..." : "Confirmar desligamento"}
        </Button>
      </div>
    </form>
  );
}
