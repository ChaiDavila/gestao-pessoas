import { calcularIdade, formatarData } from "@/lib/date";
import { CampoView, GradeView } from "./campo-visualizacao";

const LABEL_SEXO: Record<string, string> = { M: "Masculino", F: "Feminino" };

type Dados = Record<string, unknown>;

export function DadosCadastraisView({ colaborador }: { colaborador: Dados }) {
  const idade = calcularIdade(colaborador.data_nascimento as string | null);
  const enderecoPartes = [
    colaborador.endereco_rua,
    colaborador.endereco_numero,
    colaborador.endereco_bairro,
    colaborador.endereco_cidade && colaborador.endereco_estado
      ? `${colaborador.endereco_cidade}/${colaborador.endereco_estado}`
      : colaborador.endereco_cidade,
    colaborador.endereco_cep ? `CEP ${colaborador.endereco_cep}` : null,
  ].filter(Boolean);

  return (
    <GradeView>
      <CampoView label="Nome completo" valor={colaborador.nome as string} />
      <CampoView label="Matrícula" valor={colaborador.matricula as string} />
      <CampoView label="CPF" valor={colaborador.cpf as string} />
      <CampoView label="RG" valor={colaborador.rg as string} />
      <CampoView label="PIS/PASEP" valor={colaborador.pis_pasep as string} />
      <CampoView
        label="Data de nascimento"
        valor={
          colaborador.data_nascimento
            ? `${formatarData(colaborador.data_nascimento as string)}${idade != null ? ` (${idade} anos)` : ""}`
            : null
        }
      />
      <CampoView label="Estado civil" valor={colaborador.estado_civil as string} />
      <CampoView
        label="Sexo"
        valor={colaborador.sexo ? LABEL_SEXO[colaborador.sexo as string] : null}
      />
      <CampoView label="E-mail" valor={colaborador.email_pessoal as string} />
      <CampoView label="Telefone pessoal" valor={colaborador.telefone_pessoal as string} />
      <CampoView label="Número corporativo" valor={colaborador.numero_corporativo as string} />
      <CampoView
        label="Cônjuge/companheiro(a)"
        valor={
          colaborador.conjuge_nome
            ? `${colaborador.conjuge_nome}${colaborador.conjuge_sexo ? ` · ${LABEL_SEXO[colaborador.conjuge_sexo as string]}` : ""}`
            : null
        }
      />
      <CampoView
        label="Contato de emergência"
        valor={
          colaborador.contato_emergencia_nome || colaborador.contato_emergencia_telefone
            ? `${colaborador.contato_emergencia_nome ?? "Não informado"} · ${colaborador.contato_emergencia_telefone ?? "Não informado"}`
            : null
        }
        full
      />
      <CampoView
        label="Endereço completo"
        valor={enderecoPartes.length > 0 ? enderecoPartes.join(", ") : null}
        full
      />
    </GradeView>
  );
}
