import Link from "next/link";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/status-badge";
import { getColaboradores, getOpcoesFormulario } from "@/lib/data/colaboradores";
import { ColaboradoresFilters } from "./filters";

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

  const [colaboradores, opcoes] = await Promise.all([
    getColaboradores({
      busca: primeiro(params.busca),
      cargoId: primeiro(params.cargo),
      nivelId: primeiro(params.nivel),
      eixoId: primeiro(params.eixo),
      setorId: primeiro(params.setor),
      gestorId: primeiro(params.gestor),
      status: primeiro(params.status),
    }),
    getOpcoesFormulario(),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            Colaboradores
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {colaboradores.length}{" "}
            {colaboradores.length === 1
              ? "colaborador encontrado"
              : "colaboradores encontrados"}
          </p>
        </div>
        <Button render={<Link href="/colaboradores/novo" />}>
          + Novo colaborador
        </Button>
      </div>

      <div className="rounded-lg border border-border bg-card p-4">
        <ColaboradoresFilters opcoes={opcoes} />
      </div>

      <div className="overflow-x-auto rounded-lg border border-border bg-card">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border bg-muted/40 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Nome</th>
              <th className="px-4 py-3 font-medium">Matrícula</th>
              <th className="px-4 py-3 font-medium">Função</th>
              <th className="px-4 py-3 font-medium">Setor</th>
              <th className="px-4 py-3 font-medium">Gestor</th>
              <th className="px-4 py-3 font-medium">Admissão</th>
              <th className="px-4 py-3 font-medium">Status</th>
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
                    className="font-medium text-foreground hover:text-primary"
                  >
                    {c.nome}
                  </Link>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {c.matricula}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {c.cargo_nome ?? "—"}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {c.setor_nome ?? "—"}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {c.gestor_nome ?? "—"}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {new Date(c.data_admissao + "T00:00:00").toLocaleDateString(
                    "pt-BR",
                  )}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge
                    tone={c.status_rh === "ativo" ? "success" : "neutral"}
                  >
                    {c.status_rh === "ativo" ? "Ativo" : "Desligado"}
                  </StatusBadge>
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
