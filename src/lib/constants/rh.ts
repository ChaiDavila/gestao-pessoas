// Espelha os CHECK constraints do schema rh (ver supabase/migrations). Manter em sincronia
// se algum valor mudar no banco.

export const SEXOS = ["M", "F"] as const;

export const ESTADOS_CIVIS = [
  "Solteiro(a)",
  "Casado(a)",
  "Divorciado(a)",
  "Viúvo(a)",
  "União estável",
  "Não informado",
] as const;

export const TIPOS_CONTRATO = [
  "CLT",
  "Estágio",
  "Aprendiz",
  "PJ",
  "Temporário",
  "Pró-labore",
] as const;

export const REGIMES_TRABALHO = [
  "Presencial",
  "Híbrido",
  "Remoto",
  "Home Office",
] as const;

export const STATUS_RH = ["ativo", "desligado"] as const;

export const STATUS_RH_LABEL: Record<string, string> = {
  ativo: "Ativo",
  desligado: "Desligado",
};
