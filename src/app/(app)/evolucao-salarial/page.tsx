import Link from "next/link";
import { ColaboradorAvatar } from "@/components/colaborador-avatar";
import {
  getOpcoesFormulario,
  getTodosColaboradoresOpcoes,
} from "@/lib/data/colaboradores";
import { getEvolucaoSalarial } from "@/lib/data/evolucao-salarial";
import { formatarData } from "@/lib/date";
import { formatarMoeda } from "@/lib/formatacao";
import { EvolucaoSalarialFilters } from "./filters";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function primeiro(valor: string | string[] | undefined) {
  return Array.isArray(valor) ? valor[0] : valor;
}

export default async function EvolucaoSalarialPage({
  searchParams,
}: PageProps) {
  const params = await searchParams;

  const filtros = {
    busca: primeiro(params.busca),
    colaboradorId: primeiro(params.colaborador),
    cargoId: primeiro(params.cargo),
    nivelId: primeiro(params.nivel),
    eixoId: primeiro(params.eixo),
    setorId: primeiro(params.setor),
    gestorId: primeiro(params.gestor),
    status: primeiro(params.status),
    de: primeiro(params.de),
    ate: primeiro(params.ate),
  };

  const [lancamentos, opcoes, colaboradores] = await Promise.all([
    getEvolucaoSalarial(filtros),
    getOpcoesFormulario(),
    getTodosColaboradoresOpcoes(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">
          Evolução Salarial
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Uma linha por alteração de cargo/salário de todos os colaboradores.
        </p>
      </div>

      <div className="rounded-lg border border-border bg-card p-4">
        <EvolucaoSalarialFilters opcoes={opcoes} colaboradores={colaboradores} />
      </div>

      <div className="overflow-x-auto rounded-lg border border-border bg-card">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border bg-muted/40 text-xs uppercase text-muted-foreground">
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
