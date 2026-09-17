import { z } from "zod";
import {
  ESTADOS_CIVIS,
  REGIMES_TRABALHO,
  SEXOS,
  TIPOS_CONTRATO,
} from "@/lib/constants/rh";

const emptyToUndefined = (v: unknown) => (v === "" ? undefined : v);
const optionalText = () => z.preprocess(emptyToUndefined, z.string().optional());
const optionalUuid = () =>
  z.preprocess(emptyToUndefined, z.string().uuid().optional());

export const colaboradorSchema = z.object({
  // dados cadastrais (nome/cpf/data_nascimento vivem em core.pessoas)
  nome: z.string().min(1, "Informe o nome"),
  cpf: optionalText(),
  data_nascimento: optionalText(),
  matricula: z.string().min(1, "Informe a matrícula"),
  rg: optionalText(),
  pis_pasep: optionalText(),
  sexo: z.preprocess(emptyToUndefined, z.enum(SEXOS).optional()),
  estado_civil: z.enum(ESTADOS_CIVIS).default("Não informado"),
  conjuge_nome: optionalText(),
  conjuge_sexo: z.preprocess(emptyToUndefined, z.enum(SEXOS).optional()),
  email_pessoal: z.preprocess(
    emptyToUndefined,
    z.string().email("E-mail inválido").optional(),
  ),
  telefone_pessoal: optionalText(),
  numero_corporativo: optionalText(),
  endereco_rua: optionalText(),
  endereco_numero: optionalText(),
  endereco_complemento: optionalText(),
  endereco_bairro: optionalText(),
  endereco_cidade: optionalText(),
  endereco_estado: optionalText(),
  endereco_cep: optionalText(),
  contato_emergencia_nome: optionalText(),
  contato_emergencia_telefone: optionalText(),

  // contrato e função
  cargo_id: optionalUuid(),
  cbo: optionalText(),
  setor_id: optionalUuid(),
  nivel_id: optionalUuid(),
  eixo_id: optionalUuid(),
  gestor_colaborador_id: optionalUuid(),
  data_admissao: z.string().min(1, "Informe a data de admissão"),
  tipo_contrato: z.enum(TIPOS_CONTRATO, {
    message: "Selecione o tipo de contrato",
  }),
  regime_trabalho: z.enum(REGIMES_TRABALHO, {
    message: "Selecione o regime de trabalho",
  }),
  salario_atual: z.preprocess(emptyToUndefined, z.coerce.number().optional()),
  salario_admissional: z.preprocess(
    emptyToUndefined,
    z.coerce.number().optional(),
  ),
});

export type ColaboradorInput = z.infer<typeof colaboradorSchema>;
