import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export function InfoBanner({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
      {children}
    </div>
  );
}

// Resumo curto sempre visível + detalhe completo num popover "Como funciona" —
// pra orientação longa (regras de acompanhamento, catálogo etc.) não poluir a tela.
export function InfoBannerComDetalhe({
  resumo,
  detalhe,
}: {
  resumo: React.ReactNode;
  detalhe: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
      <p className="flex-1">{resumo}</p>
      <Popover>
        <PopoverTrigger className="shrink-0 text-sm font-medium text-primary hover:underline">
          Como funciona
        </PopoverTrigger>
        <PopoverContent className="w-80 space-y-2 text-sm text-popover-foreground">
          {detalhe}
        </PopoverContent>
      </Popover>
    </div>
  );
}
