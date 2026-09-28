"use client";

import { useActionState, useState } from "react";
import { KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  alterarMinhaSenha,
  type AlterarMinhaSenhaState,
} from "@/app/(app)/conta-actions";

export function AlterarSenhaDialog() {
  const [aberto, setAberto] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setAberto(true)}
        className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-sm font-medium text-white/80 transition-colors hover:bg-white/[.07] hover:text-white"
      >
        <KeyRound className="h-4 w-4 shrink-0" />
        Alterar senha
      </button>
      <Dialog open={aberto} onOpenChange={setAberto}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Alterar minha senha</DialogTitle>
          </DialogHeader>
          <FormularioAlterarSenha aoConcluir={() => setAberto(false)} />
        </DialogContent>
      </Dialog>
    </>
  );
}

function FormularioAlterarSenha({ aoConcluir }: { aoConcluir: () => void }) {
  const [state, formAction, pending] = useActionState<AlterarMinhaSenhaState, FormData>(
    alterarMinhaSenha,
    undefined,
  );

  if (state && "ok" in state) {
    return (
      <div className="space-y-3">
        <p className="rounded-md bg-success-bg px-3 py-2 text-sm text-success">
          Senha alterada com sucesso.
        </p>
        <Button type="button" size="sm" onClick={aoConcluir}>
          Fechar
        </Button>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      {state && "error" in state && (
        <p className="rounded-md bg-danger-bg px-3 py-2 text-sm text-danger">
          {state.error}
        </p>
      )}
      <div className="space-y-1.5">
        <Label htmlFor="conta_senha">Nova senha</Label>
        <Input
          id="conta_senha"
          name="senha"
          type="password"
          autoComplete="new-password"
          minLength={6}
          required
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="conta_confirmar">Confirmar nova senha</Label>
        <Input
          id="conta_confirmar"
          name="confirmarSenha"
          type="password"
          autoComplete="new-password"
          minLength={6}
          required
        />
      </div>
      <div className="flex justify-end">
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Salvando..." : "Salvar nova senha"}
        </Button>
      </div>
    </form>
  );
}
