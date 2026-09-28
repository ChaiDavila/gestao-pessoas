"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// O link de recuperação do Supabase cai aqui — dependendo da configuração do projeto, o
// token vem de duas formas possíveis: como #access_token=... no fragmento da URL (fluxo
// implícito, só o navegador enxerga isso) ou como ?code=... na query string (fluxo PKCE,
// dá pra ler no servidor). Como um Route Handler nunca recebe o fragmento, essa página
// roda no cliente e trata os dois formatos, pra funcionar independente de qual o Supabase
// realmente usar.
export default function ConfirmarRecuperacaoPage() {
  return (
    <Suspense>
      <ConfirmarRecuperacao />
    </Suspense>
  );
}

function ConfirmarRecuperacao() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [erro, setErro] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    async function confirmar() {
      const hash = window.location.hash.startsWith("#")
        ? window.location.hash.slice(1)
        : window.location.hash;
      const hashParams = new URLSearchParams(hash);
      const accessToken = hashParams.get("access_token");
      const refreshToken = hashParams.get("refresh_token");
      const code = searchParams.get("code");

      if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        if (!error) {
          router.replace("/redefinir-senha");
          return;
        }
      } else if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (!error) {
          router.replace("/redefinir-senha");
          return;
        }
      }

      setErro(true);
      router.replace("/esqueci-senha?erro=link_invalido");
    }

    confirmar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <p className="text-sm text-muted-foreground">
        {erro ? "Link inválido, redirecionando..." : "Confirmando seu link..."}
      </p>
    </div>
  );
}
