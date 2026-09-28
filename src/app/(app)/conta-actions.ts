"use server";

import { createClient } from "@/lib/supabase/server";
import { novaSenhaSchema } from "@/lib/validations/auth";

export type AlterarMinhaSenhaState = { error: string } | { ok: true } | undefined;

// Qualquer usuário logado pode trocar a própria senha a qualquer momento — não exige a
// senha atual porque updateUser() já usa a sessão ativa (a pessoa já provou quem é ao
// entrar); coerente com o mesmo padrão usado em /redefinir-senha.
export async function alterarMinhaSenha(
  _prevState: AlterarMinhaSenhaState,
  formData: FormData,
): Promise<AlterarMinhaSenhaState> {
  const parsed = novaSenhaSchema.safeParse({
    senha: formData.get("senha"),
    confirmarSenha: formData.get("confirmarSenha"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.senha });
  if (error) {
    return { error: "Não foi possível salvar a nova senha. Tente novamente." };
  }

  return { ok: true };
}
