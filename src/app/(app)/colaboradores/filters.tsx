"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/native-select";
import { MultiSelect } from "@/components/multi-select";
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

  function atualizarFiltroMultiplo(chave: string, valores: string[]) {
    const params = new URLSearchParams(searchParams.toString());
    params.delete(chave);
    for (const v of valores) params.append(chave, v);
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

      <FiltroMultiSelect
        label="Função"
        paramKey="cargo"
        searchParams={searchParams}
        onChange={atualizarFiltroMultiplo}
        options={opcoes.cargos}
      />
      <FiltroMultiSelect
        label="Nível"
        paramKey="nivel"
        searchParams={searchParams}
        onChange={atualizarFiltroMultiplo}
        options={opcoes.niveis}
      />
      <FiltroMultiSelect
        label="Eixo"
        paramKey="eixo"
        searchParams={searchParams}
        onChange={atualizarFiltroMultiplo}
        options={opcoes.eixos}
      />
      <FiltroMultiSelect
        label="Setor"
        paramKey="setor"
        searchParams={searchParams}
        onChange={atualizarFiltroMultiplo}
        options={opcoes.setores}
      />
      <FiltroMultiSelect
        label="Gestor"
        paramKey="gestor"
        searchParams={searchParams}
        onChange={atualizarFiltroMultiplo}
        options={opcoes.gestoresComEquipe}
      />

      <div className="w-40 space-y-1">
        <label className="text-xs font-medium text-muted-foreground">
          Status
        </label>
        <NativeSelect
          value={searchParams.get("status") ?? "ativo"}
          onChange={(e) => atualizarFiltro("status", e.target.value)}
        >
          <option value="todos">Todos</option>
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

function FiltroMultiSelect({
  label,
  paramKey,
  searchParams,
  onChange,
  options,
}: {
  label: string;
  paramKey: string;
  searchParams: URLSearchParams;
  onChange: (chave: string, valores: string[]) => void;
  options: { id: string; nome: string }[];
}) {
  return (
    <div className="w-48 space-y-1">
      <label className="text-xs font-medium text-muted-foreground">
        {label}
      </label>
      <MultiSelect
        opcoes={options.map((o) => ({ value: o.id, label: o.nome }))}
        selecionados={searchParams.getAll(paramKey)}
        onChange={(valores) => onChange(paramKey, valores)}
      />
    </div>
  );
}
