import type {
  ColaboradorDashboardItem,
  DesligamentoDashboardItem,
  FormacaoAtualItem,
} from "@/lib/data/dashboard";
import {
  agruparDesligamentosPorColaborador,
  estavaAtivoEm,
  headcountEm,
} from "@/lib/headcount";
import { formatarData } from "@/lib/date";
import { formatarMoeda } from "@/lib/formatacao";

export type DashboardFiltros = {
  cargoId?: string[];
  nivelId?: string[];
  eixoId?: string[];
  setorId?: string[];
  gestorId?: string[];
  status?: string;
  de?: string;
  ate?: string;
};

export type GrupoValor = { chave: string; valor: number; ids: string[] };

function agrupar(
  itens: { chave: string; id: string }[],
): GrupoValor[] {
  const mapa = new Map<string, string[]>();
  for (const item of itens) {
    if (!mapa.has(item.chave)) mapa.set(item.chave, []);
    mapa.get(item.chave)!.push(item.id);
  }
  return Array.from(mapa.entries()).map(([chave, ids]) => ({
    chave,
    valor: ids.length,
    ids,
  }));
}

function aplicaFiltrosBase(
  c: ColaboradorDashboardItem,
  f: DashboardFiltros,
) {
  if (f.cargoId?.length && !f.cargoId.includes(c.cargo_id ?? "")) return false;
  if (f.nivelId?.length && !f.nivelId.includes(c.nivel_id ?? "")) return false;
  if (f.eixoId?.length && !f.eixoId.includes(c.eixo_id ?? "")) return false;
  if (f.setorId?.length && !f.setorId.includes(c.setor_id ?? "")) return false;
  if (f.gestorId?.length && !f.gestorId.includes(c.gestor_colaborador_id ?? "")) return false;
  if (f.status && c.status_rh !== f.status) return false;
  if (f.de && c.data_admissao < f.de) return false;
  if (f.ate && c.data_admissao > f.ate) return false;
  return true;
}

// Filtro só de estrutura organizacional (função/nível/eixo/setor/gestor), sem status nem
// data de admissão — usado pelos 4 KPIs de headcount/folha, que reconstroem quem estava
// ativo numa DATA DE REFERÊNCIA (ver `estavaAtivoEm`) em vez de olhar o status_rh atual ou
// filtrar por quando a pessoa foi admitida. Isso é o que permite alguém desligado hoje ainda
// contar como ativo (e entrar na folha) numa data de referência no passado.
function aplicaFiltrosEstrutura(
  c: ColaboradorDashboardItem,
  f: DashboardFiltros,
) {
  if (f.cargoId?.length && !f.cargoId.includes(c.cargo_id ?? "")) return false;
  if (f.nivelId?.length && !f.nivelId.includes(c.nivel_id ?? "")) return false;
  if (f.eixoId?.length && !f.eixoId.includes(c.eixo_id ?? "")) return false;
  if (f.setorId?.length && !f.setorId.includes(c.setor_id ?? "")) return false;
  if (f.gestorId?.length && !f.gestorId.includes(c.gestor_colaborador_id ?? "")) return false;
  return true;
}

function idade(dataNascimento: string, hoje: Date) {
  const nasc = new Date(dataNascimento + "T00:00:00");
  let anos = hoje.getFullYear() - nasc.getFullYear();
  if (
    hoje.getMonth() < nasc.getMonth() ||
    (hoje.getMonth() === nasc.getMonth() && hoje.getDate() < nasc.getDate())
  ) {
    anos -= 1;
  }
  return anos;
}

function anosDeCasa(dataAdmissao: string, hoje: Date) {
  return idade(dataAdmissao, hoje);
}

// Anos de casa em fração (anos + meses/12), igual ao protótipo — usado só para a MÉDIA
// do KPI "Tempo médio de casa". Usar anos inteiros aqui (como em anosDeCasa) sub-representa
// a média, já que arredonda todo mundo pra baixo antes de somar.
function tempoDeCasaFracionario(dataAdmissao: string, hoje: Date) {
  const inicio = new Date(dataAdmissao + "T00:00:00");
  let anos = hoje.getFullYear() - inicio.getFullYear();
  let meses = hoje.getMonth() - inicio.getMonth();
  if (hoje.getDate() < inicio.getDate()) meses -= 1;
  if (meses < 0) {
    anos -= 1;
    meses += 12;
  }
  if (anos < 0) {
    anos = 0;
    meses = 0;
  }
  return anos + meses / 12;
}

const FAIXAS_ETARIAS = [
  { rotulo: "<15", min: -Infinity, max: 14 },
  { rotulo: "15-19", min: 15, max: 19 },
  { rotulo: "20-25", min: 20, max: 25 },
  { rotulo: "26-35", min: 26, max: 35 },
  { rotulo: "36-40", min: 36, max: 40 },
  { rotulo: "41-60", min: 41, max: 60 },
  { rotulo: "61+", min: 61, max: Infinity },
];

const FAIXAS_TEMPO_CASA = [
  { rotulo: "<1 ano", min: -Infinity, max: 0 },
  { rotulo: "1-3", min: 1, max: 3 },
  { rotulo: "4-5", min: 4, max: 5 },
  { rotulo: "6-10", min: 6, max: 10 },
  { rotulo: ">10", min: 11, max: Infinity },
];

const LABEL_SEXO: Record<string, string> = { M: "Masculino", F: "Feminino" };

export function calcularDashboard(
  colaboradoresTodos: ColaboradorDashboardItem[],
  desligamentosTodos: DesligamentoDashboardItem[],
  formacaoAtual: FormacaoAtualItem[],
  filtros: DashboardFiltros,
) {
  const hoje = new Date();
  const hojeISO = hoje.toISOString().slice(0, 10);
  const colaboradores = colaboradoresTodos.filter((c) => aplicaFiltrosBase(c, filtros));
  const idsPermitidos = new Set(colaboradores.map((c) => c.id));
  let desligamentos = desligamentosTodos.filter((d) => idsPermitidos.has(d.colaborador_id));
  if (filtros.de) desligamentos = desligamentos.filter((d) => d.data >= filtros.de!);
  if (filtros.ate) desligamentos = desligamentos.filter((d) => d.data <= filtros.ate!);

  // Histórico completo de desligamento/reativação por colaborador (sem filtro nenhum) —
  // usado só pra reconstruir quem estava ativo em datas passadas, nunca pra contar quem
  // entra no numerador de cada indicador (isso continua respeitando os filtros normais).
  const desligamentosPorColaborador = agruparDesligamentosPorColaborador(desligamentosTodos);

  const ativos = colaboradores.filter((c) => c.status_rh === "ativo");

  // --- 4 KPIs de headcount/folha (colaboradores ativos, folha salarial, salário médio,
  // tempo médio de casa) ---
  //
  // Esses 4 cards usam uma base PRÓPRIA, separada de `ativos` acima: filtram só por
  // estrutura organizacional (função/nível/eixo/setor/gestor) e reconstroem quem estava
  // ativo numa DATA DE REFERÊNCIA — hoje, se nenhum período foi selecionado, ou a data
  // final do período (`ate`), se foi. Isso é diferente de `ativos` (que reflete o status_rh
  // ATUAL e, se um período foi selecionado, filtra por quando a pessoa foi ADMITIDA) — essa
  // segunda base continua intacta e é usada pelos demais gráficos (setor, sexo, faixa
  // etária, formação etc.), que são deliberadamente um retrato de hoje.
  const colaboradoresEstrutura = colaboradoresTodos.filter((c) => aplicaFiltrosEstrutura(c, filtros));
  const dataReferencia = filtros.ate && filtros.ate <= hojeISO ? filtros.ate : hojeISO;
  const ativosNaReferencia = colaboradoresEstrutura.filter((c) =>
    estavaAtivoEm(c, desligamentosPorColaborador.get(c.id) ?? [], dataReferencia),
  );

  const colaboradoresAtivos = ativosNaReferencia.length;

  // Folha salarial: soma de `salario_atual` (salário vigente cadastrado, sem encargos nem
  // benefícios) dos ativos na data de referência. Salário ausente (null) conta 0 na soma,
  // mas é sinalizado separadamente (`colaboradoresSemSalario`) em vez de silenciosamente
  // virar zero sem explicação.
  const colaboradoresComSalario = ativosNaReferencia.filter(
    (c) => c.salario_atual !== null && c.salario_atual !== undefined,
  );
  const colaboradoresSemSalario = ativosNaReferencia.length - colaboradoresComSalario.length;
  const folhaSalarial = ativosNaReferencia.reduce((s, c) => s + Number(c.salario_atual || 0), 0);
  // Denominador = só quem tem salário válido no recorte (não o total de ativos) — null =
  // sem base para cálculo (ninguém com salário cadastrado), não "zero".
  const salarioMedio =
    colaboradoresComSalario.length > 0 ? folhaSalarial / colaboradoresComSalario.length : null;

  // Tempo médio de casa: sempre da admissão até HOJE (não até a data de referência), sobre
  // quem está ativo na data de referência — null = sem base (ninguém ativo no recorte).
  const tempoMedioDeCasa =
    ativosNaReferencia.length > 0
      ? ativosNaReferencia.reduce((s, c) => s + tempoDeCasaFracionario(c.data_admissao, hoje), 0) /
        ativosNaReferencia.length
      : null;

  const anoAtual = hoje.getFullYear();
  const desligamentosAnoAtualLista = desligamentosTodos.filter(
    (d) => idsPermitidos.has(d.colaborador_id) && d.data.startsWith(String(anoAtual)),
  );
  const desligamentosAnoAtual = desligamentosAnoAtualLista.length;
  // Turnover do ano corrente = desligamentos do ano ÷ headcount médio do ano (início do
  // ano + hoje, ÷ 2) — headcount reconstruído do histórico real, não o headcount de hoje.
  // null = sem base para cálculo (headcount médio zero), não "0%" (que seria indistinguível
  // de "ninguém saiu").
  const headcountInicioAnoAtual = headcountEm(colaboradores, desligamentosPorColaborador, `${anoAtual}-01-01`);
  const headcountHoje = headcountEm(colaboradores, desligamentosPorColaborador, hojeISO);
  const headcountMedioAnoAtual = (headcountInicioAnoAtual + headcountHoje) / 2;
  const turnoverAnoAtual: number | null =
    headcountMedioAnoAtual > 0 ? (desligamentosAnoAtual / headcountMedioAnoAtual) * 100 : null;

  // Admissões x desligamentos por ano (todos os anos, ignora período — igual ao padrão
  // já usado em Treinamentos/Evolução Salarial para gráficos de tendência).
  const anosComDados = new Set<string>();
  for (const c of colaboradoresTodos) {
    if (idsPermitidos.has(c.id)) anosComDados.add(c.data_admissao.slice(0, 4));
  }
  for (const d of desligamentosTodos) {
    if (idsPermitidos.has(d.colaborador_id)) anosComDados.add(d.data.slice(0, 4));
  }
  const anosOrdenados = Array.from(anosComDados).sort();

  const admissoesPorAno = anosOrdenados.map(
    (ano) => colaboradores.filter((c) => c.data_admissao.startsWith(ano)).length,
  );
  const desligamentosPorAno = anosOrdenados.map(
    (ano) => desligamentosTodos.filter((d) => idsPermitidos.has(d.colaborador_id) && d.data.startsWith(ano)).length,
  );

  // Turnover anual (%) por ano: desligamentos do ano ÷ headcount médio daquele ano (início
  // do ano + fim do ano — ou hoje, se for o ano corrente — ÷ 2). Headcount reconstruído do
  // histórico real de admissão/desligamento/reativação, não "todo mundo admitido até a
  // data" (isso contava gente que já tinha saído antes daquele ano).
  const turnoverPorAno = anosOrdenados.map((ano) => {
    const fimAno = ano === String(anoAtual) ? hojeISO : `${ano}-12-31`;
    const hc1 = headcountEm(colaboradores, desligamentosPorColaborador, `${ano}-01-01`);
    const hc2 = headcountEm(colaboradores, desligamentosPorColaborador, fimAno);
    const headcountMedio = (hc1 + hc2) / 2;
    const desligadosNoAno = desligamentosTodos.filter(
      (d) => idsPermitidos.has(d.colaborador_id) && d.data.startsWith(ano),
    ).length;
    return headcountMedio > 0 ? Math.round((desligadosNoAno / headcountMedio) * 1000) / 10 : 0;
  });

  // Evolução da folha salarial total por ano: cada ponto soma o salário ATUAL cadastrado
  // de quem estava com vínculo ativo naquele ano (reconstruído via admissão + histórico real
  // de desligamento/reativação — a mesma base de `ativosNaReferencia` acima, só que repetida
  // pra cada fim de ano). É uma aproximação deliberada (usa o salário de HOJE de cada
  // pessoa, não reconstrói o salário que ela tinha de fato naquele ano — isso exigiria um
  // indicador novo de reajustes, fora de escopo aqui) — mas diferente da versão antiga, já
  // não exclui quem foi desligado depois: alguém que estava ativo em 2022 e saiu em 2024
  // ainda entra no ponto de 2022 e 2023.
  const folhaPorAno = anosOrdenados.map((ano) => {
    const fimAno = ano === String(anoAtual) ? hojeISO : `${ano}-12-31`;
    return colaboradoresEstrutura
      .filter((c) => estavaAtivoEm(c, desligamentosPorColaborador.get(c.id) ?? [], fimAno))
      .reduce((s, c) => s + Number(c.salario_atual || 0), 0);
  });

  // Variação em R$ e % em relação ao ponto anterior — null no primeiro ano (não há anterior)
  // ou quando o ponto anterior é zero (sem base pra calcular variação percentual).
  const folhaPorAnoVariacaoTexto = folhaPorAno.map((valorAtual, i) => {
    if (i === 0) return null;
    const anterior = folhaPorAno[i - 1];
    if (anterior === 0) return null;
    const diferenca = valorAtual - anterior;
    const percentual = (diferenca / anterior) * 100;
    const sinal = diferenca >= 0 ? "+" : "";
    const verbo = diferenca >= 0 ? "aumentou" : "diminuiu";
    return `No período, a folha ${verbo} ${formatarMoeda(Math.abs(diferenca))} (${sinal}${percentual.toFixed(1)}%)`;
  });

  const porSetor = agrupar(
    ativos.map((c) => ({ chave: c.setor_nome ?? "Sem setor", id: c.id })),
  ).sort((a, b) => b.valor - a.valor);

  const porSexo = agrupar(
    ativos
      .filter((c) => c.sexo)
      .map((c) => ({ chave: LABEL_SEXO[c.sexo!] ?? c.sexo!, id: c.id })),
  );

  const porFaixaEtaria = FAIXAS_ETARIAS.map((faixa) => {
    const doGrupo = ativos.filter((c) => {
      if (!c.data_nascimento) return false;
      const a = idade(c.data_nascimento, hoje);
      return a >= faixa.min && a <= faixa.max;
    });
    return { chave: faixa.rotulo, valor: doGrupo.length, ids: doGrupo.map((c) => c.id) };
  });

  const porTempoDeCasa = FAIXAS_TEMPO_CASA.map((faixa) => {
    const doGrupo = ativos.filter((c) => {
      const a = anosDeCasa(c.data_admissao, hoje);
      return a >= faixa.min && a <= faixa.max;
    });
    return { chave: faixa.rotulo, valor: doGrupo.length, ids: doGrupo.map((c) => c.id) };
  });

  const formacaoPorColaborador = new Map(formacaoAtual.map((f) => [f.colaborador_id, f]));
  const porFormacao = agrupar(
    ativos
      .filter((c) => formacaoPorColaborador.has(c.id))
      .map((c) => ({
        chave: formacaoPorColaborador.get(c.id)!.nivel_nome,
        id: c.id,
      })),
  ).sort(
    (a, b) =>
      (formacaoAtual.find((f) => f.nivel_nome === a.chave)?.ordem ?? 0) -
      (formacaoAtual.find((f) => f.nivel_nome === b.chave)?.ordem ?? 0),
  );

  return {
    colaboradoresAtivos,
    totalColaboradoresBase: colaboradoresTodos.length,
    dataReferencia,
    dataReferenciaRotulo:
      dataReferencia === hojeISO ? "hoje" : `em ${formatarData(dataReferencia)}`,
    folhaSalarial,
    salarioMedio,
    colaboradoresSemSalario,
    turnoverAnoAtual,
    desligamentosAnoAtual,
    desligamentosAnoAtualIds: desligamentosAnoAtualLista.map((d) => d.id),
    tempoMedioDeCasa,
    // Base dos 4 KPIs acima (headcount/folha/tempo de casa) — ativos NA DATA DE REFERÊNCIA,
    // não necessariamente quem está ativo hoje. Usada pelos diálogos de detalhe desses 3
    // cards. `ativos`/`ativosIds` (status_rh atual) continuam existindo à parte, abaixo, só
    // para os demais gráficos (setor, sexo, faixa etária, tempo de empresa, formação).
    ativosNaReferenciaIds: ativosNaReferencia.map((c) => c.id),
    ativosNaReferencia,
    ativosIds: ativos.map((c) => c.id),
    ativos,
    anosOrdenados,
    admissoesPorAno,
    desligamentosPorAno,
    turnoverPorAno,
    folhaPorAno,
    folhaPorAnoVariacaoTexto,
    porSetor,
    porSexo,
    porFaixaEtaria,
    porTempoDeCasa,
    porFormacao,
    colaboradoresFiltrados: colaboradores,
    desligamentosFiltrados: desligamentos,
  };
}

export function anosDeCasaDe(dataAdmissao: string) {
  return anosDeCasa(dataAdmissao, new Date());
}
