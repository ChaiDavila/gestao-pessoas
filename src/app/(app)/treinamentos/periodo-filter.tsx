"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/native-select";

export function PeriodoFilter() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const modo = searchParams.get("periodo") ?? "atual";
  const [de, setDe] = useState(searchParams.get("periodoDe") ?? "");
  const [ate, setAte] = useState(searchParams.get("periodoAte") ?? "");

  function navegar(params: URLSearchParams) {
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  }

  function aplicarData(chave: string, valor: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (valor) params.set(chave, valor);
    else params.delete(chave);
    navegar(params);
  }

  function aoTrocarModo(novoModo: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("periodo", novoModo);
    if (novoModo !== "personalizado") {
      params.delete("periodoDe");
      params.delete("periodoAte");
      setDe("");
      setAte("");
    }
    navegar(params);
  }

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="w-48 space-y-1">
        <label className="text-xs font-medium text-muted-foreground">Período</label>
        <NativeSelect value={modo} onChange={(e) => aoTrocarModo(e.target.value)}>
          <option value="atual">Ano atual</option>
          <option value="anterior">Ano anterior</option>
          <option value="todo">Todo o período</option>
          <option value="personalizado">Personalizado</option>
        </NativeSelect>
      </div>
      {modo === "personalizado" && (
        <>
          <div className="w-40 space-y-1">
            <label className="text-xs font-medium text-muted-foreground">De</label>
            <Input
              type="date"
              value={de}
              onChange={(e) => setDe(e.target.value)}
              onBlur={() => aplicarData("periodoDe", de)}
            />
          </div>
          <div className="w-40 space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Até</label>
            <Input
              type="date"
              value={ate}
              onChange={(e) => setAte(e.target.value)}
              onBlur={() => aplicarData("periodoAte", ate)}
            />
          </div>
        </>
      )}
    </div>
  );
}
