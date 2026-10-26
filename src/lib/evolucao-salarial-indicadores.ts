import type { EvolucaoSalarialItem } from "@/lib/data/evolucao-salarial";

export type CrescimentoAnoItem = {
  ano: string;
  valorInicial: number;
  valorFinal: number;
  diferenca: number;
  // null quando o valor inicial é zero (sem base pra calcular variação percentual).
  percentual: number | null;
  // true quando algum colaborador teve lançamento(s) nesse ano mas nenhum com salário
  // informado (só mudança de função) — o ano fica de fora do somatório, então o resultado
  // não reflete 100% das alterações registradas.
  incompleto: boolean;
  // true quando NENHUM colaborador do ano entrou no somatório (não há base pra calcular
  // nada, nem diferença) — diferente de uma diferença que deu zero de verdade.
  semDados: boolean;
};

// Crescimento da folha por ano: compara, por colaborador, o salário ANTERIOR ao primeiro
// lançamento do ano com o salário NOVO do último lançamento do ano, soma entre todos os
// colaboradores do recorte, e só então calcula a diferença/percentual — nunca a média dos
// percentuais de cada lançamento individual (isso sub ou super-representa quem teve mais de
// uma alteração no mesmo ano). `lancamentos` deve vir sem filtro de período (um lançamento
// de qualquer ano), já filtrado pelos demais filtros da tela.
export function calcularCrescimentoPorAno(
  lancamentos: EvolucaoSalarialItem[],
): CrescimentoAnoItem[] {
  const porAno = new Map<string, EvolucaoSalarialItem[]>();
  for (const l of lancamentos) {
    const ano = l.data.slice(0, 4);
    if (!porAno.has(ano)) porAno.set(ano, []);
    porAno.get(ano)!.push(l);
  }

  return Array.from(porAno.keys())
    .sort()
    .map((ano) => {
      const doAno = porAno.get(ano)!;
      const porColaborador = new Map<string, EvolucaoSalarialItem[]>();
      for (const l of doAno) {
        if (!porColaborador.has(l.colaborador_id)) porColaborador.set(l.colaborador_id, []);
        porColaborador.get(l.colaborador_id)!.push(l);
      }

      let valorInicial = 0;
      let valorFinal = 0;
      let colaboradoresIncluidos = 0;
      let incompleto = false;

      for (const itens of porColaborador.values()) {
        const ordenados = [...itens].sort((a, b) => a.data.localeCompare(b.data));
        const primeiro = ordenados.find(
          (l) => l.salario_anterior !== null && l.salario_anterior !== undefined,
        );
        const ultimo = [...ordenados]
          .reverse()
          .find((l) => l.salario_novo !== null && l.salario_novo !== undefined);

        if (primeiro && ultimo) {
          valorInicial += Number(primeiro.salario_anterior);
          valorFinal += Number(ultimo.salario_novo);
          colaboradoresIncluidos++;
        } else {
          incompleto = true;
        }
      }

      const diferenca = valorFinal - valorInicial;
      return {
        ano,
        valorInicial,
        valorFinal,
        diferenca,
        percentual: valorInicial !== 0 ? (diferenca / valorInicial) * 100 : null,
        incompleto,
        semDados: colaboradoresIncluidos === 0,
      };
    });
}

export type DiferencaSalarial = { diferenca: number | null; percentual: number | null };

// Diferença de UM lançamento — "Não calculável" (null nos dois) quando falta salário
// anterior ou novo, nunca tratado como zero (que seria uma diferença real diferente).
export function calcularDiferencaLancamento(
  salarioAnterior: number | null | undefined,
  salarioNovo: number | null | undefined,
): DiferencaSalarial {
  if (salarioAnterior === null || salarioAnterior === undefined) {
    return { diferenca: null, percentual: null };
  }
  if (salarioNovo === null || salarioNovo === undefined) {
    return { diferenca: null, percentual: null };
  }
  const anterior = Number(salarioAnterior);
  const novo = Number(salarioNovo);
  const diferenca = novo - anterior;
  return {
    diferenca,
    percentual: anterior !== 0 ? (diferenca / anterior) * 100 : null,
  };
}
