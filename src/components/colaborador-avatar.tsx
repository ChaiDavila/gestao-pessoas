function iniciais(nome: string) {
  const partes = nome.trim().split(/\s+/).filter(Boolean);
  const primeira = partes[0]?.[0] ?? "";
  const ultima = partes.length > 1 ? partes[partes.length - 1][0] : "";
  return (primeira + ultima).toUpperCase();
}

const TAMANHOS = {
  sm: "h-9 w-9 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-14 w-14 text-lg",
};

// Mesma cor para todo mundo (laranja claro + laranja escuro), igual ao protótipo —
// não é uma paleta por pessoa.
export function ColaboradorAvatar({
  nome,
  size = "md",
}: {
  nome: string;
  size?: keyof typeof TAMANHOS;
}) {
  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full bg-accent font-bold text-accent-foreground ${TAMANHOS[size]}`}
    >
      {iniciais(nome)}
    </div>
  );
}
