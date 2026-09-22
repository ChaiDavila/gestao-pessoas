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
