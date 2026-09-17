import { createClient } from "@/lib/supabase/server";

export type PapelRh = "leitor" | "operador" | "gestor" | "admin";

export type UsuarioAtual = {
  id: string;
  email: string | null;
  papel: PapelRh | null;
};

export async function getUsuarioAtual(): Promise<UsuarioAtual | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data } = await supabase
    .schema("core")
    .from("usuarios_areas")
    .select("papel")
    .eq("area", "rh")
    .maybeSingle();

  return {
    id: user.id,
    email: user.email ?? null,
    papel: (data?.papel as PapelRh | undefined) ?? null,
  };
}
