import Link from "next/link";
import { ColaboradorAvatar } from "@/components/colaborador-avatar";
import { StatusBadge } from "@/components/status-badge";
import { StatTile } from "@/components/stat-tile";
import { ChartCard } from "@/components/chart-card";
import { BarChart } from "@/components/charts/bar-chart";
import { DoughnutChart } from "@/components/charts/doughnut-chart";
import { InfoBanner } from "@/components/info-banner";
import { getDesligamentos, getTodosDesligamentosHistorico } from "@/lib/data/desligamentos";
import { getMotivosDesligamento } from "@/lib/data/catalogos";
import { getOpcoesFormulario } from "@/lib/data/colaboradores";
import { getColaboradoresDashboard } from "@/lib/data/dashboard";
import { calcularIndicadoresDesligamentos } from "@/lib/desligamentos-indicadores";
import { formatarData, resolverPeriodo } from "@/lib/date";
import { DesligamentosFilters } from "./filters";
import { PeriodoFilter } from "./periodo-filter";
import { BotaoRemoverDesligamento } from "./botao-remover-desligamento";
import { EditarDesligamentoDialog } from "./editar-desligamento-dialog";
import { EvolucaoAnualChart } from "./evolucao-anual-chart";
import { DesligamentosPorSetorChart } from "./desligamentos-por-setor-chart";

const TIPO_LABEL: Record<string, string> = {
  voluntario: "Voluntário",
  involuntario: "Involuntário",
};

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function primeiro(valor: string | string[] | undefined) {
  return Array.isArray(valor) ? valor[0] : valor;
}

export default async function DesligamentosPage({ searchParams }: PageProps) {
  const params = await searchParams;

  const filtros = {
    cargoId: primeiro(params.cargo),
    nivelId: primeiro(params.nivel),
    eixoId: primeiro(params.eixo),
    setorId: primeiro(params.setor),
    gestorId: primeiro(params.gestor),
    status: primeiro(params.status),
    tipo: primeiro(params.tipo),
    motivoId: primeiro(params.motivo),
  };

  const [desligamentos, motivosDesligamento, opcoes, colaboradoresTodos, desligamentosHistorico] =
    await Promise.all([
      getDesligamentos(filtros),
      getMotivosDesligamento(),
      getOpcoesFormulario(),
      getColaboradoresDashboard(),
      getTodosDesligamentosHistorico(),
    ]);

  const primeiraDataAdmissao = colaboradoresTodos.reduce(
    (min, c) => (c.data_admissao < min ? c.data_admissao : min),
    colaboradoresTodos[0]?.data_admissao ?? new Date().toISOString().slice(0, 10),
  );

  const periodo = resolverPeriodo(
    primeiro(params.periodo),
    primeiro(params.periodoDe),
    primeiro(params.periodoAte),
    primeiraDataAdmissao,
  );

  const indicadores = calcularIndicadoresDesligamentos(
    colaboradoresTodos,
    desligamentosHistorico,
    desligamentos,
    {
      cargoId: filtros.cargoId,
      nivelId: filtros.nivelId,
      eixoId: filtros.eixoId,
      setorId: filtros.setorId,
      gestorId: filtros.gestorId,
    },
    periodo,
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">
          Desligamentos
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Registros criados automaticamente ao desativar um colaborador na
          respectiva ficha.
        </p>
      </div>

      <div className="rounded-lg border border-border bg-card p-4">
        <PeriodoFilter />
      </div>

      <div className="rounded-lg border border-border bg-card p-4">
        <DesligamentosFilters opcoes={opcoes} motivos={motivosDesligamento} />
      </div>

      <InfoBanner>
        Estes registros vêm da ação <strong>Desativar</strong>, disponível na
        tela Colaboradores (ação rápida na linha) e na ficha individual. Os
        indicadores e os gráficos abaixo (exceto a evolução anual, que é
        sempre o histórico completo) respeitam o período selecionado acima.
      </InfoBanner>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StatTile
          label="Desligamentos no período"
          valor={String(indicadores.desligamentosNoPeriodo)}
          subtitulo={`Período: ${periodo.rotulo}`}
          accent
        />
        <StatTile
          label="Taxa de desligamento no período"
          valor={indicadores.taxaPeriodo !== null ? `${indicadores.taxaPeriodo.toFixed(1)}%` : "Sem dados"}
          subtitulo={
            indicadores.taxaPeriodo !== null
              ? `${indicadores.desligamentosNoPeriodo} desligamento(s) · HC médio de ${indicadores.headcountMedioPeriodo.toFixed(0)} pessoas`
              : "Não há colaboradores no recorte atual para calcular a taxa"
          }
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard titulo="Evolução anual dos desligamentos">
          <EvolucaoAnualChart dados={indicadores.evolucaoAnual} />
        </ChartCard>

        <ChartCard titulo="Desligamentos por setor" altura={Math.max(200, indicadores.porSetor.length * 40)}>
          {indicadores.porSetor.length > 0 ? (
            <DesligamentosPorSetorChart dados={indicadores.porSetor} />
          ) : (
            <p className="flex h-full items-center justify-center text-center text-sm text-muted-foreground">
              Nenhum desligamento no período selecionado.
            </p>
          )}
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard titulo="Desligamentos por tipo">
          {indicadores.porTipo.length > 0 ? (
            <DoughnutChart
              labels={indicadores.porTipo.map((g) => g.chave)}
              valores={indicadores.porTipo.map((g) => g.valor)}
            />
          ) : (
            <p className="flex h-full items-center justify-center text-center text-sm text-muted-foreground">
              Nenhum desligamento no período selecionado.
            </p>
          )}
        </ChartCard>

        <ChartCard titulo="Desligamentos por motivo" altura={Math.max(200, indicadores.porMotivo.length * 36)}>
          {indicadores.porMotivo.length > 0 ? (
            <BarChart
              horizontal
              labels={indicadores.porMotivo.map((g) => g.chave)}
              valores={indicadores.porMotivo.map((g) => g.valor)}
            />
          ) : (
            <p className="flex h-full items-center justify-center text-center text-sm text-muted-foreground">
              Nenhum desligamento no período selecionado.
            </p>
          )}
        </ChartCard>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border bg-card">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Colaborador</th>
              <th className="px-4 py-3 font-medium">Setor/Função</th>
              <th className="px-4 py-3 font-medium">Data</th>
              <th className="px-4 py-3 font-medium">Tipo</th>
              <th className="px-4 py-3 font-medium">Motivo</th>
              <th className="px-4 py-3 font-medium">Descrição</th>
              <th className="px-4 py-3 font-medium">Situação</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {desligamentos.map((d) => (
              <tr
                key={d.id}
                className="border-b border-border last:border-0 hover:bg-muted/30"
              >
                <td className="px-4 py-3">
                  <Link
                    href={`/colaboradores/${d.colaborador_id}`}
                    className="flex items-center gap-3"
                  >
                    <ColaboradorAvatar nome={d.colaborador_nome} size="sm" />
                    <p className="font-medium text-foreground hover:text-primary">
                      {d.colaborador_nome}
                    </p>
                  </Link>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {[d.setor_nome, d.cargo_nome].filter(Boolean).join(" · ") || "—"}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {formatarData(d.data)}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {TIPO_LABEL[d.tipo] ?? d.tipo}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {d.motivo_nome ?? "—"}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {d.descricao ?? "Sem descrição registrada"}
                </td>
                <td className="px-4 py-3">
                  {d.data_reativacao ? (
                    <StatusBadge tone="success">
                      Reativado em {formatarData(d.data_reativacao)}
                    </StatusBadge>
                  ) : (
                    <StatusBadge tone="neutral">Ainda desligado</StatusBadge>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-1">
                    <EditarDesligamentoDialog
                      desligamentoId={d.id}
                      valoresIniciais={{
                        data: d.data,
                        tipo: d.tipo,
                        motivo_id: d.motivo_id,
                        descricao: d.descricao,
                      }}
                      motivos={motivosDesligamento}
                    />
                    <BotaoRemoverDesligamento
                      desligamentoId={d.id}
                      confirmar={
                        d.data_reativacao
                          ? "Remover este registro de desligamento?"
                          : `Remover este desligamento? ${d.colaborador_nome} volta automaticamente para status ativo.`
                      }
                    />
                  </div>
                </td>
              </tr>
            ))}
            {desligamentos.length === 0 && (
              <tr>
                <td
                  colSpan={8}
                  className="px-4 py-10 text-center text-muted-foreground"
                >
                  Nenhum desligamento encontrado para os filtros selecionados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
