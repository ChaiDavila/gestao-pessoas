import { getOpcoesFormulario } from "@/lib/data/colaboradores";
import {
  getColaboradoresDashboard,
  getDesligamentosDashboard,
  getFormacaoAtualTodos,
} from "@/lib/data/dashboard";
import { exigirAcessoTela } from "@/lib/auth";
import { DashboardFilters } from "./filters";
import { DashboardClient } from "./dashboard-client";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function primeiro(valor: string | string[] | undefined) {
  return Array.isArray(valor) ? valor[0] : valor;
}

export default async function DashboardPage({ searchParams }: PageProps) {
  await exigirAcessoTela("dashboard");
  const params = await searchParams;

  const filtros = {
    cargoId: primeiro(params.cargo),
    nivelId: primeiro(params.nivel),
    eixoId: primeiro(params.eixo),
    setorId: primeiro(params.setor),
    gestorId: primeiro(params.gestor),
    status: primeiro(params.status),
    de: primeiro(params.de),
    ate: primeiro(params.ate),
  };

  const [colaboradores, desligamentos, formacaoAtual, opcoes] = await Promise.all([
    getColaboradoresDashboard(),
    getDesligamentosDashboard(),
    getFormacaoAtualTodos(),
    getOpcoesFormulario(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">
          Dashboard de indicadores
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Visão geral de colaboradores, movimentação e folha, calculada a
          partir da base cadastrada.
        </p>
      </div>

      <div className="rounded-lg border border-border bg-card p-4">
        <DashboardFilters opcoes={opcoes} />
      </div>

      <DashboardClient
        colaboradores={colaboradores}
        desligamentos={desligamentos}
        formacaoAtual={formacaoAtual}
        filtros={filtros}
      />
    </div>
  );
}
