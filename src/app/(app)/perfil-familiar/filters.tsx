"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/native-select";
import { MultiSelect } from "@/components/multi-select";
import { Checkbox } from "@/components/ui/checkbox";
import type { OpcoesFormulario } from "@/lib/data/colaboradores";
import { STATUS_RH, STATUS_RH_LABEL, ESTADOS_CIVIS } from "@/lib/constants/rh";

export function PerfilFamiliarFilters({ opcoes }: { opcoes: OpcoesFormulario }) {
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
        <MultiSelect
          opcoes={ESTADOS_CIVIS.map((e) => ({ value: e, label: e }))}
          selecionados={searchParams.getAll("estadoCivil")}
          onChange={(valores) => atualizarFiltroMultiplo("estadoCivil", valores)}
        />
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
