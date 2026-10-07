import { hojeISO, somarMeses } from "@/lib/date";

export type SituacaoVencimento = {
  tone: "danger" | "warning" | "success" | "neutral";
  texto: string;
};

export function situacaoVencimento(
  dataVencimento: string | null | undefined,
): SituacaoVencimento | null {
  if (!dataVencimento) return null;
  const hoje = hojeISO();
  if (dataVencimento < hoje) return { tone: "danger", texto: "Vencido" };
  const em30dias = somarMeses(hoje, 1);
  if (dataVencimento <= em30dias) return { tone: "warning", texto: "A vencer" };
  return { tone: "success", texto: "Em dia" };
}

// Situação de um exame complementar (PGR) — usada pelo módulo ASO e pela ficha do
// colaborador (mesma regra nos dois lugares, nunca duas implementações divergentes).
// "neutral" (exame só-admissão pendente só de registro) não é pendência de conformidade,
// só aparece no detalhe.
export function situacaoPgr(item: {
  registro_id: string | null;
  data_vencimento: string | null;
  periodicidade_meses: number | null;
}): SituacaoVencimento {
  if (!item.registro_id) {
    if (item.periodicidade_meses === null) {
      return { tone: "neutral", texto: "Pendente de registro" };
    }
    return { tone: "danger", texto: "Nunca registrado" };
  }
  return situacaoVencimento(item.data_vencimento) ?? { tone: "success", texto: "Sem vencimento" };
}
