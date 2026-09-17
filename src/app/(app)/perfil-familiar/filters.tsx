"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useTransition } from "react";
import { NativeSelect } from "@/components/native-select";
import { Checkbox } from "@/components/ui/checkbox";
import { STATUS_RH, STATUS_RH_LABEL, ESTADOS_CIVIS } from "@/lib/constants/rh";

export function PerfilFamiliarFilters({
  setores,
  gestores,
}: {
  setores: { id: string; nome: string }[];
  gestores: { id: string; nome: string }[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  function atualizarFiltro(chave: string, valor: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (valor) params.set(chave, valor);
    else params.delete(chave);
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  }

  return (
    <div className="flex flex-wrap items-end gap-3">
      <Selecao
        label="Setor"
        paramKey="setor"
        searchParams={searchParams}
        onChange={atualizarFiltro}
        options={setores}
      />
      <Selecao
        label="Gestor"
        paramKey="gestor"
        searchParams={searchParams}
        onChange={atualizarFiltro}
        options={gestores}
      />
      <div className="w-44 space-y-1">
        <label className="text-xs font-medium text-muted-foreground">Status</label>
        <NativeSelect
          value={searchParams.get("status") ?? ""}
          onChange={(e) => atualizarFiltro("status", e.target.value)}
        >
          <option value="">Todos</option>
          {STATUS_RH.map((s) => (
            <option key={s} value={s}>
              {STATUS_RH_LABEL[s]}
            </option>
          ))}
        </NativeSelect>
      </div>
      <div className="w-52 space-y-1">
        <label className="text-xs font-medium text-muted-foreground">
          Estado civil
        </label>
        <NativeSelect
          value={searchParams.get("estadoCivil") ?? ""}
          onChange={(e) => atualizarFiltro("estadoCivil", e.target.value)}
        >
          <option value="">Todos</option>
          {ESTADOS_CIVIS.map((e) => (
            <option key={e} value={e}>
              {e}
            </option>
          ))}
        </NativeSelect>
      </div>
      <label className="flex items-center gap-2 pb-1.5 text-sm">
        <Checkbox
          checked={searchParams.get("comFilhos") === "1"}
          onCheckedChange={(v) => atualizarFiltro("comFilhos", v ? "1" : "")}
        />
        Somente com filhos
      </label>
    </div>
  );
}

function Selecao({
  label,
  paramKey,
  searchParams,
  onChange,
  options,
}: {
  label: string;
  paramKey: string;
  searchParams: URLSearchParams;
  onChange: (chave: string, valor: string) => void;
  options: { id: string; nome: string }[];
}) {
  return (
    <div className="w-48 space-y-1">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      <NativeSelect
        value={searchParams.get(paramKey) ?? ""}
        onChange={(e) => onChange(paramKey, e.target.value)}
      >
        <option value="">Todos</option>
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.nome}
          </option>
        ))}
      </NativeSelect>
    </div>
  );
}
