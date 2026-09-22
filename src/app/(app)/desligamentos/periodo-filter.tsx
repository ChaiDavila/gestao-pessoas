"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useTransition } from "react";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/native-select";

export function PeriodoFilter() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const modo = searchParams.get("periodo") ?? "atual";

  function atualizar(chave: string, valor: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (valor) params.set(chave, valor);
    else params.delete(chave);
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  }

  function aoTrocarModo(novoModo: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("periodo", novoModo);
    if (novoModo !== "personalizado") {
      params.delete("periodoDe");
      params.delete("periodoAte");
    }
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  }

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="w-48 space-y-1">
        <label className="text-xs font-medium text-muted-foreground">Período</label>
        <NativeSelect value={modo} onChange={(e) => aoTrocarModo(e.target.value)}>
          <option value="atual">Ano atual</option>
          <option value="anterior">Ano anterior</option>
          <option value="personalizado">Personalizado</option>
        </NativeSelect>
      </div>
      {modo === "personalizado" && (
        <>
          <div className="w-40 space-y-1">
            <label className="text-xs font-medium text-muted-foreground">De</label>
            <Input
              type="date"
              value={searchParams.get("periodoDe") ?? ""}
              onChange={(e) => atualizar("periodoDe", e.target.value)}
            />
          </div>
          <div className="w-40 space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Até</label>
            <Input
              type="date"
              value={searchParams.get("periodoAte") ?? ""}
              onChange={(e) => atualizar("periodoAte", e.target.value)}
            />
          </div>
        </>
      )}
    </div>
  );
}
