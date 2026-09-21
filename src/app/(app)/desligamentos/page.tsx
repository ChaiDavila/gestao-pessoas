import Link from "next/link";
import { ColaboradorAvatar } from "@/components/colaborador-avatar";
import { StatusBadge } from "@/components/status-badge";
import { StatTile } from "@/components/stat-tile";
import { ChartCard } from "@/components/chart-card";
import { LineChart } from "@/components/charts/line-chart";
import { InfoBanner } from "@/components/info-banner";
import { getDesligamentos } from "@/lib/data/desligamentos";
import { getMotivosDesligamento } from "@/lib/data/catalogos";
import { getOpcoesFormulario } from "@/lib/data/colaboradores";
import { getColaboradoresDashboard } from "@/lib/data/dashboard";
import { calcularTurnoverGeral } from "@/lib/desligamentos-indicadores";
import { formatarData } from "@/lib/date";
import { DesligamentosFilters } from "./filters";
import { BotaoRemoverDesligamento } from "./botao-remover-desligamento";
import { EditarDesligamentoDialog } from "./editar-desligamento-dialog";

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

  const [desligamentos, motivosDesligamento, opcoes, colaboradoresTodos] = await Promise.all([
    getDesligamentos(filtros),
    getMotivosDesligamento(),
    getOpcoesFormulario(),
    getColaboradoresDashboard(),
  ]);

  const resumoPorMotivo = motivosDesligamento
    .map((m) => ({
      motivo: m.motivo,
      tipo: m.tipo_padrao,
      ocorrencias: desligamentos.filter((d) => d.motivo_id === m.id).length,
    }))
    .filter((r) => r.ocorrencias > 0)
    .sort((a, b) => b.ocorrencias - a.ocorrencias);

  const turnoverGeral = calcularTurnoverGeral(colaboradoresTodos, desligamentos, {
    cargoId: filtros.cargoId,
    nivelId: filtros.nivelId,
    eixoId: filtros.eixoId,
    setorId: filtros.setorId,
    gestorId: filtros.gestorId,
  });

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

      <InfoBanner>
        Estes registros vêm da ação <strong>Desativar</strong>, disponível na
        tela Colaboradores (ação rápida na linha) e na ficha individual. Ao
        desativar, o RH escolhe um motivo padronizado, que alimenta o resumo
        abaixo e os indicadores de turnover do Dashboard, e pode escrever uma
        descrição livre com o contexto da saída (não entra nos cálculos, é só
        para consulta).
      </InfoBanner>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <StatTile
          label="Taxa de turnover geral"
          valor={`${turnoverGeral.taxaGeral.toFixed(1)}%`}
          subtitulo={`${turnoverGeral.totalDesligamentos} desligamento(s) no filtro atual · headcount médio de ${turnoverGeral.headcountMedio.toFixed(0)} pessoas no período`}
          accent
        />
        <div className="lg:col-span-2">
          <ChartCard titulo="Turnover anual (%)">
            <LineChart
              labels={turnoverGeral.anosOrdenados}
              valores={turnoverGeral.turnoverPorAno}
            />
          </ChartCard>
        </div>
      </div>

      {resumoPorMotivo.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-border bg-card">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Motivo padronizado</th>
                <th className="px-4 py-3 font-medium">Tipo</th>
                <th className="px-4 py-3 font-medium">Ocorrências</th>
              </tr>
            </thead>
            <tbody>
              {resumoPorMotivo.map((r) => (
                <tr key={r.motivo} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 font-medium text-foreground">{r.motivo}</td>
                  <td className="px-4 py-3">
                    <StatusBadge tone={r.tipo === "voluntario" ? "neutral" : "warning"}>
                      {TIPO_LABEL[r.tipo] ?? r.tipo}
                    </StatusBadge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{r.ocorrencias}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="rounded-lg border border-border bg-card p-4">
        <DesligamentosFilters opcoes={opcoes} motivos={motivosDesligamento} />
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
