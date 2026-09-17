"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

type Colaborador = { id: string; nome: string; setor_nome: string | null };

export function SelecaoParticipantes({
  colaboradores,
  selecionados,
  onChange,
}: {
  colaboradores: Colaborador[];
  selecionados: Set<string>;
  onChange: (novo: Set<string>) => void;
}) {
  function alternar(id: string) {
    const novo = new Set(selecionados);
    if (novo.has(id)) novo.delete(id);
    else novo.add(id);
    onChange(novo);
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>Participantes</Label>
        <div className="flex gap-2 text-sm">
          <button
            type="button"
            className="text-primary hover:underline"
            onClick={() => onChange(new Set(colaboradores.map((c) => c.id)))}
          >
            Marcar todos
          </button>
          <span className="text-muted-foreground">·</span>
          <button
            type="button"
            className="text-primary hover:underline"
            onClick={() => onChange(new Set())}
          >
            Limpar
          </button>
        </div>
      </div>
      <div className="grid max-h-56 grid-cols-2 gap-2 overflow-y-auto rounded-md border border-border p-3">
        {colaboradores.map((c) => (
          <label key={c.id} className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={selecionados.has(c.id)}
              onCheckedChange={() => alternar(c.id)}
            />
            {selecionados.has(c.id) && (
              <input type="hidden" name="participantes" value={c.id} />
            )}
            <span className="truncate">
              {c.nome}
              {c.setor_nome && (
                <span className="text-muted-foreground"> · {c.setor_nome}</span>
              )}
            </span>
          </label>
        ))}
        {colaboradores.length === 0 && (
          <p className="col-span-2 text-sm text-muted-foreground">
            Nenhum colaborador ativo disponível.
          </p>
        )}
      </div>
    </div>
  );
}
