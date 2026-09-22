"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export type OpcaoMultiSelect = { value: string; label: string };

export function MultiSelect({
  opcoes,
  selecionados,
  onChange,
  placeholder = "Todos",
  className,
}: {
  opcoes: OpcaoMultiSelect[];
  selecionados: string[];
  onChange: (novo: string[]) => void;
  placeholder?: string;
  className?: string;
}) {
  const [busca, setBusca] = useState("");

  function alternar(value: string) {
    if (selecionados.includes(value)) {
      onChange(selecionados.filter((v) => v !== value));
    } else {
      onChange([...selecionados, value]);
    }
  }

  const filtradas = busca
    ? opcoes.filter((o) => o.label.toLowerCase().includes(busca.toLowerCase()))
    : opcoes;

  const rotulo =
    selecionados.length === 0
      ? placeholder
      : selecionados.length === 1
        ? (opcoes.find((o) => o.value === selecionados[0])?.label ?? placeholder)
        : `${selecionados.length} selecionados`;

  return (
    <Popover>
      <PopoverTrigger
        className={cn(
          "flex h-8 w-full min-w-0 items-center justify-between gap-1 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
          selecionados.length === 0 && "text-muted-foreground",
          className,
        )}
      >
        <span className="truncate">{rotulo}</span>
        <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-60" />
      </PopoverTrigger>
      <PopoverContent>
        <div className="space-y-2">
          {opcoes.length > 6 && (
            <Input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar..."
              className="h-7 text-xs"
            />
          )}
          <div className="flex items-center justify-between text-xs">
            <button
              type="button"
              className="text-primary hover:underline"
              onClick={() => onChange(opcoes.map((o) => o.value))}
            >
              Marcar todos
            </button>
            <button
              type="button"
              className="text-primary hover:underline"
              onClick={() => onChange([])}
            >
              Limpar
            </button>
          </div>
          <div className="max-h-56 space-y-0.5 overflow-y-auto">
            {filtradas.map((o) => (
              <label
                key={o.value}
                className="flex items-center gap-2 rounded px-1.5 py-1 text-sm hover:bg-muted/60"
              >
                <Checkbox
                  checked={selecionados.includes(o.value)}
                  onCheckedChange={() => alternar(o.value)}
                />
                <span className="truncate">{o.label}</span>
              </label>
            ))}
            {filtradas.length === 0 && (
              <p className="px-1.5 py-1 text-xs text-muted-foreground">
                Nenhum resultado.
              </p>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
