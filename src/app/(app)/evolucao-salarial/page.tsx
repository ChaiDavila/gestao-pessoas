import { InfoBanner } from "@/components/info-banner";
import { StatTile } from "@/components/stat-tile";
import { ChartCard } from "@/components/chart-card";
import { BarChart } from "@/components/charts/bar-chart";
import { PeriodoFilter } from "@/components/periodo-filter";
import {
  getOpcoesFormulario,
  getTodosColaboradoresOpcoes,
} from "@/lib/data/colaboradores";
import { getEvolucaoSalarial } from "@/lib/data/evolucao-salarial";
import { getColaboradoresDashboard } from "@/lib/data/dashboard";
import { resolverPeriodo } from "@/lib/date";
import { calcularCrescimentoPorAno } from "@/lib/evolucao-salarial-indicadores";
import { EvolucaoSalarialFilters } from "./filters";
import { CrescimentoFolhaChart } from "./crescimento-chart";
import { LancamentosPorColaborador } from "./lancamentos-por-colaborador";
import { exigirAcessoTela } from "@/lib/auth";

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

function agruparContagem(chaves: string[]) {
  const mapa = new Map<string, number>();
  for (const c of chaves) mapa.set(c, (mapa.get(c) ?? 0) + 1);
  return Array.from(mapa.entries())
    .map(([chave, valor]) => ({ chave, valor }))
    .sort((a, b) => b.valor - a.valor);
}

export default async function EvolucaoSalarialPage({
  searchParams,
}: PageProps) {
  await exigirAcessoTela("evolucao-salarial");
  const params = await searchParams;

  const periodo = resolverPeriodo(
    primeiro(params.periodo),
    primeiro(params.periodoDe),
    primeiro(params.periodoAte),
  );

  const filtros = {
    busca: primeiro(params.busca),
    colaboradorId: todos(params.colaborador),
    cargoId: todos(params.cargo),
    nivelId: todos(params.nivel),
    eixoId: todos(params.eixo),
    setorId: todos(params.setor),
    gestorId: todos(params.gestor),
    status: primeiro(params.status),
    de: periodo.inicio,
    ate: periodo.fim,
  };

  const [lancamentos, opcoes, colaboradores, colaboradoresAtuais] = await Promise.all([
    getEvolucaoSalarial(filtros),
    getOpcoesFormulario(),
    getTodosColaboradoresOpcoes(),
    getColaboradoresDashboard(),
  ]);

  // Cargo/salário ATUAL vêm sempre do cadastro do colaborador (igual à ficha dele), nunca
  // do último lançamento do histórico no recorte filtrado — um lançamento antigo sem
  // salário informado (ex.: só mudança de função) não pode "apagar" o salário atual da
  // pessoa no resumo.
  const colaboradorAtualPorId = new Map(
    colaboradoresAtuais.map((c) => [c.id, { cargoNome: c.cargo_nome, salarioAtual: c.salario_atual }]),
  );

  // Base do gráfico "Crescimento da folha por ano" (ver mais abaixo) — ignora o período
  // (De/Até), igual ao padrão já usado em outros gráficos de tendência por ano, mas
  // respeita os demais filtros.
  const lancamentosSemPeriodo = await getEvolucaoSalarial({
    ...filtros,
    de: undefined,
    ate: undefined,
  });

  const colaboradoresUnicos = new Set(lancamentos.map((l) => l.colaborador_id)).size;
  const promocoes = lancamentos.filter((l) => l.motivo_nome === "Promoção").length;
  const reajustesSindicais = lancamentos.filter((l) => l.motivo_nome === "Reajuste sindicato").length;

  const alteracoesPorMotivo = agruparContagem(
    lancamentos.map((l) => l.motivo_nome ?? "Sem motivo"),
  );

  // Distribuição das alterações: com um único ano no recorte (Ano atual/Ano anterior, ou
  // Personalizado dentro do mesmo ano), "por ano" sempre daria uma barra só — mostra por mês
  // nesse caso. Com vários anos no recorte (Todo o período, ou Personalizado cruzando anos),
  // mantém por ano.
  const periodoEhUmAnoSo = periodo.inicio.slice(0, 4) === periodo.fim.slice(0, 4);
  const distribuicaoTitulo = periodoEhUmAnoSo ? "Alterações por mês" : "Alterações por ano";
  const distribuicaoAlteracoes = periodoEhUmAnoSo
    ? agruparContagem(lancamentos.map((l) => l.data.slice(0, 7))).sort((a, b) =>
        a.chave.localeCompare(b.chave),
      )
    : agruparContagem(lancamentos.map((l) => l.data.slice(0, 4))).sort((a, b) =>
        a.chave.localeCompare(b.chave),
      );
  const distribuicaoRotulos = distribuicaoAlteracoes.map((g) =>
    periodoEhUmAnoSo
      ? new Date(`${g.chave}-01T00:00:00`).toLocaleDateString("pt-BR", {
          month: "short",
          year: "numeric",
        })
      : g.chave,
  );

  const crescimentoPorAno = calcularCrescimentoPorAno(lancamentosSemPeriodo);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">
          Evolução Salarial
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Todas as alterações de função e salário registradas na base, mais
          recentes primeiro.
        </p>
      </div>

      <InfoBanner>
        Os filtros de função/nível/eixo/setor/gestor usam a estrutura{" "}
        <strong>vigente na data da alteração</strong> (não a atual do
        colaborador) a partir de 06/10/2026 — lançamentos anteriores a essa
        data usam o cadastro atual como aproximação.
      </InfoBanner>

      <div className="rounded-lg border border-border bg-card p-4">
        <PeriodoFilter />
      </div>
      <div className="rounded-lg border border-border bg-card p-4">
        <EvolucaoSalarialFilters opcoes={opcoes} colaboradores={colaboradores} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatTile
          label="Alterações registradas"
          valor={String(lancamentos.length)}
          subtitulo={`no ${periodo.rotulo} · ${colaboradoresUnicos} colaborador(es)`}
          accent
        />
        <StatTile
          label="Promoções"
          valor={String(promocoes)}
          subtitulo={`no ${periodo.rotulo}`}
        />
        <StatTile
          label="Reajustes sindicais"
          valor={String(reajustesSindicais)}
          subtitulo={`no ${periodo.rotulo}`}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard titulo="Alterações por motivo">
          <BarChart
            horizontal
            labels={alteracoesPorMotivo.map((g) => g.chave)}
            valores={alteracoesPorMotivo.map((g) => g.valor)}
          />
        </ChartCard>
        <ChartCard titulo={distribuicaoTitulo}>
          <BarChart
            labels={distribuicaoRotulos}
            valores={distribuicaoAlteracoes.map((g) => g.valor)}
          />
        </ChartCard>
      </div>

      <CrescimentoFolhaChart itens={crescimentoPorAno} />

      <LancamentosPorColaborador
        lancamentos={lancamentos}
        colaboradorAtualPorId={colaboradorAtualPorId}
      />
    </div>
  );
}
