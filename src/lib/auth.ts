import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TELAS_ESCOPO, type TelaId } from "@/lib/nav";

export type PapelRh = "leitor" | "operador" | "gestor" | "admin";

export type UsuarioAtual = {
  id: string;
  email: string | null;
  papel: PapelRh | null;
  // Ids de tela que o usuário pode acessar; null = acesso a todas (comportamento
  // padrão, também o único válido para admin — admin nunca é restringido por escopo).
  escopoTelas: TelaId[] | null;
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
    .select("papel, escopo_telas")
    .eq("area", "rh")
    .maybeSingle();

  const papel = (data?.papel as PapelRh | undefined) ?? null;

  return {
    id: user.id,
    email: user.email ?? null,
    papel,
    escopoTelas: papel === "admin" ? null : ((data?.escopo_telas as TelaId[] | null) ?? null),
  };
}

// Configurações não entra no escopo (ver TELAS_ESCOPO) — continua liberada pra
// qualquer papel autenticado (só a aba Usuários é admin-only, checada à parte).
export function podeVerTela(usuario: UsuarioAtual | null, tela: TelaId): boolean {
  if (!usuario || !usuario.papel) return false;
  if (tela === "configuracoes") return true;
  if (!usuario.escopoTelas) return true;
  return usuario.escopoTelas.includes(tela);
}

function primeiraTelaPermitida(usuario: UsuarioAtual): string {
  const item = TELAS_ESCOPO.find((i) => podeVerTela(usuario, i.id));
  return item?.href ?? "/configuracoes";
}

// Guarda de página: chamar no topo de cada page.tsx restringível. Redireciona pro
// login se não autenticado, ou pra primeira tela liberada se o usuário não tem acesso
// a esta. Isso é uma camada de navegação, não a garantia de segurança — quem de fato
// impede leitura/escrita indevida é a RLS via core.tem_papel (papel continua exigido
// em todas as políticas das tabelas rh.*).
export async function exigirAcessoTela(tela: TelaId): Promise<UsuarioAtual> {
  const usuario = await getUsuarioAtual();
  if (!usuario) redirect("/login");
  if (!podeVerTela(usuario, tela)) redirect(primeiraTelaPermitida(usuario));
  return usuario;
}
