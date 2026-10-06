export function StatTile({
  label,
  valor,
  subtitulo,
  explicacao,
  onClick,
  accent = false,
}: {
  label: string;
  valor: string;
  subtitulo?: string;
  // Explicação curta (população considerada, período/data de referência, fórmula e filtros
  // aplicados) — aparece como tooltip nativo ao passar o mouse no ícone "i", sem exigir
  // clique nem componente de tooltip à parte.
  explicacao?: string;
  onClick?: () => void;
  accent?: boolean;
}) {
  const conteudo = (
    <>
      <div className="flex items-center gap-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        {explicacao && (
          <span
            title={explicacao}
            aria-label={explicacao}
            className="flex h-3.5 w-3.5 shrink-0 cursor-help items-center justify-center rounded-full border border-muted-foreground/40 text-[9px] font-bold leading-none text-muted-foreground"
          >
            i
          </span>
        )}
      </div>
      <p
        className={`mt-1 text-2xl font-bold ${accent ? "text-primary" : "text-foreground"}`}
      >
        {valor}
      </p>
      {subtitulo && (
        <p className="mt-1 text-xs text-muted-foreground">{subtitulo}</p>
      )}
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="w-full rounded-lg border border-border bg-card p-4 text-left transition-colors hover:border-primary/40 hover:bg-muted/40"
      >
        {conteudo}
      </button>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card p-4">{conteudo}</div>
  );
}
