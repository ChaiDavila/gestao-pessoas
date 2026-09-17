"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ColaboradorAvatar } from "@/components/colaborador-avatar";
import { StatTile } from "@/components/stat-tile";
import { ChartCard } from "@/components/chart-card";
import { BarChart } from "@/components/charts/bar-chart";
import { LineChart } from "@/components/charts/line-chart";
import { DoughnutChart } from "@/components/charts/doughnut-chart";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatarMoeda } from "@/lib/formatacao";
import {
  calcularDashboard,
  anosDeCasaDe,
  type DashboardFiltros,
} from "@/lib/dashboard-indicadores";
import type {
  ColaboradorDashboardItem,
  DesligamentoDashboardItem,
  FormacaoAtualItem,
} from "@/lib/data/dashboard";

export function DashboardClient({
  colaboradores,
  desligamentos,
  formacaoAtual,
  filtros,
}: {
  colaboradores: ColaboradorDashboardItem[];
  desligamentos: DesligamentoDashboardItem[];
  formacaoAtual: FormacaoAtualItem[];
  filtros: DashboardFiltros;
}) {
  const dados = useMemo(
    () => calcularDashboard(colaboradores, desligamentos, formacaoAtual, filtros),
    [colaboradores, desligamentos, formacaoAtual, filtros],
  );

  const [dialogTitulo, setDialogTitulo] = useState<string | null>(null);
  const [dialogColaboradorIds, setDialogColaboradorIds] = useState<string[] | null>(null);
  const [dialogDesligamentoIds, setDialogDesligamentoIds] = useState<string[] | null>(null);
  const [dialogDetalhe, setDialogDetalhe] = useState<Map<string, string> | null>(null);

  function abrirColaboradores(titulo: string, ids: string[], detalhe?: Map<string, string>) {
    setDialogTitulo(titulo);
    setDialogColaboradorIds(ids);
    setDialogDesligamentoIds(null);
    setDialogDetalhe(detalhe ?? null);
  }

  function abrirDesligamentos(titulo: string, ids: string[]) {
    setDialogTitulo(titulo);
    setDialogDesligamentoIds(ids);
    setDialogColaboradorIds(null);
  }

  const colaboradoresMap = useMemo(
    () => new Map(colaboradores.map((c) => [c.id, c])),
    [colaboradores],
  );
  const desligamentosMap = useMemo(
    () => new Map(desligamentos.map((d) => [d.id, d])),
    [desligamentos],
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <StatTile
          label="Colaboradores ativos"
          valor={String(dados.colaboradoresAtivos)}
          subtitulo={`${dados.totalColaboradoresBase} colaboradores na base total`}
          onClick={() => abrirColaboradores("Colaboradores ativos", dados.ativosIds)}
        />
        <StatTile
          label="Folha salarial atual"
          valor={formatarMoeda(dados.folhaSalarial) ?? "R$ 0,00"}
          subtitulo={`Salário médio: ${formatarMoeda(dados.salarioMedio) ?? "—"}`}
          onClick={() =>
            abrirColaboradores(
              "Folha salarial atual",
              dados.ativosIds,
              new Map(dados.ativos.map((c) => [c.id, formatarMoeda(c.salario_atual) ?? "—"])),
            )
          }
        />
        <StatTile
          label="Turnover do ano corrente"
          valor={`${dados.turnoverAnoAtual.toFixed(1)}%`}
          subtitulo={`${dados.desligamentosAnoAtual} desligamento(s) no ano`}
          onClick={() =>
            abrirDesligamentos("Desligamentos no ano corrente", dados.desligamentosAnoAtualIds)
          }
        />
        <StatTile
          label="Tempo médio de casa"
          valor={`${dados.tempoMedioDeCasa.toFixed(1)} anos`}
          subtitulo="Colaboradores ativos"
          onClick={() =>
            abrirColaboradores(
              "Tempo médio de casa",
              dados.ativosIds,
              new Map(
                dados.ativos.map((c) => {
                  const anos = anosDeCasaDe(c.data_admissao);
                  return [c.id, `${anos} ${anos === 1 ? "ano" : "anos"} de empresa`];
                }),
              ),
            )
          }
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard titulo="Admissões x desligamentos por ano">
          <BarChart
            labels={dados.anosOrdenados}
            series={[
              { rotulo: "Admissões", valores: dados.admissoesPorAno },
              { rotulo: "Desligamentos", valores: dados.desligamentosPorAno },
            ]}
            aoClicarBarra={(i) => {
              const ano = dados.anosOrdenados[i];
              const ids = dados.colaboradoresFiltrados
                .filter((c) => c.data_admissao.startsWith(ano))
                .map((c) => c.id);
              abrirColaboradores(`Admitidos em ${ano}`, ids);
            }}
          />
        </ChartCard>

        <ChartCard titulo="Turnover anual (%)">
          <LineChart
            labels={dados.anosOrdenados}
            valores={dados.turnoverPorAno}
            formatarValor={(v) => `${v}%`}
            aoClicarPonto={(i) => {
              const ano = dados.anosOrdenados[i];
              const ids = dados.desligamentosFiltrados
                .filter((d) => d.data.startsWith(ano))
                .map((d) => d.id);
              abrirDesligamentos(`Desligamentos em ${ano}`, ids);
            }}
          />
        </ChartCard>

        <ChartCard titulo="Colaboradores por setor" altura={Math.max(200, dados.porSetor.length * 36)}>
          <BarChart
            horizontal
            labels={dados.porSetor.map((g) => g.chave)}
            valores={dados.porSetor.map((g) => g.valor)}
            aoClicarBarra={(i) => abrirColaboradores(dados.porSetor[i].chave, dados.porSetor[i].ids)}
          />
        </ChartCard>

        <ChartCard titulo="Distribuição por sexo">
          <DoughnutChart
            labels={dados.porSexo.map((g) => g.chave)}
            valores={dados.porSexo.map((g) => g.valor)}
            aoClicarFatia={(i) => abrirColaboradores(dados.porSexo[i].chave, dados.porSexo[i].ids)}
          />
        </ChartCard>

        <ChartCard titulo="Distribuição por faixa etária">
          <BarChart
            labels={dados.porFaixaEtaria.map((g) => g.chave)}
            valores={dados.porFaixaEtaria.map((g) => g.valor)}
            aoClicarBarra={(i) =>
              abrirColaboradores(`Faixa etária ${dados.porFaixaEtaria[i].chave}`, dados.porFaixaEtaria[i].ids)
            }
          />
        </ChartCard>

        <ChartCard titulo="Tempo de empresa">
          <BarChart
            labels={dados.porTempoDeCasa.map((g) => g.chave)}
            valores={dados.porTempoDeCasa.map((g) => g.valor)}
            aoClicarBarra={(i) =>
              abrirColaboradores(`Tempo de empresa: ${dados.porTempoDeCasa[i].chave}`, dados.porTempoDeCasa[i].ids)
            }
          />
        </ChartCard>

        <ChartCard titulo="Formação" altura={Math.max(200, dados.porFormacao.length * 36)}>
          <BarChart
            horizontal
            labels={dados.porFormacao.map((g) => g.chave)}
            valores={dados.porFormacao.map((g) => g.valor)}
            aoClicarBarra={(i) => abrirColaboradores(dados.porFormacao[i].chave, dados.porFormacao[i].ids)}
          />
        </ChartCard>

        <ChartCard titulo="Evolução da folha salarial total">
          <LineChart
            labels={dados.anosOrdenados}
            valores={dados.folhaPorAno}
            formatarValor={(v) => formatarMoeda(v) ?? ""}
          />
        </ChartCard>

        <ChartCard titulo="Desligamentos por tipo">
          <DoughnutChart
            labels={dados.desligamentosPorTipo.map((g) => g.chave)}
            valores={dados.desligamentosPorTipo.map((g) => g.valor)}
            aoClicarFatia={(i) =>
              abrirDesligamentos(dados.desligamentosPorTipo[i].chave, dados.desligamentosPorTipo[i].ids)
            }
          />
        </ChartCard>

        <ChartCard titulo="Desligamentos por motivo" altura={Math.max(200, dados.desligamentosPorMotivo.length * 36)}>
          <BarChart
            horizontal
            labels={dados.desligamentosPorMotivo.map((g) => g.chave)}
            valores={dados.desligamentosPorMotivo.map((g) => g.valor)}
            aoClicarBarra={(i) =>
              abrirDesligamentos(dados.desligamentosPorMotivo[i].chave, dados.desligamentosPorMotivo[i].ids)
            }
          />
        </ChartCard>
      </div>

      <Dialog
        open={dialogTitulo !== null}
        onOpenChange={(v: boolean) => {
          if (!v) {
            setDialogTitulo(null);
            setDialogColaboradorIds(null);
            setDialogDesligamentoIds(null);
            setDialogDetalhe(null);
          }
        }}
      >
        <DialogContent className="max-w-md sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{dialogTitulo}</DialogTitle>
          </DialogHeader>
          <div className="max-h-96 space-y-1 overflow-y-auto">
            {dialogColaboradorIds?.map((id) => {
              const c = colaboradoresMap.get(id);
              if (!c) return null;
              const detalhe = dialogDetalhe?.get(id);
              return (
                <Link
                  key={id}
                  href={`/colaboradores/${id}`}
                  className="flex items-center justify-between gap-3 rounded-md px-2 py-2 text-sm hover:bg-muted"
                >
                  <span className="flex items-center gap-3">
                    <ColaboradorAvatar nome={c.nome} size="sm" />
                    {c.nome}
                  </span>
                  {detalhe && (
                    <span className="text-xs text-muted-foreground">{detalhe}</span>
                  )}
                </Link>
              );
            })}
            {dialogDesligamentoIds?.map((id) => {
              const d = desligamentosMap.get(id);
              if (!d) return null;
              return (
                <Link
                  key={id}
                  href={`/colaboradores/${d.colaborador_id}`}
                  className="flex items-center gap-3 rounded-md px-2 py-2 text-sm hover:bg-muted"
                >
                  <ColaboradorAvatar nome={d.colaborador_nome} size="sm" />
                  <span>
                    {d.colaborador_nome}{" "}
                    <span className="text-muted-foreground">
                      ({new Date(d.data + "T00:00:00").toLocaleDateString("pt-BR")})
                    </span>
                  </span>
                </Link>
              );
            })}
            {(dialogColaboradorIds?.length === 0 || dialogDesligamentoIds?.length === 0) && (
              <p className="px-2 py-2 text-sm text-muted-foreground">Nenhum registro.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
