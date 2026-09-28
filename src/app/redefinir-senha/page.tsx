"use client";

import { useActionState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { definirNovaSenha, type NovaSenhaState } from "./actions";

const initialState: NovaSenhaState = undefined;

export default function RedefinirSenhaPage() {
  const [state, formAction, pending] = useActionState(definirNovaSenha, initialState);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm rounded-lg border border-border bg-card p-8 shadow-sm">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-md bg-sidebar">
          <Image
            src="/coontrol-logo.png"
            alt="COONTROL"
            width={36}
            height={18}
          />
        </div>
        <h1 className="text-center text-lg font-semibold text-foreground">
          Definir nova senha
        </h1>
        <p className="mt-1 text-center text-sm text-muted-foreground">
          Escolha uma senha nova pra sua conta.
        </p>

        <form action={formAction} className="mt-6 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="senha">Nova senha</Label>
            <Input
              id="senha"
              name="senha"
              type="password"
              autoComplete="new-password"
              minLength={6}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="confirmarSenha">Confirmar nova senha</Label>
            <Input
              id="confirmarSenha"
              name="confirmarSenha"
              type="password"
              autoComplete="new-password"
              minLength={6}
              required
            />
          </div>
          {state?.error && <p className="text-sm text-danger">{state.error}</p>}
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Salvando..." : "Salvar nova senha"}
          </Button>
        </form>
      </div>
    </div>
  );
}
