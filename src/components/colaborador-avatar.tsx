const PALETTE = [
  { bg: "#FBE4DA", fg: "#C43F0C" },
  { bg: "#FCE4EC", fg: "#AD1457" },
  { bg: "#E3F2FD", fg: "#1565C0" },
  { bg: "#E8F5E9", fg: "#2E7D32" },
  { bg: "#FFF3E0", fg: "#EF6C00" },
  { bg: "#EDE7F6", fg: "#5E35B1" },
  { bg: "#F1F8E9", fg: "#558B2F" },
  { bg: "#E0F2F1", fg: "#00695C" },
];

function hashString(texto: string) {
  let h = 0;
  for (let i = 0; i < texto.length; i++) {
    h = (h << 5) - h + texto.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

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

export function ColaboradorAvatar({
  nome,
  size = "md",
}: {
  nome: string;
  size?: keyof typeof TAMANHOS;
}) {
  const cor = PALETTE[hashString(nome) % PALETTE.length];
  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full font-semibold ${TAMANHOS[size]}`}
      style={{ backgroundColor: cor.bg, color: cor.fg }}
    >
      {iniciais(nome)}
    </div>
  );
}
