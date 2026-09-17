"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/native-select";
import type { OpcoesFormulario } from "@/lib/data/colaboradores";
import { STATUS_RH, STATUS_RH_LABEL } from "@/lib/constants/rh";

type ColaboradoresFiltersProps = {
  opcoes: OpcoesFormulario;
};

export function ColaboradoresFilters({ opcoes }: ColaboradoresFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [busca, setBusca] = useState(searchParams.get("busca") ?? "");
  const [, startTransition] = useTransition();

  function atualizarFiltro(chave: string, valor: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (valor) {
      params.set(chave, valor);
    } else {
      params.delete(chave);
    }
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  }

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="w-56 space-y-1">
        <label className="text-xs font-medium text-muted-foreground">
          Buscar por nome ou matrícula
        </label>
        <Input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") atualizarFiltro("busca", busca);
          }}
          onBlur={() => atualizarFiltro("busca", busca)}
          placeholder="Ex.: Maria, 0032..."
        />
      </div>

      <FiltroSelect
        label="Função"
        paramKey="cargo"
        searchParams={searchParams}
        onChange={atualizarFiltro}
        options={opcoes.cargos}
      />
      <FiltroSelect
        label="Nível"
        paramKey="nivel"
        searchParams={searchParams}
        onChange={atualizarFiltro}
        options={opcoes.niveis}
      />
      <FiltroSelect
        label="Eixo"
        paramKey="eixo"
        searchParams={searchParams}
        onChange={atualizarFiltro}
        options={opcoes.eixos}
      />
      <FiltroSelect
        label="Setor"
        paramKey="setor"
        searchParams={searchParams}
        onChange={atualizarFiltro}
        options={opcoes.setores}
      />
      <FiltroSelect
        label="Gestor"
        paramKey="gestor"
        searchParams={searchParams}
        onChange={atualizarFiltro}
        options={opcoes.gestores}
      />

      <div className="w-40 space-y-1">
        <label className="text-xs font-medium text-muted-foreground">
          Status
        </label>
        <NativeSelect
          value={searchParams.get("status") ?? ""}
          onChange={(e) => atualizarFiltro("status", e.target.value)}
        >
          <option value="">Todos</option>
          {STATUS_RH.map((status) => (
            <option key={status} value={status}>
              {STATUS_RH_LABEL[status]}
            </option>
          ))}
        </NativeSelect>
      </div>
    </div>
  );
}

function FiltroSelect({
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
      <label className="text-xs font-medium text-muted-foreground">
        {label}
      </label>
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
