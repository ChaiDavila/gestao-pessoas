"use client";

import { Suspense, useActionState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { solicitarRecuperacaoSenha, type EsqueciSenhaState } from "../login/actions";

const initialState: EsqueciSenhaState = undefined;

export default function EsqueciSenhaPage() {
  return (
    <Suspense>
      <EsqueciSenhaForm />
    </Suspense>
  );
}

function EsqueciSenhaForm() {
  const searchParams = useSearchParams();
  const linkInvalido = searchParams.get("erro") === "link_invalido";
  const [state, formAction, pending] = useActionState(
    solicitarRecuperacaoSenha,
    initialState,
  );

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
          Esqueci minha senha
        </h1>
        <p className="mt-1 text-center text-sm text-muted-foreground">
          Informe o e-mail cadastrado que enviamos um link pra você criar uma
          senha nova.
        </p>

        {linkInvalido && !state && (
          <p className="mt-4 rounded-md bg-warning-bg px-3 py-2 text-sm text-warning">
            Esse link de recuperação não é mais válido — links expiram depois
            de um tempo ou de um único uso. Solicite um novo abaixo.
          </p>
        )}

        {state && "ok" in state ? (
          <div className="mt-6 space-y-4">
            <p className="rounded-md bg-success-bg px-3 py-2 text-sm text-success">
              Se esse e-mail estiver cadastrado, você vai receber um link
              pra redefinir a senha em instantes. Confira também a caixa de
              spam.
            </p>
            <Link
              href="/login"
              className="block text-center text-sm text-primary hover:underline"
            >
              Voltar para o login
            </Link>
          </div>
        ) : (
          <form action={formAction} className="mt-6 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
              />
            </div>
            {state?.error && (
              <p className="text-sm text-danger">{state.error}</p>
            )}
            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? "Enviando..." : "Enviar link de recuperação"}
            </Button>
            <Link
              href="/login"
              className="block text-center text-sm text-muted-foreground hover:text-foreground"
            >
              Voltar para o login
            </Link>
          </form>
        )}
      </div>
    </div>
  );
}
