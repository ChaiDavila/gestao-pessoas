"use client";

import { useState, useTransition } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import type { ExigenciaAsoItem } from "@/lib/data/colaborador-detalhe";
import { atualizarExigenciaAso } from "./exigencia-aso-actions";

export function ExigenciaAsoTab({ itens }: { itens: ExigenciaAsoItem[] }) {
  return (
    <div className="overflow-x-auto rounded-md border border-border">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-border text-xs uppercase text-muted-foreground">
          <tr>
            <th className="px-3 py-2 font-medium">Tipo de contrato</th>
            <th className="px-3 py-2 font-medium">Exige acompanhamento de ASO/PGR</th>
          </tr>
        </thead>
        <tbody>
          {itens.map((item) => (
            <LinhaExigencia key={item.id} item={item} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function LinhaExigencia({ item }: { item: ExigenciaAsoItem }) {
  const [exigeAso, setExigeAso] = useState(item.exige_aso);
  const [pending, startTransition] = useTransition();

  return (
    <tr className="border-b border-border last:border-0">
      <td className="px-3 py-2 text-foreground">{item.tipo_contrato}</td>
      <td className="px-3 py-2">
        <label className="flex items-center gap-2">
          <Checkbox
            checked={exigeAso}
            disabled={pending}
            onCheckedChange={(v) => {
              const novo = !!v;
              setExigeAso(novo);
              startTransition(() => {
                atualizarExigenciaAso(item.id, novo);
              });
            }}
          />
          <span className="text-muted-foreground">
            {exigeAso ? "Sim" : "Não — não aparece na tela de ASO"}
          </span>
        </label>
      </td>
    </tr>
  );
}
