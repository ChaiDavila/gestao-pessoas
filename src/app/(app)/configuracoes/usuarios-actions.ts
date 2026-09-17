"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUsuarioAtual, type PapelRh } from "@/lib/auth";

export type UsuarioFormState = { error: string } | { ok: true } | undefined;

export type UsuarioArea = {
  usuarioId: string;
  email: string;
  papel: PapelRh;
  criadoEm: string;
};

async function exigirAdmin() {
  const atual = await getUsuarioAtual();
  if (!atual || atual.papel !== "admin") {
    throw new Error("Só administradores podem gerenciar usuários.");
  }
  return atual;
}

export async function listarUsuarios(): Promise<UsuarioArea[]> {
  await exigirAdmin();

  const supabase = await createClient();
  const { data: vinculos, error } = await supabase
    .schema("core")
    .from("usuarios_areas")
    .select("usuario_id, papel, criado_em")
    .eq("area", "rh")
    .order("criado_em");

  if (error) throw new Error(error.message);
  if (!vinculos || vinculos.length === 0) return [];

  const admin = createAdminClient();
  const emails = new Map<string, string>();
  // listUsers pagina de 50 em 50; para uma equipe pequena isso cobre o caso de uso atual.
  const { data: pagina, error: authError } = await admin.auth.admin.listUsers({ perPage: 200 });
  if (authError) throw new Error(authError.message);
  for (const u of pagina.users) {
    emails.set(u.id, u.email ?? "—");
  }

  return vinculos.map((v) => ({
    usuarioId: v.usuario_id,
    email: emails.get(v.usuario_id) ?? "—",
    papel: v.papel as PapelRh,
    criadoEm: v.criado_em,
  }));
}

export async function criarUsuario(
  _prevState: UsuarioFormState,
  formData: FormData,
): Promise<UsuarioFormState> {
  try {
    await exigirAdmin();
  } catch (e) {
    return { error: (e as Error).message };
  }

  const email = formData.get("email") as string;
  const senha = formData.get("senha") as string;
  const papel = formData.get("papel") as string;

  if (!email || !senha || !papel) {
    return { error: "Informe e-mail, senha e papel." };
  }
  if (senha.length < 6) {
    return { error: "A senha deve ter pelo menos 6 caracteres." };
  }

  const admin = createAdminClient();
  const { data: usuarioCriado, error: authError } = await admin.auth.admin.createUser({
    email,
    password: senha,
    email_confirm: true,
  });

  if (authError || !usuarioCriado.user) {
    return { error: authError?.message ?? "Erro ao criar usuário." };
  }

  const supabase = await createClient();
  const { error: vinculoError } = await supabase.schema("core").from("usuarios_areas").insert({
    usuario_id: usuarioCriado.user.id,
    area: "rh",
    papel,
  });

  if (vinculoError) {
    await admin.auth.admin.deleteUser(usuarioCriado.user.id);
    return { error: vinculoError.message };
  }

  revalidatePath("/configuracoes");
  return { ok: true };
}

export async function atualizarPapelUsuario(
  usuarioId: string,
  novoPapel: string,
) {
  await exigirAdmin();

  const supabase = await createClient();
  const { error } = await supabase
    .schema("core")
    .from("usuarios_areas")
    .update({ papel: novoPapel })
    .eq("usuario_id", usuarioId)
    .eq("area", "rh");

  if (error) throw new Error(error.message);
  revalidatePath("/configuracoes");
}

// Remove só o vínculo com a área RH (revoga o acesso ao sistema); a conta em si no
// Supabase Auth continua existindo, já que pode ser reaproveitada por outra área no
// futuro (Portal Central).
export async function removerAcessoUsuario(usuarioId: string) {
  await exigirAdmin();

  const supabase = await createClient();
  const { error } = await supabase
    .schema("core")
    .from("usuarios_areas")
    .delete()
    .eq("usuario_id", usuarioId)
    .eq("area", "rh");

  if (error) throw new Error(error.message);
  revalidatePath("/configuracoes");
}
