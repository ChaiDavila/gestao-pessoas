"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/native-select";
import { MultiSelect } from "@/components/multi-select";
import type { OpcoesFormulario } from "@/lib/data/colaboradores";
import { STATUS_RH, STATUS_RH_LABEL } from "@/lib/constants/rh";

export function TreinamentosFilters({ opcoes }: { opcoes: OpcoesFormulario }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [busca, setBusca] = useState(searchParams.get("busca") ?? "");
  const [, startTransition] = useTransition();

  function atualizarFiltro(chave: string, valor: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (valor) params.set(chave, valor);
    else params.delete(chave);
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
          Buscar por nome
        </label>
        <Input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") atualizarFiltro("busca", busca);
          }}
          onBlur={() => atualizarFiltro("busca", busca)}
          placeholder="Ex.: Maria..."
        />
      </div>
      <SelecaoMultipla label="Função" paramKey="cargo" searchParams={searchParams} onChange={atualizarFiltroMultiplo} options={opcoes.cargos} />
      <SelecaoMultipla label="Nível" paramKey="nivel" searchParams={searchParams} onChange={atualizarFiltroMultiplo} options={opcoes.niveis} />
      <SelecaoMultipla label="Eixo" paramKey="eixo" searchParams={searchParams} onChange={atualizarFiltroMultiplo} options={opcoes.eixos} />
      <SelecaoMultipla label="Setor" paramKey="setor" searchParams={searchParams} onChange={atualizarFiltroMultiplo} options={opcoes.setores} />
      <SelecaoMultipla label="Gestor" paramKey="gestor" searchParams={searchParams} onChange={atualizarFiltroMultiplo} options={opcoes.gestoresComEquipe} />
      <div className="w-44 space-y-1">
        <label className="text-xs font-medium text-muted-foreground">
          Colaborador
        </label>
        <NativeSelect
          value={searchParams.get("status") ?? "ativo"}
          onChange={(e) => atualizarFiltro("status", e.target.value)}
        >
          <option value="ativo">Colaborador ativo</option>
          <option value="todos">Todos os status</option>
          {STATUS_RH.filter((s) => s !== "ativo").map((s) => (
            <option key={s} value={s}>
              Colaborador {STATUS_RH_LABEL[s].toLowerCase()}
            </option>
          ))}
        </NativeSelect>
      </div>
    </div>
  );
}

function SelecaoMultipla({
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
    <div className="w-44 space-y-1">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      <MultiSelect
        opcoes={options.map((o) => ({ value: o.id, label: o.nome }))}
        selecionados={searchParams.getAll(paramKey)}
        onChange={(valores) => onChange(paramKey, valores)}
      />
    </div>
  );
}
