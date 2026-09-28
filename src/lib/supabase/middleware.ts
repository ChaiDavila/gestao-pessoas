import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Redireciona pro dashboard se a pessoa já estiver logada e tentar acessar de novo.
const PUBLIC_ONLY_PATHS = ["/login", "/esqueci-senha"];
// Acessível independente de já ter sessão ou não — /redefinir-senha precisa disso porque
// o link de recuperação já cria uma sessão (de recuperação) antes de chegar lá; se
// entrasse na regra de PUBLIC_ONLY_PATHS, seria redirecionada pro dashboard antes de
// conseguir trocar a senha.
const ALWAYS_ACCESSIBLE_PATHS = ["/redefinir-senha", "/auth/confirmar-recuperacao"];

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          supabaseResponse = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            supabaseResponse.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isPublicOnly = PUBLIC_ONLY_PATHS.some((path) =>
    request.nextUrl.pathname.startsWith(path),
  );
  const isAlwaysAccessible = ALWAYS_ACCESSIBLE_PATHS.some((path) =>
    request.nextUrl.pathname.startsWith(path),
  );

  if (!user && !isPublicOnly && !isAlwaysAccessible) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (user && isPublicOnly) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
