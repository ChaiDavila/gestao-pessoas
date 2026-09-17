import { ImportarClient } from "./importar-client";

export default function ImportarColaboradoresPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">
          Importar colaboradores
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Cadastre vários colaboradores de uma vez a partir de uma planilha,
          em vez de preencher a ficha um por um.
        </p>
      </div>

      <ImportarClient />
    </div>
  );
}
