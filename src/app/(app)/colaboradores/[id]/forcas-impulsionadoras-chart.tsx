import { FORCAS_CONTINUUM, ordenarForcas } from "@/lib/perfil-comportamental";
import type { PerfilComportamentalItem } from "@/lib/data/perfil-comportamental";

export function ForcasImpulsionadorasChart({
  perfil,
}: {
  perfil: PerfilComportamentalItem;
}) {
  const ranksPorChave = new Map(ordenarForcas(perfil).map((f) => [f.chave, f.rank]));

  return (
    <div className="space-y-6 rounded-lg border border-border bg-card p-4">
      <p className="text-sm font-semibold text-foreground">
        Forças Impulsionadoras
      </p>
      {FORCAS_CONTINUUM.map((continuum) => {
        const valorEsquerda = Number(perfil[continuum.esquerda.chave]);
        const valorDireita = Number(perfil[continuum.direita.chave]);
        const esquerdaEmDestaque = valorEsquerda >= valorDireita;

        return (
          <div key={continuum.titulo}>
            <div className="flex items-center justify-between text-sm">
              <span
                className={
                  esquerdaEmDestaque
                    ? "font-semibold text-foreground"
                    : "text-muted-foreground"
                }
              >
                {continuum.esquerda.nome}
              </span>
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {continuum.titulo}
              </span>
              <span
                className={
                  !esquerdaEmDestaque
                    ? "font-semibold text-foreground"
                    : "text-muted-foreground"
                }
              >
                {continuum.direita.nome}
              </span>
            </div>

            <div className="mt-2 flex items-center gap-3">
              <PontuacaoBadge
                valor={valorEsquerda}
                rank={ranksPorChave.get(continuum.esquerda.chave)!}
                cor={continuum.cor}
              />

              <div className="flex h-4 flex-1 items-stretch overflow-hidden rounded-md bg-muted/40">
                <div className="flex flex-1 justify-end">
                  <div
                    className="h-full"
                    style={{ width: `${valorEsquerda}%`, backgroundColor: continuum.cor }}
                  />
                </div>
                <div className="w-px shrink-0 bg-border" />
                <div className="flex flex-1 justify-start">
                  <div
                    className="h-full"
                    style={{ width: `${valorDireita}%`, backgroundColor: continuum.cor }}
                  />
                </div>
              </div>

              <PontuacaoBadge
                valor={valorDireita}
                rank={ranksPorChave.get(continuum.direita.chave)!}
                cor={continuum.cor}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function PontuacaoBadge({
  valor,
  rank,
  cor,
}: {
  valor: number;
  rank: number;
  cor: string;
}) {
  return (
    <div className="relative shrink-0">
      <div
        className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold text-white"
        style={{ backgroundColor: cor }}
      >
        {valor}
      </div>
      <div
        className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border-2 bg-card text-[10px] font-bold"
        style={{ borderColor: cor, color: cor }}
      >
        {rank}
      </div>
    </div>
  );
}
