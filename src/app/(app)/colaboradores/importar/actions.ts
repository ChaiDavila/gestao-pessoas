"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getUnidadeIdPadrao } from "@/lib/data/unidades";
import { parseCsv } from "@/lib/csv";
import {
  ESTADOS_CIVIS,
  REGIMES_TRABALHO,
  SEXOS,
  TIPOS_CONTRATO,
} from "@/lib/constants/rh";

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

export type LinhaImportacao = {
  linha: number;
  nome: string;
  status: "ok" | "erro";
  mensagem: string;
};

export type ImportacaoState =
  | { error: string }
  | { ok: true; resultados: LinhaImportacao[] }
  | undefined;

function normalizarData(valor: string) {
  const v = valor.trim();
  if (!v) return "";
  const br = v.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (br) {
    const [, d, m, a] = br;
    return `${a}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  return v;
}

function normalizarNumero(valor: string) {
  const v = valor.trim();
  if (!v) return "";
  return v.replace(/\./g, "").replace(",", ".");
}

function casarEnum<T extends string>(valor: string, opcoes: readonly T[]): T | null {
  const alvo = valor.trim().toLowerCase();
  if (!alvo) return null;
  return opcoes.find((o) => o.toLowerCase() === alvo) ?? null;
}

type CatalogoItem = { id: string; nome: string };

async function carregarCatalogo(supabase: SupabaseClient, tabela: string) {
  const { data, error } = await supabase
    .schema("rh")
    .from(tabela)
    .select("id, nome")
    .eq("ativo", true);
  if (error) throw new Error(error.message);
  return (data ?? []) as CatalogoItem[];
}

async function buscarOuCriarCatalogo(
  supabase: SupabaseClient,
  tabela: string,
  unidadeId: string,
  cache: CatalogoItem[],
  nome: string,
): Promise<string | null> {
  const valor = nome.trim();
  if (!valor) return null;
  const existente = cache.find((c) => c.nome.trim().toLowerCase() === valor.toLowerCase());
  if (existente) return existente.id;

  const { data, error } = await supabase
    .schema("rh")
    .from(tabela)
    .insert({ unidade_id: unidadeId, nome: valor })
    .select("id, nome")
    .single();

  if (error || !data) {
    throw new Error(`Erro ao criar "${valor}" em ${tabela}: ${error?.message ?? "erro desconhecido"}`);
  }
  cache.push(data as CatalogoItem);
  return (data as CatalogoItem).id;
}

export async function importarColaboradores(
  _prevState: ImportacaoState,
  formData: FormData,
): Promise<ImportacaoState> {
  const arquivo = formData.get("arquivo");
  if (!(arquivo instanceof File) || arquivo.size === 0) {
    return { error: "Selecione um arquivo CSV para importar." };
  }

  const texto = await arquivo.text();
  const linhasCsv = parseCsv(texto);
  if (linhasCsv.length < 2) {
    return { error: "O arquivo está vazio ou só tem o cabeçalho." };
  }

  const cabecalhoArquivo = linhasCsv[0].map((c) => c.trim().toLowerCase());
  const indice = (coluna: string) => cabecalhoArquivo.indexOf(coluna);

  if (indice("nome") === -1 || indice("matricula") === -1) {
    return {
      error:
        "O arquivo precisa ter, no mínimo, as colunas \"nome\" e \"matricula\". Baixe o modelo para conferir o formato esperado.",
    };
  }

  const supabase = await createClient();
  const unidadeId = await getUnidadeIdPadrao();

  const [cargos, setores, niveis, eixos, colaboradoresExistentesRes] = await Promise.all([
    carregarCatalogo(supabase, "config_cargos"),
    carregarCatalogo(supabase, "config_setores"),
    carregarCatalogo(supabase, "config_niveis"),
    carregarCatalogo(supabase, "config_eixos"),
    supabase.schema("rh").from("colaboradores").select("id, matricula"),
  ]);

  if (colaboradoresExistentesRes.error) {
    return { error: colaboradoresExistentesRes.error.message };
  }

  const colaboradoresExistentes = (colaboradoresExistentesRes.data ?? []) as {
    id: string;
    matricula: string;
  }[];

  const matriculasExistentes = new Set(
    colaboradoresExistentes.map((c) => c.matricula.toLowerCase()),
  );
  const idsPorMatricula = new Map<string, string>(
    colaboradoresExistentes.map((c) => [c.matricula.toLowerCase(), c.id]),
  );

  const resultados: LinhaImportacao[] = [];
  const matriculasNoLote = new Set<string>();

  for (let i = 1; i < linhasCsv.length; i++) {
    const linhaNum = i + 1; // linha 1 é o cabeçalho, então a primeira pessoa é a linha 2
    const colunas = linhasCsv[i];
    const campo = (nomeColuna: string) => {
      const idx = indice(nomeColuna);
      return idx === -1 ? "" : (colunas[idx] ?? "").trim();
    };

    const nome = campo("nome");
    const matricula = campo("matricula");

    if (!nome) {
      resultados.push({ linha: linhaNum, nome: "(sem nome)", status: "erro", mensagem: "Nome em branco." });
      continue;
    }
    if (!matricula) {
      resultados.push({ linha: linhaNum, nome, status: "erro", mensagem: "Matrícula em branco." });
      continue;
    }
    const matriculaChave = matricula.toLowerCase();
    if (matriculasExistentes.has(matriculaChave)) {
      resultados.push({
        linha: linhaNum,
        nome,
        status: "erro",
        mensagem: `Matrícula "${matricula}" já existe na base.`,
      });
      continue;
    }
    if (matriculasNoLote.has(matriculaChave)) {
      resultados.push({
        linha: linhaNum,
        nome,
        status: "erro",
        mensagem: `Matrícula "${matricula}" duplicada no próprio arquivo.`,
      });
      continue;
    }

    const dataAdmissao = normalizarData(campo("data_admissao"));
    if (!dataAdmissao) {
      resultados.push({
        linha: linhaNum,
        nome,
        status: "erro",
        mensagem: "Data de admissão em branco ou em formato inválido (use AAAA-MM-DD ou DD/MM/AAAA).",
      });
      continue;
    }

    const tipoContratoBruto = campo("tipo_contrato");
    const tipoContrato = casarEnum(tipoContratoBruto, TIPOS_CONTRATO);
    if (!tipoContrato) {
      resultados.push({
        linha: linhaNum,
        nome,
        status: "erro",
        mensagem: `Tipo de contrato inválido: "${tipoContratoBruto}". Use um de: ${TIPOS_CONTRATO.join(", ")}.`,
      });
      continue;
    }

    const regimeTrabalhoBruto = campo("regime_trabalho");
    const regimeTrabalho = casarEnum(regimeTrabalhoBruto, REGIMES_TRABALHO);
    if (!regimeTrabalho) {
      resultados.push({
        linha: linhaNum,
        nome,
        status: "erro",
        mensagem: `Regime de trabalho inválido: "${regimeTrabalhoBruto}". Use um de: ${REGIMES_TRABALHO.join(", ")}.`,
      });
      continue;
    }

    const email = campo("email");
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      resultados.push({ linha: linhaNum, nome, status: "erro", mensagem: `E-mail inválido: "${email}".` });
      continue;
    }

    const sexo = casarEnum(campo("sexo"), SEXOS);
    const conjugeSexo = casarEnum(campo("conjuge_sexo"), SEXOS);
    const estadoCivil = casarEnum(campo("estado_civil"), ESTADOS_CIVIS) ?? "Não informado";

    let pessoaId: string | null = null;
    try {
      const cargoId = await buscarOuCriarCatalogo(supabase, "config_cargos", unidadeId, cargos, campo("cargo"));
      const setorId = await buscarOuCriarCatalogo(supabase, "config_setores", unidadeId, setores, campo("setor"));
      const nivelId = await buscarOuCriarCatalogo(supabase, "config_niveis", unidadeId, niveis, campo("nivel"));
      const eixoId = await buscarOuCriarCatalogo(supabase, "config_eixos", unidadeId, eixos, campo("eixo"));

      const matriculaGestor = campo("matricula_gestor");
      let gestorId: string | null = null;
      if (matriculaGestor) {
        gestorId = idsPorMatricula.get(matriculaGestor.toLowerCase()) ?? null;
        if (!gestorId) {
          resultados.push({
            linha: linhaNum,
            nome,
            status: "erro",
            mensagem: `Gestor com matrícula "${matriculaGestor}" não encontrado (precisa vir antes no arquivo, ou já existir na base).`,
          });
          continue;
        }
      }

      const dataNascimento = normalizarData(campo("data_nascimento")) || null;

      const { data: pessoa, error: pessoaError } = await supabase
        .schema("core")
        .from("pessoas")
        .insert({
          unidade_id: unidadeId,
          nome,
          cpf: campo("cpf") || null,
          data_nascimento: dataNascimento,
        })
        .select("id")
        .single();

      if (pessoaError || !pessoa) {
        resultados.push({
          linha: linhaNum,
          nome,
          status: "erro",
          mensagem: pessoaError?.message ?? "Erro ao criar pessoa.",
        });
        continue;
      }
      pessoaId = pessoa.id as string;

      const salarioAtual = normalizarNumero(campo("salario_atual"));
      const salarioAdmissional = normalizarNumero(campo("salario_admissional"));

      const { data: colaborador, error: colaboradorError } = await supabase
        .schema("rh")
        .from("colaboradores")
        .insert({
          unidade_id: unidadeId,
          pessoa_id: pessoaId,
          matricula,
          rg: campo("rg") || null,
          pis_pasep: campo("pis_pasep") || null,
          sexo,
          estado_civil: estadoCivil,
          conjuge_nome: campo("conjuge_nome") || null,
          conjuge_sexo: conjugeSexo,
          email_pessoal: email || null,
          telefone_pessoal: campo("telefone_pessoal") || null,
          numero_corporativo: campo("numero_corporativo") || null,
          endereco_rua: campo("endereco_rua") || null,
          endereco_numero: campo("endereco_numero") || null,
          endereco_complemento: campo("endereco_complemento") || null,
          endereco_bairro: campo("endereco_bairro") || null,
          endereco_cidade: campo("endereco_cidade") || null,
          endereco_estado: campo("endereco_estado") || null,
          endereco_cep: campo("endereco_cep") || null,
          contato_emergencia_nome: campo("contato_emergencia_nome") || null,
          contato_emergencia_telefone: campo("contato_emergencia_telefone") || null,
          cargo_id: cargoId,
          cbo: campo("cbo") || null,
          setor_id: setorId,
          nivel_id: nivelId,
          eixo_id: eixoId,
          gestor_colaborador_id: gestorId,
          data_admissao: dataAdmissao,
          tipo_contrato: tipoContrato,
          regime_trabalho: regimeTrabalho,
          salario_atual: salarioAtual ? Number(salarioAtual) : null,
          salario_admissional: salarioAdmissional ? Number(salarioAdmissional) : null,
        })
        .select("id")
        .single();

      if (colaboradorError || !colaborador) {
        await supabase.schema("core").from("pessoas").delete().eq("id", pessoaId);
        resultados.push({
          linha: linhaNum,
          nome,
          status: "erro",
          mensagem: colaboradorError?.message ?? "Erro ao criar colaborador.",
        });
        continue;
      }

      matriculasNoLote.add(matriculaChave);
      idsPorMatricula.set(matriculaChave, colaborador.id as string);
      resultados.push({ linha: linhaNum, nome, status: "ok", mensagem: "Cadastrado com sucesso." });
    } catch (err) {
      if (pessoaId) {
        await supabase.schema("core").from("pessoas").delete().eq("id", pessoaId);
      }
      resultados.push({
        linha: linhaNum,
        nome,
        status: "erro",
        mensagem: err instanceof Error ? err.message : "Erro inesperado.",
      });
    }
  }

  revalidatePath("/colaboradores");
  return { ok: true, resultados };
}
