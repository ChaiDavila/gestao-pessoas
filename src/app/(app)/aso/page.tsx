import { getAsoColaboradores, getPgrColaboradores } from "@/lib/data/aso";
import { getConfigTiposExame, getExigenciaAso } from "@/lib/data/colaborador-detalhe";
import { getOpcoesFormulario } from "@/lib/data/colaboradores";
import { getColaboradoresDashboard } from "@/lib/data/dashboard";
import { exigirAcessoTela } from "@/lib/auth";
import { AsoFilters } from "./filters";
import { AsoClient } from "./aso-client";

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

export default async function AsoPage({ searchParams }: PageProps) {
  await exigirAcessoTela("aso");
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

  const [asoColaboradoresTodos, pgrColaboradoresTodos, tiposExame, colaboradoresTodos, opcoes, exigenciaAso] =
    await Promise.all([
      getAsoColaboradores(),
      getPgrColaboradores(),
      getConfigTiposExame(),
      getColaboradoresDashboard(),
      getOpcoesFormulario(),
      getExigenciaAso(),
    ]);

  // Tipos de contrato marcados como "não exige ASO" (ex.: PJ, Estágio, por padrão) não
  // entram nem na lista nem nos indicadores desta tela — configurável em Configurações →
  // ASO e PGR, não fixo no código.
  const tiposContratoSemAso = new Set(
    exigenciaAso.filter((e) => !e.exige_aso).map((e) => e.tipo_contrato),
  );

  const idsPermitidos = new Set(
    colaboradoresTodos
      .filter((c) => {
        if (tiposContratoSemAso.has(c.tipo_contrato)) return false;
        if (filtros.cargoId.length && !filtros.cargoId.includes(c.cargo_id ?? "")) return false;
        if (filtros.nivelId.length && !filtros.nivelId.includes(c.nivel_id ?? "")) return false;
        if (filtros.eixoId.length && !filtros.eixoId.includes(c.eixo_id ?? "")) return false;
        if (filtros.setorId.length && !filtros.setorId.includes(c.setor_id ?? "")) return false;
        if (filtros.gestorId.length && !filtros.gestorId.includes(c.gestor_colaborador_id ?? "")) return false;
        if (filtros.status && c.status_rh !== filtros.status) return false;
        if (filtros.busca && !c.nome.toLowerCase().includes(filtros.busca)) return false;
        return true;
      })
      .map((c) => c.id),
  );

  const asoColaboradores = asoColaboradoresTodos.filter((a) => idsPermitidos.has(a.colaborador_id));
  const pgrColaboradores = pgrColaboradoresTodos.filter((p) => idsPermitidos.has(p.colaborador_id));
  const colaboradoresNoFiltro = colaboradoresTodos
    .filter((c) => idsPermitidos.has(c.id))
    .map((c) => ({ id: c.id, nome: c.nome, setor_nome: c.setor_nome, cargo_nome: c.cargo_nome }))
    .sort((a, b) => a.nome.localeCompare(b.nome));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">
          ASO — Atestado de Saúde Ocupacional
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Uma linha por colaborador. Clique no nome para ver ASO, exames
          complementares e periodicidade, sem sair da tela.
        </p>
      </div>

      <div className="rounded-lg border border-border bg-card p-4">
        <AsoFilters opcoes={opcoes} />
      </div>

      <AsoClient
        asoColaboradores={asoColaboradores}
        pgrColaboradores={pgrColaboradores}
        tiposExame={tiposExame}
        colaboradoresNoFiltro={colaboradoresNoFiltro}
      />
    </div>
  );
}
