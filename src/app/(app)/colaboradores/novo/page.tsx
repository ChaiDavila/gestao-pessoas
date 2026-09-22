import { getOpcoesFormulario } from "@/lib/data/colaboradores";
import { exigirAcessoTela } from "@/lib/auth";
import { criarColaborador } from "../actions";
import { ColaboradorForm } from "../colaborador-form";

export default async function NovoColaboradorPage() {
  await exigirAcessoTela("colaboradores");
  const opcoes = await getOpcoesFormulario();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-foreground">
        Novo colaborador
      </h1>
      <ColaboradorForm
        action={criarColaborador}
        opcoes={opcoes}
        textoBotao="Criar colaborador"
      />
    </div>
  );
}
