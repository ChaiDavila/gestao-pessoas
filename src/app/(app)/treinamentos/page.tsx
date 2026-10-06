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
import { InfoBanner } from "@/components/info-banner";
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

  // Treinamentos realizados (Gerais, Indicadores, Por colaborador) filtram por função/
  // nível/eixo/setor/gestor VIGENTES NA DATA DO TREINAMENTO, não a estrutura atual do
  // colaborador — ex.: quem treinou em Produção e depois mudou pra Serviço continua
  // aparecendo em "Produção" ao filtrar aquele treinamento, não em "Serviço". A view
  // `vw_treinamento_participantes` já resolve isso (ver migration
  // rh_historico_estrutura); aqui só aplicamos o filtro em cima do cargo_id/setor_id/etc.
  // que ela devolve por participação. NR (conformidade) fica de fora de propósito — ver
  // abaixo — e continua usando a estrutura ATUAL via `idsPermitidos`.
  function bateEstruturaParticipacao(p: (typeof participacoesTodas)[number]) {
    if (filtros.cargoId.length && !filtros.cargoId.includes(p.cargo_id ?? "")) return false;
    if (filtros.nivelId.length && !filtros.nivelId.includes(p.nivel_id ?? "")) return false;
    if (filtros.eixoId.length && !filtros.eixoId.includes(p.eixo_id ?? "")) return false;
    if (filtros.setorId.length && !filtros.setorId.includes(p.setor_id ?? "")) return false;
    if (filtros.gestorId.length && !filtros.gestorId.includes(p.gestor_colaborador_id ?? "")) return false;
    if (filtros.busca && !p.colaborador_nome.toLowerCase().includes(filtros.busca)) return false;
    return true;
  }

  const participacoesPessoa = participacoesTodas.filter(
    (p) => bateEstruturaParticipacao(p) && (!filtros.status || p.status_rh === filtros.status),
  );
  const participacoesPeriodo = participacoesPessoa.filter(
    (p) => p.data >= periodo.inicio && p.data <= periodo.fim,
  );

  // População elegível para o DENOMINADOR dos indicadores (aba "Indicadores" apenas): todo
  // mundo que bate função/nível/eixo/setor/gestor/busca (estrutura ATUAL — não há uma única
  // "estrutura histórica" válida pra uma pessoa ao longo de um período inteiro) E teve
  // vínculo ativo em ALGUM momento do período selecionado, reconstruído do histórico real
  // de admissão e desligamento — não o status_rh atual. Isso inclui quem foi desligado no
  // meio do período (sem isso, a participação dessa pessoa some do denominador da média,
  // mesmo que ela tenha treinado normalmente enquanto esteve ativa).
  const idsEstrutura = new Set(colaboradoresTodos.filter(bateFiltrosEstrutura).map((c) => c.id));
  const desligamentosPorColaborador = agruparDesligamentosPorColaborador(desligamentosTodos);
  const colaboradoresElegiveisNoPeriodo = colaboradoresTodos.filter(
    (c) =>
      idsEstrutura.has(c.id) &&
      estevaAtivoEmAlgumMomento(c, desligamentosPorColaborador.get(c.id) ?? [], periodo.inicio, periodo.fim),
  );
  // Numerador dos indicadores: mesma estrutura histórica por participação acima, mas sem o
  // filtro de status (igual ao denominador, pra não sumir com quem foi desligado no meio
  // do período).
  const participacoesIndicadoresPessoa = participacoesTodas.filter(bateEstruturaParticipacao);
  const participacoesIndicadoresPeriodo = participacoesIndicadoresPessoa.filter(
    (p) => p.data >= periodo.inicio && p.data <= periodo.fim,
  );

  // Treinamentos obrigatórios (NR) nunca respeitam o filtro de período, e usam a estrutura
  // ATUAL do colaborador (não a de quando ele fez o curso): a situação de conformidade é
  // sempre sobre quem precisa de quê HOJE — ver InfoBanner da aba NR.
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

      <InfoBanner>
        Nas abas Indicadores, Treinamentos gerais e Por colaborador, os
        filtros de função/nível/eixo/setor/gestor usam a estrutura{" "}
        <strong>vigente na data do treinamento</strong> a partir de
        06/10/2026. Já a aba Treinamentos obrigatórios (NR) sempre usa a
        estrutura atual, pois é sobre quem precisa de quê hoje.
      </InfoBanner>

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
