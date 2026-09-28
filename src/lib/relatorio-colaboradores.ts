import ExcelJS from "exceljs";

const COONTROL_LARANJA = "E84E0F";
const COONTROL_CINZA = "434342";

export type CampoRelatorio = {
  chave: string;
  rotulo: string;
  grupo: "Identificação" | "Dados pessoais" | "Contrato e função" | "Outros";
  padrao?: boolean;
  valor: (c: Record<string, unknown>) => string;
};

function texto(v: unknown) {
  return v == null ? "" : String(v);
}

export const CAMPOS_RELATORIO: CampoRelatorio[] = [
  { chave: "nome", rotulo: "Nome", grupo: "Identificação", padrao: true, valor: (c) => texto(c.nome) },
  { chave: "matricula", rotulo: "Matrícula", grupo: "Identificação", valor: (c) => texto(c.matricula) },
  { chave: "cpf", rotulo: "CPF", grupo: "Identificação", valor: (c) => texto(c.cpf) },
  { chave: "rg", rotulo: "RG", grupo: "Identificação", valor: (c) => texto(c.rg) },
  { chave: "pis_pasep", rotulo: "PIS/PASEP", grupo: "Identificação", valor: (c) => texto(c.pis_pasep) },

  { chave: "data_nascimento", rotulo: "Data de nascimento", grupo: "Dados pessoais", padrao: true, valor: (c) => texto(c.data_nascimento) },
  { chave: "sexo", rotulo: "Sexo", grupo: "Dados pessoais", valor: (c) => texto(c.sexo) },
  { chave: "estado_civil", rotulo: "Estado civil", grupo: "Dados pessoais", valor: (c) => texto(c.estado_civil) },
  { chave: "conjuge_nome", rotulo: "Cônjuge", grupo: "Dados pessoais", valor: (c) => texto(c.conjuge_nome) },
  { chave: "email_pessoal", rotulo: "E-mail", grupo: "Dados pessoais", padrao: true, valor: (c) => texto(c.email_pessoal) },
  { chave: "telefone_pessoal", rotulo: "Telefone", grupo: "Dados pessoais", valor: (c) => texto(c.telefone_pessoal) },
  {
    chave: "endereco",
    rotulo: "Endereço completo",
    grupo: "Dados pessoais",
    valor: (c) =>
      [c.endereco_rua, c.endereco_numero, c.endereco_complemento, c.endereco_bairro, c.endereco_cidade, c.endereco_estado, c.endereco_cep]
        .filter(Boolean)
        .join(", "),
  },

  { chave: "cargo_nome", rotulo: "Função", grupo: "Contrato e função", valor: (c) => texto(c.cargo_nome) },
  { chave: "setor_nome", rotulo: "Setor", grupo: "Contrato e função", valor: (c) => texto(c.setor_nome) },
  { chave: "nivel_nome", rotulo: "Nível", grupo: "Contrato e função", valor: (c) => texto(c.nivel_nome) },
  { chave: "eixo_nome", rotulo: "Eixo", grupo: "Contrato e função", valor: (c) => texto(c.eixo_nome) },
  { chave: "gestor_nome", rotulo: "Gestor direto", grupo: "Contrato e função", valor: (c) => texto(c.gestor_nome) },
  { chave: "data_admissao", rotulo: "Data de admissão", grupo: "Contrato e função", valor: (c) => texto(c.data_admissao) },
  { chave: "tipo_contrato", rotulo: "Tipo de contrato", grupo: "Contrato e função", valor: (c) => texto(c.tipo_contrato) },
  { chave: "regime_trabalho", rotulo: "Regime de trabalho", grupo: "Contrato e função", valor: (c) => texto(c.regime_trabalho) },
  { chave: "salario_atual", rotulo: "Salário atual", grupo: "Contrato e função", valor: (c) => texto(c.salario_atual) },

  { chave: "numero_corporativo", rotulo: "Número corporativo", grupo: "Outros", valor: (c) => texto(c.numero_corporativo) },
  { chave: "status_rh", rotulo: "Status", grupo: "Outros", valor: (c) => (c.status_rh === "ativo" ? "Ativo" : "Desligado") },
];

export async function gerarXlsx(
  linhas: Record<string, unknown>[],
  chavesSelecionadas: string[],
) {
  const campos = CAMPOS_RELATORIO.filter((c) => chavesSelecionadas.includes(c.chave));

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "COONTROL — Gestão de Pessoas";
  workbook.created = new Date();

  const planilha = workbook.addWorksheet("Colaboradores", {
    views: [{ state: "frozen", ySplit: 4 }],
  });

  const ultimaColuna = String.fromCharCode(64 + campos.length); // A, B, C...

  planilha.mergeCells(`A1:${ultimaColuna}1`);
  const tituloCelula = planilha.getCell("A1");
  tituloCelula.value = "COONTROL — Relatório de Colaboradores";
  tituloCelula.font = { bold: true, size: 14, color: { argb: `FF${COONTROL_CINZA}` } };
  tituloCelula.alignment = { vertical: "middle" };

  planilha.mergeCells(`A2:${ultimaColuna}2`);
  const subtituloCelula = planilha.getCell("A2");
  subtituloCelula.value = `Gerado em ${new Date().toLocaleString("pt-BR")} · ${linhas.length} colaborador(es)`;
  subtituloCelula.font = { italic: true, size: 10, color: { argb: `FF${COONTROL_CINZA}` } };

  planilha.getRow(1).height = 22;

  const linhaCabecalho = planilha.getRow(4);
  campos.forEach((c, i) => {
    const celula = linhaCabecalho.getCell(i + 1);
    celula.value = c.rotulo;
    celula.font = { bold: true, color: { argb: "FFFFFFFF" } };
    celula.fill = { type: "pattern", pattern: "solid", fgColor: { argb: `FF${COONTROL_LARANJA}` } };
    celula.alignment = { vertical: "middle" };
  });
  linhaCabecalho.height = 20;

  for (const linha of linhas) {
    const valores = campos.map((c) => c.valor(linha));
    const row = planilha.addRow(valores);
    row.eachCell((celula) => {
      celula.alignment = { vertical: "middle" };
    });
  }

  campos.forEach((c, i) => {
    const larguraConteudo = Math.max(
      c.rotulo.length,
      ...linhas.map((linha) => c.valor(linha).length),
    );
    planilha.getColumn(i + 1).width = Math.min(40, Math.max(12, larguraConteudo + 2));
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer).toString("base64");
}
