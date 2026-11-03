import { FORCAS_CONTINUUM, ordenarForcas } from "@/lib/perfil-comportamental";
import type { PerfilComportamentalItem } from "@/lib/data/perfil-comportamental";

export function ForcasImpulsionadorasChart({
  perfil,
}: {
  perfil: PerfilComportamentalItem;
}) {
  const ranksPorChave = new Map(ordenarForcas(perfil).map((f) => [f.chave, f.rank]));

  return (
    <div className="max-w-2xl space-y-5 rounded-lg border border-border bg-card p-4">
      <p className="text-sm font-semibold text-foreground">
        Forças Impulsionadoras
      </p>

      <div className="grid grid-cols-[2.75rem_1fr_2.75rem] items-center gap-3">
        <span />
        <div className="flex items-center justify-between text-[10px] font-medium text-muted-foreground">
          <span>100</span>
          <span>0</span>
          <span>100</span>
        </div>
        <span />
      </div>

      <div className="space-y-5">
        {FORCAS_CONTINUUM.map((continuum) => {
          const valorEsquerda = Number(perfil[continuum.esquerda.chave]);
          const valorDireita = Number(perfil[continuum.direita.chave]);
          const esquerdaEmDestaque = valorEsquerda >= valorDireita;

          return (
            <div key={continuum.titulo} className="border-t border-border pt-4 first:border-t-0 first:pt-0">
              {/* Grid de 3 colunas (fixa-flexível-fixa) em vez de flex: garante que o
                  título fique sempre centralizado e a barra do meio nunca force a linha a
                  ficar mais larga que o espaço disponível, não importa o tamanho dos
                  rótulos dos dois lados. */}
              <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 text-sm">
                <span
                  className={`truncate text-right ${
                    esquerdaEmDestaque ? "font-semibold text-foreground" : "text-muted-foreground"
                  }`}
                >
                  {continuum.esquerda.nome}
                </span>
                <span className="whitespace-nowrap px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {continuum.titulo}
                </span>
                <span
                  className={`truncate text-left ${
                    !esquerdaEmDestaque ? "font-semibold text-foreground" : "text-muted-foreground"
                  }`}
                >
                  {continuum.direita.nome}
                </span>
              </div>

              <div className="mt-2 grid grid-cols-[2.75rem_1fr_2.75rem] items-center gap-3">
                <PontuacaoBadge
                  valor={valorEsquerda}
                  rank={ranksPorChave.get(continuum.esquerda.chave)!}
                  cor={continuum.cor}
                />

                <div className="grid min-w-0 grid-cols-2 items-stretch gap-px overflow-hidden rounded-md bg-muted/40">
                  <div className="flex min-w-0 justify-end">
                    <div
                      className="h-5 rounded-l-sm"
                      style={{ width: `${valorEsquerda}%`, backgroundColor: continuum.cor }}
                    />
                  </div>
                  <div className="flex min-w-0 justify-start">
                    <div
                      className="h-5 rounded-r-sm"
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
  // As 4 forças mais bem colocadas (1º a 4º) de cada pessoa são as "dominantes" no
  // relatório — pontuação e colocação ficam maiores pra chamar mais atenção que as demais.
  const destaque = rank <= 4;

  return (
    <div
      className={`relative mx-auto shrink-0 ${destaque ? "h-11 w-11" : "h-9 w-9"}`}
    >
      <div
        className={`flex h-full w-full items-center justify-center rounded-full font-bold text-white ${
          destaque ? "text-base" : "text-sm"
        }`}
        style={{ backgroundColor: cor }}
      >
        {valor}
      </div>
      <div
        className={`absolute -bottom-1 -right-1 flex items-center justify-center rounded-full bg-card font-bold ${
          destaque ? "h-6 w-6 border-[3px] text-xs" : "h-5 w-5 border-2 text-[10px]"
        }`}
        style={{ borderColor: cor, color: cor }}
      >
        {rank}
      </div>
    </div>
  );
}
