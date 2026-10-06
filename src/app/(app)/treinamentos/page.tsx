import {
  getTreinamentos,
  getParticipacoes,
  getNrPorColaborador,
  getConfigCategoriasTreinamento,
  getConfigNrsCatalogo,
} from "@/lib/data/treinamentos";
import { getColaboradoresAtivos, getOpcoesFormulario } from "@/lib/data/colaboradores";
import { getColaboradoresDashboard, getDesligamentosDashboard } from "@/lib/data/dashboard";
import { exigirAcessoTela } from "@/lib/auth";
import { resolverPeriodo } from "@/lib/date";
import { agruparDesligamentosPorColaborador, estevaAtivoEmAlgumMomento } from "@/lib/headcount";
import { PeriodoFilter } from "./periodo-filter";
import { TreinamentosFilters } from "./filters";
import { TreinamentosClient } from "./treinamentos-client";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function primeiro(valor: string | string[] | undefined) {
  return Array.isArray(valor) ? valor[0] : valor;
}

function todos(valor: string | string[] | undefined) {
  if (valor === undefined) return [];
  return Array.isArray(valor) ? valor : [valor];
}

export default async function TreinamentosPage({ searchParams }: PageProps) {
  await exigirAcessoTela("treinamentos");
  const params = await searchParams;
  const statusParam = primeiro(params.status);

  const filtros = {
    busca: (primeiro(params.busca) ?? "").trim().toLowerCase(),
    cargoId: todos(params.cargo),
    nivelId: todos(params.nivel),
    eixoId: todos(params.eixo),
    setorId: todos(params.setor),
    gestorId: todos(params.gestor),
    status: statusParam === "todos" ? undefined : (statusParam ?? "ativo"),
  };

  const modoPeriodo = primeiro(params.periodo) ?? "atual";
  const periodo = resolverPeriodo(modoPeriodo, primeiro(params.periodoDe), primeiro(params.periodoAte));

  const [
    treinamentosTodos,
    participacoesTodas,
    nrPorColaboradorTodos,
    categorias,
    nrsCatalogo,
    colaboradoresTodos,
    desligamentosTodos,
    colaboradoresAtivos,
    opcoes,
  ] = await Promise.all([
    getTreinamentos(),
    getParticipacoes(),
    getNrPorColaborador(),
    getConfigCategoriasTreinamento(),
    getConfigNrsCatalogo(),
    getColaboradoresDashboard(),
    getDesligamentosDashboard(),
    getColaboradoresAtivos(),
    getOpcoesFormulario(),
  ]);

  function bateFiltrosEstrutura(c: (typeof colaboradoresTodos)[number]) {
    if (filtros.cargoId.length && !filtros.cargoId.includes(c.cargo_id ?? "")) return false;
    if (filtros.nivelId.length && !filtros.nivelId.includes(c.nivel_id ?? "")) return false;
    if (filtros.eixoId.length && !filtros.eixoId.includes(c.eixo_id ?? "")) return false;
    if (filtros.setorId.length && !filtros.setorId.includes(c.setor_id ?? "")) return false;
    if (filtros.gestorId.length && !filtros.gestorId.includes(c.gestor_colaborador_id ?? "")) return false;
    if (filtros.busca && !c.nome.toLowerCase().includes(filtros.busca)) return false;
    return true;
  }

  const idsPermitidos = new Set(
    colaboradoresTodos
      .filter((c) => bateFiltrosEstrutura(c) && (!filtros.status || c.status_rh === filtros.status))
      .map((c) => c.id),
  );

  const participacoesPessoa = participacoesTodas.filter((p) => idsPermitidos.has(p.colaborador_id));
  const participacoesPeriodo = participacoesPessoa.filter(
    (p) => p.data >= periodo.inicio && p.data <= periodo.fim,
  );

  // População elegível para os INDICADORES (aba "Indicadores" apenas — as demais abas,
  // focadas em conformidade de hoje, continuam usando `idsPermitidos`/status_rh atual
  // acima): todo mundo que bate função/nível/eixo/setor/gestor/busca E teve vínculo ativo em
  // ALGUM momento do período selecionado, reconstruído do histórico real de admissão e
  // desligamento — não o status_rh atual. Isso inclui quem foi desligado no meio do período
  // (sem isso, as horas/participação dessa pessoa somem tanto do numerador quanto do
  // denominador da média, mesmo que ela tenha treinado normalmente enquanto esteve ativa).
  const idsEstrutura = new Set(colaboradoresTodos.filter(bateFiltrosEstrutura).map((c) => c.id));
  const desligamentosPorColaborador = agruparDesligamentosPorColaborador(desligamentosTodos);
  const colaboradoresElegiveisNoPeriodo = colaboradoresTodos.filter(
    (c) =>
      idsEstrutura.has(c.id) &&
      estevaAtivoEmAlgumMomento(c, desligamentosPorColaborador.get(c.id) ?? [], periodo.inicio, periodo.fim),
  );
  const participacoesIndicadoresPeriodo = participacoesTodas.filter(
    (p) => idsEstrutura.has(p.colaborador_id) && p.data >= periodo.inicio && p.data <= periodo.fim,
  );
  const participacoesIndicadoresPessoa = participacoesTodas.filter((p) => idsEstrutura.has(p.colaborador_id));

  // Treinamentos obrigatórios (NR) nunca respeitam o filtro de período: a situação de
  // conformidade de cada pessoa sempre olha o curso mais recente dela, não o recorte
  // selecionado na tela — ver InfoBanner da aba NR.
  const nrPorColaboradorPessoa = nrPorColaboradorTodos.filter((n) => idsPermitidos.has(n.colaborador_id));

  const idsTreinamentoComParticipantePessoa = new Set(participacoesPessoa.map((p) => p.treinamento_id));
  const treinamentosGerais = treinamentosTodos
    .filter((t) => t.tipo === "geral")
    .filter((t) => t.data >= periodo.inicio && t.data <= periodo.fim)
    .filter((t) => idsTreinamentoComParticipantePessoa.has(t.id));

  const colaboradoresNoFiltro = colaboradoresTodos
    .filter((c) => idsPermitidos.has(c.id))
    .map((c) => ({ id: c.id, nome: c.nome, setor_nome: c.setor_nome }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Treinamentos</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Indicadores, treinamentos gerais, NR e visão por colaborador.
        </p>
      </div>

      <div className="rounded-lg border border-border bg-card p-4">
        <PeriodoFilter />
      </div>
      <div className="rounded-lg border border-border bg-card p-4">
        <TreinamentosFilters opcoes={opcoes} />
      </div>

      <TreinamentosClient
        treinamentosTodos={treinamentosTodos}
        treinamentosGerais={treinamentosGerais}
        participacoesPeriodo={participacoesPeriodo}
        participacoesIndicadoresPeriodo={participacoesIndicadoresPeriodo}
        participacoesIndicadoresPessoa={participacoesIndicadoresPessoa}
        colaboradoresElegiveisNoPeriodo={colaboradoresElegiveisNoPeriodo}
        nrPorColaboradorPessoa={nrPorColaboradorPessoa}
        categorias={categorias}
        nrsCatalogo={nrsCatalogo}
        colaboradoresAtivos={colaboradoresAtivos}
        colaboradoresNoFiltro={colaboradoresNoFiltro}
        periodoRotulo={periodo.rotulo}
      />
    </div>
  );
}
