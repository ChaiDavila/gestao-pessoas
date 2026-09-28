"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { novaSenhaSchema } from "@/lib/validations/auth";

export type NovaSenhaState = { error: string } | undefined;

export async function definirNovaSenha(
  _prevState: NovaSenhaState,
  formData: FormData,
): Promise<NovaSenhaState> {
  const parsed = novaSenhaSchema.safeParse({
    senha: formData.get("senha"),
    confirmarSenha: formData.get("confirmarSenha"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();

  // Só chega aqui com uma sessão válida se veio do link de recuperação (que já trocou o
  // code por sessão em /auth/confirmar-recuperacao) — sem sessão, updateUser falha aqui.
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return {
      error: "Link de recuperação expirado ou inválido. Solicite um novo em \"Esqueci minha senha\".",
    };
  }

  const { error } = await supabase.auth.updateUser({ password: parsed.data.senha });
  if (error) {
    return { error: "Não foi possível salvar a nova senha. Tente novamente." };
  }

  await supabase.auth.signOut();
  redirect("/login?senha_redefinida=1");
}
