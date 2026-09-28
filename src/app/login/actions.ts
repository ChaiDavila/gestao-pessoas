"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { loginSchema, esqueciSenhaSchema } from "@/lib/validations/auth";

export type LoginState = { error: string } | undefined;

export async function login(
  _prevState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    return { error: "E-mail ou senha incorretos." };
  }

  redirect("/dashboard");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export type EsqueciSenhaState = { error: string } | { ok: true } | undefined;

async function origemAtual() {
  const h = await headers();
  const host = h.get("host") ?? "localhost:3000";
  const protocolo = host.startsWith("localhost") ? "http" : "https";
  return `${protocolo}://${host}`;
}

export async function solicitarRecuperacaoSenha(
  _prevState: EsqueciSenhaState,
  formData: FormData,
): Promise<EsqueciSenhaState> {
  const parsed = esqueciSenhaSchema.safeParse({
    email: formData.get("email"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const origem = await origemAtual();
  // Erro real (ex.: SMTP fora do ar) não é exposto — a mensagem de sucesso é sempre a
  // mesma, exista ou não aquele e-mail cadastrado, pra não revelar quais e-mails têm conta.
  await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${origem}/auth/confirmar-recuperacao`,
  });

  return { ok: true };
}
