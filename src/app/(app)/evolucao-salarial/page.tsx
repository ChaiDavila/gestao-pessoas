import Link from "next/link";
import { ColaboradorAvatar } from "@/components/colaborador-avatar";
import { InfoBanner } from "@/components/info-banner";
import { StatTile } from "@/components/stat-tile";
import { ChartCard } from "@/components/chart-card";
import { BarChart } from "@/components/charts/bar-chart";
import {
  getOpcoesFormulario,
  getTodosColaboradoresOpcoes,
} from "@/lib/data/colaboradores";
import { getEvolucaoSalarial } from "@/lib/data/evolucao-salarial";
import { formatarData } from "@/lib/date";
import { formatarMoeda } from "@/lib/formatacao";
import { EvolucaoSalarialFilters } from "./filters";
import { CrescimentoFolhaChart } from "./crescimento-chart";
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

  const filtros = {
    busca: primeiro(params.busca),
    colaboradorId: todos(params.colaborador),
    cargoId: todos(params.cargo),
    nivelId: todos(params.nivel),
    eixoId: todos(params.eixo),
    setorId: todos(params.setor),
    gestorId: todos(params.gestor),
    status: primeiro(params.status),
    de: primeiro(params.de),
    ate: primeiro(params.ate),
  };

  const [lancamentos, opcoes, colaboradores] = await Promise.all([
    getEvolucaoSalarial(filtros),
    getOpcoesFormulario(),
    getTodosColaboradoresOpcoes(),
  ]);

  // "Crescimento da folha por ano" ignora o período (De/Até), igual ao padrão já usado em
  // outros gráficos de tendência por ano — mas respeita os demais filtros.
  const lancamentosSemPeriodo = await getEvolucaoSalarial({
    ...filtros,
    de: undefined,
    ate: undefined,
  });

  const colaboradoresUnicos = new Set(lancamentos.map((l) => l.colaborador_id)).size;
  const promocoes = lancamentos.filter((l) => l.motivo_nome === "Promoção").length;
  const reajustesGerais = lancamentos.filter((l) => l.motivo_nome === "Reajuste geral").length;
  const comAumentoPercentual = lancamentos.filter(
    (l) => l.salario_anterior && Number(l.salario_anterior) > 0 && l.salario_novo != null,
  );
  const aumentoMedio =
    comAumentoPercentual.length > 0
      ? comAumentoPercentual.reduce(
          (s, l) =>
            s +
            ((Number(l.salario_novo) - Number(l.salario_anterior)) /
              Number(l.salario_anterior)) *
              100,
          0,
        ) / comAumentoPercentual.length
      : 0;

  const alteracoesPorMotivo = agruparContagem(
    lancamentos.map((l) => l.motivo_nome ?? "Sem motivo"),
  );
  const alteracoesPorAno = agruparContagem(
    lancamentos.map((l) => l.data.slice(0, 4)),
  ).sort((a, b) => a.chave.localeCompare(b.chave));

  const crescimentoPorAno = new Map<string, { soma: number; qtd: number }>();
  for (const l of lancamentosSemPeriodo) {
    if (!l.salario_anterior || Number(l.salario_anterior) <= 0 || l.salario_novo == null) continue;
    const ano = l.data.slice(0, 4);
    const pct =
      ((Number(l.salario_novo) - Number(l.salario_anterior)) / Number(l.salario_anterior)) * 100;
    const atual = crescimentoPorAno.get(ano) ?? { soma: 0, qtd: 0 };
    crescimentoPorAno.set(ano, { soma: atual.soma + pct, qtd: atual.qtd + 1 });
  }
  const anosCrescimento = Array.from(crescimentoPorAno.keys()).sort();
  const crescimentoValores = anosCrescimento.map((ano) => {
    const { soma, qtd } = crescimentoPorAno.get(ano)!;
    return Math.round((soma / qtd) * 10) / 10;
  });

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
        O período (De/Até) filtra pela <strong>data da alteração</strong> de
        cargo/salário — os demais filtros continuam se referindo aos dados
        atuais do colaborador.
      </InfoBanner>

      <div className="rounded-lg border border-border bg-card p-4">
        <EvolucaoSalarialFilters opcoes={opcoes} colaboradores={colaboradores} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <StatTile
          label="Alterações registradas"
          valor={String(lancamentos.length)}
          subtitulo={`${colaboradoresUnicos} colaborador(es) no filtro atual`}
          accent
        />
        <StatTile
          label="Promoções"
          valor={String(promocoes)}
          subtitulo="no recorte filtrado"
        />
        <StatTile
          label="Reajustes gerais"
          valor={String(reajustesGerais)}
          subtitulo="no recorte filtrado"
        />
        <StatTile
          label="Aumento médio por alteração"
          valor={`${aumentoMedio.toFixed(1)}%`}
          subtitulo="variação média de salário por registro"
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
        <ChartCard titulo="Alterações por ano">
          <BarChart
            labels={alteracoesPorAno.map((g) => g.chave)}
            valores={alteracoesPorAno.map((g) => g.valor)}
          />
        </ChartCard>
      </div>

      <CrescimentoFolhaChart labels={anosCrescimento} valores={crescimentoValores} />

      <div className="overflow-x-auto rounded-lg border border-border bg-card">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Colaborador</th>
              <th className="px-4 py-3 font-medium">Data</th>
              <th className="px-4 py-3 font-medium">Cargo anterior</th>
              <th className="px-4 py-3 font-medium">Cargo novo</th>
              <th className="px-4 py-3 font-medium">Salário anterior</th>
              <th className="px-4 py-3 font-medium">Salário novo</th>
              <th className="px-4 py-3 font-medium">Motivo</th>
            </tr>
          </thead>
          <tbody>
            {lancamentos.map((l) => (
              <tr
                key={l.id}
                className="border-b border-border last:border-0 hover:bg-muted/30"
              >
                <td className="px-4 py-3">
                  <Link
                    href={`/colaboradores/${l.colaborador_id}`}
                    className="flex items-center gap-3"
                  >
                    <ColaboradorAvatar nome={l.colaborador_nome} size="sm" />
                    <p className="font-medium text-foreground hover:text-primary">
                      {l.colaborador_nome}
                    </p>
                  </Link>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {formatarData(l.data)}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {l.cargo_anterior ?? "—"}
                </td>
                <td className="px-4 py-3">{l.cargo_novo ?? "—"}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  {formatarMoeda(l.salario_anterior) ?? "—"}
                </td>
                <td className="px-4 py-3 font-medium text-foreground">
                  {formatarMoeda(l.salario_novo) ?? "—"}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {l.motivo_nome ?? "—"}
                </td>
              </tr>
            ))}
            {lancamentos.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-10 text-center text-muted-foreground"
                >
                  Nenhum lançamento de evolução salarial encontrado para os
                  filtros selecionados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
