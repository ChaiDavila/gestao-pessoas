import { getTodosCatalogos, getPgrCompleto } from "@/lib/data/catalogos";
import { getUsuarioAtual } from "@/lib/auth";
import { listarUsuarios } from "./usuarios-actions";
import { ConfiguracoesClient } from "./configuracoes-client";

export default async function ConfiguracoesPage() {
  const usuarioAtual = await getUsuarioAtual();
  const souAdmin = usuarioAtual?.papel === "admin";

  const [catalogos, pgrItens, usuarios] = await Promise.all([
    getTodosCatalogos(),
    getPgrCompleto(),
    souAdmin ? listarUsuarios() : Promise.resolve([]),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">
          Configurações
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Catálogos usados nos formulários e filtros de toda a aplicação.
          Remover um item não apaga cadastros já existentes que o usam —
          só deixa de sugeri-lo em novos cadastros, edições ou filtros.
        </p>
      </div>

      <ConfiguracoesClient
        catalogos={catalogos}
        pgrItens={pgrItens}
        usuarios={usuarios}
        souAdmin={souAdmin}
        usuarioAtualId={usuarioAtual?.id ?? null}
      />
    </div>
  );
}
