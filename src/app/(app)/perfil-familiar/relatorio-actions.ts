"use server";

import {
  getColaboradoresFamiliar,
  getDependentesFamiliar,
  type PerfilFamiliarFiltros,
} from "@/lib/data/perfil-familiar";
import { calcularIdade } from "@/lib/date";
import { montarCsv } from "@/lib/csv";

const LABEL_SEXO: Record<string, string> = { M: "Masculino", F: "Feminino" };

async function colaboradoresFiltradosComDependentes(filtros: PerfilFamiliarFiltros) {
  const [colaboradores, dependentes] = await Promise.all([
    getColaboradoresFamiliar(filtros),
    getDependentesFamiliar(),
  ]);
  const idsPermitidos = new Set(colaboradores.map((c) => c.id));
  let dependentesFiltrados = dependentes.filter((d) => idsPermitidos.has(d.colaborador_id));
  if (filtros.somenteComFilhos) {
    const comFilhos = new Set(dependentesFiltrados.map((d) => d.colaborador_id));
    return {
      colaboradores: colaboradores.filter((c) => comFilhos.has(c.id)),
      dependentes: dependentesFiltrados,
    };
  }
  return { colaboradores, dependentes: dependentesFiltrados };
}

export async function gerarRelatorioFilhos(filtros: PerfilFamiliarFiltros) {
  const { dependentes } = await colaboradoresFiltradosComDependentes(filtros);
  return montarCsv(
    [
      { rotulo: "Nome", valor: (d: (typeof dependentes)[number]) => d.nome },
      {
        rotulo: "Sexo",
        valor: (d: (typeof dependentes)[number]) => (d.sexo ? LABEL_SEXO[d.sexo] : ""),
      },
      {
        rotulo: "Idade",
        valor: (d: (typeof dependentes)[number]) =>
          String(calcularIdade(d.data_nascimento) ?? ""),
      },
      { rotulo: "Parentesco", valor: (d: (typeof dependentes)[number]) => d.parentesco },
      {
        rotulo: "Colaborador responsável",
        valor: (d: (typeof dependentes)[number]) => d.colaborador_nome,
      },
    ],
    dependentes,
  );
}

export async function gerarRelatorioConjuges(filtros: PerfilFamiliarFiltros) {
  const { colaboradores } = await colaboradoresFiltradosComDependentes(filtros);
  const comConjuge = colaboradores.filter((c) => c.conjuge_nome);
  return montarCsv(
    [
      { rotulo: "Nome", valor: (c: (typeof comConjuge)[number]) => c.conjuge_nome ?? "" },
      {
        rotulo: "Sexo",
        valor: (c: (typeof comConjuge)[number]) =>
          c.conjuge_sexo ? LABEL_SEXO[c.conjuge_sexo] : "",
      },
      { rotulo: "Colaborador", valor: (c: (typeof comConjuge)[number]) => c.nome },
    ],
    comConjuge,
  );
}

export async function gerarRelatorioCompleto(filtros: PerfilFamiliarFiltros) {
  const { colaboradores, dependentes } = await colaboradoresFiltradosComDependentes(filtros);
  const dependentesPorColaborador = new Map<string, typeof dependentes>();
  for (const d of dependentes) {
    if (!dependentesPorColaborador.has(d.colaborador_id)) {
      dependentesPorColaborador.set(d.colaborador_id, []);
    }
    dependentesPorColaborador.get(d.colaborador_id)!.push(d);
  }

  return montarCsv(
    [
      { rotulo: "Colaborador", valor: (c: (typeof colaboradores)[number]) => c.nome },
      { rotulo: "Setor", valor: (c: (typeof colaboradores)[number]) => c.setor_nome ?? "" },
      { rotulo: "Estado civil", valor: (c: (typeof colaboradores)[number]) => c.estado_civil },
      { rotulo: "Cônjuge", valor: (c: (typeof colaboradores)[number]) => c.conjuge_nome ?? "" },
      {
        rotulo: "Sexo do cônjuge",
        valor: (c: (typeof colaboradores)[number]) =>
          c.conjuge_sexo ? LABEL_SEXO[c.conjuge_sexo] : "",
      },
      {
        rotulo: "Filhos (nome — idade)",
        valor: (c: (typeof colaboradores)[number]) =>
          (dependentesPorColaborador.get(c.id) ?? [])
            .map((d) => `${d.nome} (${calcularIdade(d.data_nascimento) ?? "?"})`)
            .join(" | "),
      },
    ],
    colaboradores,
  );
}
