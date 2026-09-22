import { getOpcoesFormulario } from "@/lib/data/colaboradores";
import {
  getColaboradoresFamiliar,
  getDependentesFamiliar,
} from "@/lib/data/perfil-familiar";
import { InfoBanner } from "@/components/info-banner";
import { exigirAcessoTela } from "@/lib/auth";
import { PerfilFamiliarFilters } from "./filters";
import { PerfilFamiliarClient } from "./perfil-familiar-client";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function primeiro(valor: string | string[] | undefined) {
  return Array.isArray(valor) ? valor[0] : valor;
}

export default async function PerfilFamiliarPage({ searchParams }: PageProps) {
  await exigirAcessoTela("perfil-familiar");
  const params = await searchParams;

  const filtros = {
    busca: primeiro(params.busca),
    cargoId: primeiro(params.cargo),
    nivelId: primeiro(params.nivel),
    eixoId: primeiro(params.eixo),
    setorId: primeiro(params.setor),
    gestorId: primeiro(params.gestor),
    status: primeiro(params.status),
    estadoCivil: primeiro(params.estadoCivil),
    somenteComFilhos: primeiro(params.comFilhos) === "1",
  };

  const [colaboradores, dependentesTodos, opcoes] = await Promise.all([
    getColaboradoresFamiliar(filtros),
    getDependentesFamiliar(),
    getOpcoesFormulario(),
  ]);

  const idsPermitidos = new Set(colaboradores.map((c) => c.id));
  let dependentes = dependentesTodos.filter((d) => idsPermitidos.has(d.colaborador_id));

  let colaboradoresFinal = colaboradores;
  if (filtros.somenteComFilhos) {
    const comFilhos = new Set(dependentes.map((d) => d.colaborador_id));
    colaboradoresFinal = colaboradores.filter((c) => comFilhos.has(c.id));
    dependentes = dependentes.filter((d) => comFilhos.has(d.colaborador_id));
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">
          Perfil Familiar
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Consulta para ações de endomarketing (aniversários, presentes,
          campanhas direcionadas).
        </p>
      </div>

      <InfoBanner>
        Esta tela reúne informações já cadastradas na ficha de cada
        colaborador (abas &quot;Dados cadastrais&quot; e &quot;Dependentes&quot;) — nada aqui é
        preenchido separadamente. Os indicadores e a tabela abaixo respeitam
        os filtros escolhidos.
      </InfoBanner>

      <div className="rounded-lg border border-border bg-card p-4">
        <PerfilFamiliarFilters opcoes={opcoes} />
      </div>

      <PerfilFamiliarClient
        colaboradores={colaboradoresFinal}
        dependentes={dependentes}
        filtros={filtros}
      />
    </div>
  );
}
