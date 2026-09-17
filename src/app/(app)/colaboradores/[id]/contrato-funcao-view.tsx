import { formatarData } from "@/lib/date";
import { CampoView, GradeView } from "./campo-visualizacao";

type Dados = Record<string, unknown>;

function formatarMoeda(valor: unknown) {
  if (valor == null || valor === "") return null;
  return Number(valor).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function ContratoFuncaoView({ colaborador }: { colaborador: Dados }) {
  return (
    <GradeView>
      <CampoView label="Função" valor={colaborador.cargo_nome as string} />
      <CampoView label="CBO" valor={colaborador.cbo as string} />
      <CampoView label="Setor" valor={colaborador.setor_nome as string} />
      <CampoView label="Nível" valor={colaborador.nivel_nome as string} />
      <CampoView label="Eixo" valor={colaborador.eixo_nome as string} />
      <CampoView label="Gestor direto" valor={colaborador.gestor_nome as string} />
      <CampoView
        label="Data de admissão"
        valor={formatarData(colaborador.data_admissao as string)}
      />
      <CampoView label="Tipo de contrato" valor={colaborador.tipo_contrato as string} />
      <CampoView label="Regime de trabalho" valor={colaborador.regime_trabalho as string} />
      <CampoView label="Salário atual" valor={formatarMoeda(colaborador.salario_atual)} />
      <CampoView
        label="Salário admissional"
        valor={formatarMoeda(colaborador.salario_admissional)}
      />
    </GradeView>
  );
}
