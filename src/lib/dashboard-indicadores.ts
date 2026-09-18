import type {
  ColaboradorDashboardItem,
  DesligamentoDashboardItem,
  FormacaoAtualItem,
} from "@/lib/data/dashboard";
import { preencherAnosContinuos } from "@/lib/date";

export type DashboardFiltros = {
  cargoId?: string;
  nivelId?: string;
  eixoId?: string;
  setorId?: string;
  gestorId?: string;
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
  if (f.cargoId && c.cargo_id !== f.cargoId) return false;
  if (f.nivelId && c.nivel_id !== f.nivelId) return false;
  if (f.eixoId && c.eixo_id !== f.eixoId) return false;
  if (f.setorId && c.setor_id !== f.setorId) return false;
  if (f.gestorId && c.gestor_colaborador_id !== f.gestorId) return false;
  if (f.status && c.status_rh !== f.status) return false;
  if (f.de && c.data_admissao < f.de) return false;
  if (f.ate && c.data_admissao > f.ate) return false;
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
  const colaboradores = colaboradoresTodos.filter((c) => aplicaFiltrosBase(c, filtros));
  const idsPermitidos = new Set(colaboradores.map((c) => c.id));
  let desligamentos = desligamentosTodos.filter((d) => idsPermitidos.has(d.colaborador_id));
  if (filtros.de) desligamentos = desligamentos.filter((d) => d.data >= filtros.de!);
  if (filtros.ate) desligamentos = desligamentos.filter((d) => d.data <= filtros.ate!);

  const ativos = colaboradores.filter((c) => c.status_rh === "ativo");

  // KPIs
  const colaboradoresAtivos = ativos.length;
  const folhaSalarial = ativos.reduce((s, c) => s + Number(c.salario_atual || 0), 0);
  const anoAtual = hoje.getFullYear();
  const desligamentosAnoAtualLista = desligamentosTodos.filter(
    (d) => idsPermitidos.has(d.colaborador_id) && d.data.startsWith(String(anoAtual)),
  );
  const desligamentosAnoAtual = desligamentosAnoAtualLista.length;
  // Aproximação: turnover = desligamentos do ano / colaboradores ativos atuais.
  const turnoverAnoAtual =
    colaboradoresAtivos > 0 ? (desligamentosAnoAtual / colaboradoresAtivos) * 100 : 0;
  const tempoMedioDeCasa =
    ativos.length > 0
      ? ativos.reduce((s, c) => s + anosDeCasa(c.data_admissao, hoje), 0) / ativos.length
      : 0;

  // Admissões x desligamentos por ano (todos os anos, ignora período — igual ao padrão
  // já usado em Treinamentos/Evolução Salarial para gráficos de tendência).
  const anosComDados = new Set<string>();
  for (const c of colaboradoresTodos) {
    if (idsPermitidos.has(c.id)) anosComDados.add(c.data_admissao.slice(0, 4));
  }
  for (const d of desligamentosTodos) {
    if (idsPermitidos.has(d.colaborador_id)) anosComDados.add(d.data.slice(0, 4));
  }
  // Preenche os anos sem nenhuma admissão/desligamento (não só os que têm dado) para o
  // eixo do tempo ficar contínuo — do contrário, anos vazios somem e a distância entre
  // colunas passa a impressão errada de que os anos vizinhos são consecutivos.
  const anosOrdenados = preencherAnosContinuos(anosComDados);

  const admissoesPorAno = anosOrdenados.map(
    (ano) => colaboradores.filter((c) => c.data_admissao.startsWith(ano)).length,
  );
  const desligamentosPorAno = anosOrdenados.map(
    (ano) => desligamentosTodos.filter((d) => idsPermitidos.has(d.colaborador_id) && d.data.startsWith(ano)).length,
  );

  // Turnover anual (%) por ano: desligamentos do ano / colaboradores admitidos até o fim
  // daquele ano (aproximação de headcount, não uma média mensal precisa).
  const turnoverPorAno = anosOrdenados.map((ano) => {
    const admitidosAte = colaboradores.filter((c) => c.data_admissao <= `${ano}-12-31`).length;
    const desligadosNoAno = desligamentosTodos.filter(
      (d) => idsPermitidos.has(d.colaborador_id) && d.data.startsWith(ano),
    ).length;
    return admitidosAte > 0 ? Math.round((desligadosNoAno / admitidosAte) * 1000) / 10 : 0;
  });

  // Evolução da folha salarial total por ano: aproximação usando o salário ATUAL de quem
  // já estava ativo/admitido naquele ano (não reconstrói o salário histórico exato).
  const folhaPorAno = anosOrdenados.map((ano) =>
    ativos
      .filter((c) => c.data_admissao <= `${ano}-12-31`)
      .reduce((s, c) => s + Number(c.salario_atual || 0), 0),
  );

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

  const desligamentosPorTipo = agrupar(
    desligamentos.map((d) => ({
      chave: d.tipo === "voluntario" ? "Voluntário" : "Involuntário",
      id: d.id,
    })),
  );

  const desligamentosPorMotivo = agrupar(
    desligamentos.map((d) => ({ chave: d.motivo_nome ?? "Sem motivo", id: d.id })),
  ).sort((a, b) => b.valor - a.valor);

  return {
    colaboradoresAtivos,
    totalColaboradoresBase: colaboradoresTodos.length,
    folhaSalarial,
    salarioMedio: colaboradoresAtivos > 0 ? folhaSalarial / colaboradoresAtivos : 0,
    turnoverAnoAtual,
    desligamentosAnoAtual,
    desligamentosAnoAtualIds: desligamentosAnoAtualLista.map((d) => d.id),
    tempoMedioDeCasa,
    ativosIds: ativos.map((c) => c.id),
    ativos,
    anosOrdenados,
    admissoesPorAno,
    desligamentosPorAno,
    turnoverPorAno,
    folhaPorAno,
    porSetor,
    porSexo,
    porFaixaEtaria,
    porTempoDeCasa,
    porFormacao,
    desligamentosPorTipo,
    desligamentosPorMotivo,
    colaboradoresFiltrados: colaboradores,
    desligamentosFiltrados: desligamentos,
  };
}

export function anosDeCasaDe(dataAdmissao: string) {
  return anosDeCasa(dataAdmissao, new Date());
}
