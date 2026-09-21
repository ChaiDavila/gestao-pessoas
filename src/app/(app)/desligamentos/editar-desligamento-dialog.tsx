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
import { atualizarDesligamento } from "./actions";

type Motivo = { id: string; motivo: string; tipo_padrao: string };

export function EditarDesligamentoDialog({
  desligamentoId,
  valoresIniciais,
  motivos,
}: {
  desligamentoId: string;
  valoresIniciais: {
    data: string;
    tipo: string;
    motivo_id: string | null;
    descricao: string | null;
  };
  motivos: Motivo[];
}) {
  const [aberto, setAberto] = useState(false);
  const [state, formAction, pending] = useActionState(
    atualizarDesligamento.bind(null, desligamentoId),
    undefined,
  );

  useEffect(() => {
    if (state && "ok" in state) setAberto(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <>
      <Button type="button" variant="ghost" size="sm" onClick={() => setAberto(true)}>
        Editar
      </Button>
      <Dialog open={aberto} onOpenChange={setAberto}>
        <DialogContent className="max-w-md sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar desligamento</DialogTitle>
          </DialogHeader>
          <form id={`form-editar-desligamento-${desligamentoId}`} action={formAction} className="space-y-4">
            {state && "error" in state && (
              <p className="rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">
                {state.error}
              </p>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor={`data-${desligamentoId}`}>Data</Label>
                <Input
                  id={`data-${desligamentoId}`}
                  name="data"
                  type="date"
                  required
                  defaultValue={valoresIniciais.data}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={`tipo-${desligamentoId}`}>Tipo</Label>
                <NativeSelect
                  id={`tipo-${desligamentoId}`}
                  name="tipo"
                  required
                  defaultValue={valoresIniciais.tipo}
                >
                  <option value="voluntario">Voluntário</option>
                  <option value="involuntario">Involuntário</option>
                </NativeSelect>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`motivo_id-${desligamentoId}`}>Motivo</Label>
              <NativeSelect
                id={`motivo_id-${desligamentoId}`}
                name="motivo_id"
                defaultValue={valoresIniciais.motivo_id ?? ""}
              >
                <option value="">Nenhum</option>
                {motivos.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.motivo}
                  </option>
                ))}
              </NativeSelect>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`descricao-${desligamentoId}`}>Descrição</Label>
              <Textarea
                id={`descricao-${desligamentoId}`}
                name="descricao"
                rows={3}
                defaultValue={valoresIniciais.descricao ?? ""}
              />
            </div>
          </form>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setAberto(false)}>
              Cancelar
            </Button>
            <Button
              type="submit"
              form={`form-editar-desligamento-${desligamentoId}`}
              disabled={pending}
            >
              {pending ? "Salvando..." : "Salvar alterações"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
