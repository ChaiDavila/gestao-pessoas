"use client";

import { useActionState, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { NativeSelect } from "@/components/native-select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { DesligamentoState } from "../actions";

type Motivo = { id: string; motivo: string; tipo_padrao: string };

export function DesligamentoDialog({
  desativarAction,
  motivos,
  variant = "outline",
  rotulo = "Desativar",
}: {
  desativarAction: (
    prevState: DesligamentoState,
    formData: FormData,
  ) => Promise<DesligamentoState>;
  motivos: Motivo[];
  variant?: "outline" | "destructive";
  rotulo?: string;
}) {
  const [aberto, setAberto] = useState(false);
  const [state, formAction, pending] = useActionState(
    desativarAction,
    undefined,
  );

  useEffect(() => {
    if (state && "ok" in state) setAberto(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <>
      <Button variant={variant} size="sm" onClick={() => setAberto(true)}>
        {rotulo}
      </Button>
      <Dialog open={aberto} onOpenChange={setAberto}>
        <DialogContent className="max-w-md sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Desligar colaborador</DialogTitle>
          </DialogHeader>
          <form id="form-desligamento" action={formAction} className="space-y-4">
            {state && "error" in state && (
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
          </form>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setAberto(false)}>
              Cancelar
            </Button>
            <Button
              type="submit"
              form="form-desligamento"
              variant="destructive"
              disabled={pending}
            >
              {pending ? "Salvando..." : "Confirmar desligamento"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
