"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useTransition } from "react";
import { NativeSelect } from "@/components/native-select";
import { MultiSelect } from "@/components/multi-select";
import type { OpcoesFormulario } from "@/lib/data/colaboradores";
import { STATUS_RH, STATUS_RH_LABEL } from "@/lib/constants/rh";

export function DesligamentosFilters({
  opcoes,
  motivos,
}: {
  opcoes: OpcoesFormulario;
  motivos: { id: string; motivo: string }[];
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
      <SelecaoMultipla label="Função" paramKey="cargo" searchParams={searchParams} onChange={atualizarFiltroMultiplo} options={opcoes.cargos} />
      <SelecaoMultipla label="Nível" paramKey="nivel" searchParams={searchParams} onChange={atualizarFiltroMultiplo} options={opcoes.niveis} />
      <SelecaoMultipla label="Eixo" paramKey="eixo" searchParams={searchParams} onChange={atualizarFiltroMultiplo} options={opcoes.eixos} />
      <SelecaoMultipla label="Setor" paramKey="setor" searchParams={searchParams} onChange={atualizarFiltroMultiplo} options={opcoes.setores} />
      <SelecaoMultipla label="Gestor" paramKey="gestor" searchParams={searchParams} onChange={atualizarFiltroMultiplo} options={opcoes.gestores} />
      <div className="w-44 space-y-1">
        <label className="text-xs font-medium text-muted-foreground">
          Colaborador: status
        </label>
        <NativeSelect value={searchParams.get("status") ?? ""} onChange={(e) => atualizarFiltro("status", e.target.value)}>
          <option value="">Todos</option>
          {STATUS_RH.map((s) => (
            <option key={s} value={s}>{STATUS_RH_LABEL[s]}</option>
          ))}
        </NativeSelect>
      </div>
      <div className="w-40 space-y-1">
        <label className="text-xs font-medium text-muted-foreground">Tipo</label>
        <NativeSelect value={searchParams.get("tipo") ?? ""} onChange={(e) => atualizarFiltro("tipo", e.target.value)}>
          <option value="">Todos</option>
          <option value="voluntario">Voluntário</option>
          <option value="involuntario">Involuntário</option>
        </NativeSelect>
      </div>
      <SelecaoMultipla
        label="Motivo"
        paramKey="motivo"
        searchParams={searchParams}
        onChange={atualizarFiltroMultiplo}
        options={motivos.map((m) => ({ id: m.id, nome: m.motivo }))}
      />
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
