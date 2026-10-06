export function formatarMoeda(valor: unknown) {
  if (valor == null || valor === "") return null;
  return Number(valor).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

// Denominador zero (nenhuma base pra calcular média/taxa) — diferente de um resultado que
// genuinamente deu zero, ou de um dado ausente (ver DADO_AUSENTE). Os indicadores que podem
// ter denominador zero devolvem `null` no cálculo; a formatação troca por este texto aqui,
// nunca antes (arredondamento e troca de texto são sempre responsabilidade da apresentação).
export const SEM_BASE_PARA_CALCULO = "Sem base para cálculo";

// Dado ausente (não cadastrado, ex.: colaborador sem salário lançado) — diferente de um
// valor que é zero de verdade.
export const DADO_AUSENTE = "—";

export function formatarComBase(valor: number | null, formatar: (v: number) => string): string {
  if (valor === null) return SEM_BASE_PARA_CALCULO;
  return formatar(valor);
}

export function formatarPercentual(valor: number | null, casasDecimais = 1): string {
  return formatarComBase(valor, (v) => `${v.toFixed(casasDecimais)}%`);
}
