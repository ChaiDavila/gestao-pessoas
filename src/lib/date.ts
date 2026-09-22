export function formatarData(data: string | null | undefined) {
  if (!data) return "—";
  return new Date(data + "T00:00:00").toLocaleDateString("pt-BR");
}

export function calcularIdade(dataNascimento: string | null | undefined) {
  if (!dataNascimento) return null;
  const nascimento = new Date(dataNascimento + "T00:00:00");
  const hoje = new Date();
  let idade = hoje.getFullYear() - nascimento.getFullYear();
  const aindaNaoFezAniversario =
    hoje.getMonth() < nascimento.getMonth() ||
    (hoje.getMonth() === nascimento.getMonth() &&
      hoje.getDate() < nascimento.getDate());
  if (aindaNaoFezAniversario) idade -= 1;
  return idade;
}

export function somarMeses(data: string, meses: number) {
  const d = new Date(data + "T00:00:00");
  d.setMonth(d.getMonth() + meses);
  return d.toISOString().slice(0, 10);
}

export function hojeISO() {
  return new Date().toISOString().slice(0, 10);
}

export type PeriodoResolvido = { inicio: string; fim: string; rotulo: string };

/**
 * Resolve o filtro de período (ano atual / ano anterior / todo o período / personalizado)
 * em datas concretas. "Ano atual" vai até hoje (não até 31/dez), porque o resto do ano
 * ainda não aconteceu. Num período personalizado, o fim nunca passa de hoje. "Todo o
 * período" usa uma data-sentinela bem no passado como início — o que importa é que seja
 * anterior a qualquer registro real, não a data exata.
 */
export function resolverPeriodo(
  modo: string | undefined,
  de: string | undefined,
  ate: string | undefined,
): PeriodoResolvido {
  const hoje = hojeISO();
  const anoAtual = new Date().getFullYear();

  if (modo === "anterior") {
    const anoAnterior = anoAtual - 1;
    return {
      inicio: `${anoAnterior}-01-01`,
      fim: `${anoAnterior}-12-31`,
      rotulo: String(anoAnterior),
    };
  }

  if (modo === "todo") {
    return { inicio: "1970-01-01", fim: hoje, rotulo: "Todo o período" };
  }

  if (modo === "personalizado" && de && ate) {
    return { inicio: de, fim: ate > hoje ? hoje : ate, rotulo: `${formatarData(de)} a ${formatarData(ate)}` };
  }

  return { inicio: `${anoAtual}-01-01`, fim: hoje, rotulo: String(anoAtual) };
}
