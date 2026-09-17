"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useTransition } from "react";
import { NativeSelect } from "@/components/native-select";
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

  return (
    <div className="flex flex-wrap items-end gap-3">
      <Selecao label="Função" paramKey="cargo" searchParams={searchParams} onChange={atualizarFiltro} options={opcoes.cargos} />
      <Selecao label="Nível" paramKey="nivel" searchParams={searchParams} onChange={atualizarFiltro} options={opcoes.niveis} />
      <Selecao label="Eixo" paramKey="eixo" searchParams={searchParams} onChange={atualizarFiltro} options={opcoes.eixos} />
      <Selecao label="Setor" paramKey="setor" searchParams={searchParams} onChange={atualizarFiltro} options={opcoes.setores} />
      <Selecao label="Gestor" paramKey="gestor" searchParams={searchParams} onChange={atualizarFiltro} options={opcoes.gestores} />
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
      <Selecao
        label="Motivo"
        paramKey="motivo"
        searchParams={searchParams}
        onChange={atualizarFiltro}
        options={motivos.map((m) => ({ id: m.id, nome: m.motivo }))}
      />
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
    <div className="w-44 space-y-1">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      <NativeSelect value={searchParams.get(paramKey) ?? ""} onChange={(e) => onChange(paramKey, e.target.value)}>
        <option value="">Todos</option>
        {options.map((o) => (
          <option key={o.id} value={o.id}>{o.nome}</option>
        ))}
      </NativeSelect>
    </div>
  );
}
