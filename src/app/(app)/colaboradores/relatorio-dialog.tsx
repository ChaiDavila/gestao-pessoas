"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CAMPOS_RELATORIO } from "@/lib/relatorio-colaboradores";
import type { ColaboradoresFiltros } from "@/lib/data/colaboradores";
import { gerarRelatorioCsv } from "./relatorio-actions";

const GRUPOS = ["Identificação", "Dados pessoais", "Contrato e função", "Outros"] as const;

const PADRAO = new Set(
  CAMPOS_RELATORIO.filter((c) => c.padrao).map((c) => c.chave),
);

export function RelatorioDialog({ filtros }: { filtros: ColaboradoresFiltros }) {
  const [aberto, setAberto] = useState(false);
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set(PADRAO));
  const [pending, startTransition] = useTransition();

  function alternar(chave: string) {
    setSelecionados((atual) => {
      const novo = new Set(atual);
      if (novo.has(chave)) novo.delete(chave);
      else novo.add(chave);
      return novo;
    });
  }

  function marcarTodos() {
    setSelecionados(new Set(CAMPOS_RELATORIO.map((c) => c.chave)));
  }

  function limpar() {
    setSelecionados(new Set());
  }

  function baixar() {
    startTransition(async () => {
      const csv = await gerarRelatorioCsv(filtros, Array.from(selecionados));
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `colaboradores-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      setAberto(false);
    });
  }

  return (
    <>
      <Button variant="outline" onClick={() => setAberto(true)}>
        Relatório personalizado
      </Button>
      <Dialog open={aberto} onOpenChange={setAberto}>
      <DialogContent className="max-w-lg sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Relatório personalizado</DialogTitle>
        </DialogHeader>

        <div className="flex justify-end gap-2 text-sm">
          <button type="button" className="text-primary hover:underline" onClick={marcarTodos}>
            Marcar todos
          </button>
          <span className="text-muted-foreground">·</span>
          <button type="button" className="text-primary hover:underline" onClick={limpar}>
            Limpar
          </button>
        </div>

        <div className="max-h-96 space-y-4 overflow-y-auto">
          {GRUPOS.map((grupo) => (
            <div key={grupo}>
              <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
                {grupo}
              </p>
              <div className="grid grid-cols-2 gap-2">
                {CAMPOS_RELATORIO.filter((c) => c.grupo === grupo).map((c) => (
                  <label key={c.chave} className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={selecionados.has(c.chave)}
                      onCheckedChange={() => alternar(c.chave)}
                    />
                    {c.rotulo}
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button
            type="button"
            disabled={pending || selecionados.size === 0}
            onClick={baixar}
          >
            {pending ? "Gerando..." : "Baixar CSV"}
          </Button>
        </DialogFooter>
      </DialogContent>
      </Dialog>
    </>
  );
}
