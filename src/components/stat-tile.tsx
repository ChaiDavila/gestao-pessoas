export function StatTile({
  label,
  valor,
  subtitulo,
  onClick,
  accent = false,
}: {
  label: string;
  valor: string;
  subtitulo?: string;
  onClick?: () => void;
  accent?: boolean;
}) {
  const conteudo = (
    <>
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
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
