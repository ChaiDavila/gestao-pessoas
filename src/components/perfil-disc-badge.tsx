import { tracosAltos } from "@/lib/perfil-comportamental";
import type { DiscResumoItem } from "@/lib/data/perfil-comportamental";

// Badge compacto pra listagem: uma bolinha colorida por traço "alto" do DISC Natural (acima
// da linha de 50) — pode ser uma só (ex.: alto-I) ou duas, lado a lado, pra perfil misto
// (ex.: alto-I + alto-S). Sem perfil cadastrado, mostra só um traço.
export function PerfilDiscBadge({ disc }: { disc: DiscResumoItem | undefined | null }) {
  if (!disc) {
    return <span className="text-sm text-muted-foreground">—</span>;
  }

  const tracos = tracosAltos(disc);

  return (
    <div className="flex items-center gap-1">
      {tracos.map((t) => (
        <span
          key={t.letra}
          className="flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white"
          style={{ backgroundColor: t.cor }}
          title={`${t.letra} · ${t.valor}`}
        >
          {t.letra}
        </span>
      ))}
    </div>
  );
}
