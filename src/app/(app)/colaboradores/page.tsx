import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ColaboradorAvatar } from "@/components/colaborador-avatar";
import { StatusDot } from "@/components/status-dot";
import { getColaboradores, getOpcoesFormulario } from "@/lib/data/colaboradores";
import { getMotivosDesligamento } from "@/lib/data/catalogos";
import { formatarData } from "@/lib/date";
import { ColaboradoresFilters } from "./filters";
import { RelatorioDialog } from "./relatorio-dialog";
import { AcoesLinha } from "./acoes-linha";

type ColaboradoresPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function primeiro(valor: string | string[] | undefined) {
  return Array.isArray(valor) ? valor[0] : valor;
}

export default async function ColaboradoresPage({
  searchParams,
}: ColaboradoresPageProps) {
  const params = await searchParams;

  const filtros = {
    busca: primeiro(params.busca),
    cargoId: primeiro(params.cargo),
    nivelId: primeiro(params.nivel),
    eixoId: primeiro(params.eixo),
    setorId: primeiro(params.setor),
    gestorId: primeiro(params.gestor),
    status: primeiro(params.status),
  };

  const [colaboradores, opcoes, motivosDesligamento] = await Promise.all([
    getColaboradores(filtros),
    getOpcoesFormulario(),
    getMotivosDesligamento(),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            Colaboradores
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Lista completa da base, com busca e filtros. Clique em um
            colaborador para abrir a ficha completa, ou use as ações rápidas
            para editar, desativar ou reativar.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <RelatorioDialog filtros={filtros} />
          <Button render={<Link href="/colaboradores/novo" />}>
            + Novo colaborador
          </Button>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card p-4">
        <ColaboradoresFilters opcoes={opcoes} />
      </div>

      <div className="overflow-x-auto rounded-lg border border-border bg-card">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border bg-muted/40 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Colaborador</th>
              <th className="px-4 py-3 font-medium">Matrícula</th>
              <th className="px-4 py-3 font-medium">Setor</th>
              <th className="px-4 py-3 font-medium">Admissão</th>
              <th className="px-4 py-3 font-medium">Regime</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {colaboradores.map((c) => (
              <tr
                key={c.id}
                className="border-b border-border last:border-0 hover:bg-muted/30"
              >
                <td className="px-4 py-3">
                  <Link
                    href={`/colaboradores/${c.id}`}
                    className="flex items-center gap-3"
                  >
                    <ColaboradorAvatar nome={c.nome} size="sm" />
                    <div>
                      <p className="font-medium text-foreground hover:text-primary">
                        {c.nome}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {c.cargo_nome ?? "—"}
                      </p>
                    </div>
                  </Link>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {c.matricula}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {c.setor_nome ?? "—"}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {formatarData(c.data_admissao)}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {c.regime_trabalho}
                </td>
                <td className="px-4 py-3">
                  <StatusDot tone={c.status_rh === "ativo" ? "success" : "neutral"}>
                    {c.status_rh === "ativo" ? "Ativo" : "Desligado"}
                  </StatusDot>
                </td>
                <td className="px-4 py-3">
                  <AcoesLinha
                    colaboradorId={c.id}
                    statusRh={c.status_rh}
                    motivos={motivosDesligamento}
                  />
                </td>
              </tr>
            ))}
            {colaboradores.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-10 text-center text-muted-foreground"
                >
                  Nenhum colaborador cadastrado ainda. Clique em “+ Novo
                  colaborador” para começar.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
