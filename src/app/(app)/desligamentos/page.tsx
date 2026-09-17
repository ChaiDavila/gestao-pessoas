import Link from "next/link";
import { ColaboradorAvatar } from "@/components/colaborador-avatar";
import { StatusBadge } from "@/components/status-badge";
import { BotaoRemover } from "@/components/botao-remover";
import { getDesligamentos } from "@/lib/data/desligamentos";
import { formatarData } from "@/lib/date";
import { removerDesligamento } from "./actions";

const TIPO_LABEL: Record<string, string> = {
  voluntario: "Voluntário",
  involuntario: "Involuntário",
};

export default async function DesligamentosPage() {
  const desligamentos = await getDesligamentos();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">
          Desligamentos
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Histórico completo de desligamentos, incluindo os já revertidos por
          reativação.
        </p>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border bg-card">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border bg-muted/40 text-xs uppercase text-muted-foreground">
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
                  {d.descricao ?? "—"}
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
                  <BotaoRemover
                    action={() => removerDesligamento(d.id)}
                    confirmar={
                      d.data_reativacao
                        ? "Remover este registro de desligamento?"
                        : `Remover este desligamento? ${d.colaborador_nome} volta automaticamente para status ativo.`
                    }
                  />
                </td>
              </tr>
            ))}
            {desligamentos.length === 0 && (
              <tr>
                <td
                  colSpan={8}
                  className="px-4 py-10 text-center text-muted-foreground"
                >
                  Nenhum desligamento registrado ainda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
