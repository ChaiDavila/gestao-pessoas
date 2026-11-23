import ExcelJS from "exceljs";
import { formatarData } from "@/lib/date";
import {
  STATUS_LABEL,
  type AcaoPlanejamento,
  type CategoriaPlanejamento,
  type DespesaPlanejamento,
} from "@/lib/planejamento";

const COONTROL_LARANJA = "E84E0F";
const COONTROL_CINZA = "434342";
const FORMATO_MOEDA = '"R$" #,##0.00;[Red]-"R$" #,##0.00';

const TIPO_LABEL: Record<AcaoPlanejamento["tipo"], string> = {
  pontual: "Ação pontual",
  periodo: "Atividade com período",
  verba: "Verba anual",
};

type LinhaRelatorio = {
  acao: AcaoPlanejamento;
  categoria: CategoriaPlanejamento | undefined;
  previsto: number | null;
  realizado: number;
};

// Texto branco em cores escuras, cinza COONTROL em cores claras (legibilidade da célula).
function corDoTexto(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const luminancia = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminancia > 0.6 ? `FF${COONTROL_CINZA}` : "FFFFFFFF";
}

function argb(hex: string | undefined) {
  return `FF${(hex ?? "#7A8594").replace("#", "").toUpperCase()}`;
}

function rotuloData(a: AcaoPlanejamento) {
  if (a.tipo === "verba") return `Ano todo (${a.data_inicio.slice(0, 4)})`;
  return a.data_fim ? `${formatarData(a.data_inicio)} a ${formatarData(a.data_fim)}` : formatarData(a.data_inicio);
}

// Mesmas regras da aba Orçamentos com "Ano inteiro": entram as ações (e verbas) cuja data de
// início é do ano. O realizado acompanha a ação: todas as despesas dela contam, não importa
// a data do pagamento. Canceladas: previsto fora, despesas já lançadas continuam.
function montarLinhas(
  ano: number,
  acoes: AcaoPlanejamento[],
  despesasPorAcao: Map<string, DespesaPlanejamento[]>,
  categoriasPorId: Map<string, CategoriaPlanejamento>,
) {
  const prefixo = `${ano}-`;
  const linhas: LinhaRelatorio[] = [];
  for (const acao of acoes) {
    if (!acao.data_inicio.startsWith(prefixo)) continue;
    const previstoNoAno = acao.status !== "cancelada";
    const realizado = (despesasPorAcao.get(acao.id) ?? []).reduce((s, d) => s + d.valor, 0);
    if (!previstoNoAno && realizado === 0) continue;
    linhas.push({
      acao,
      categoria: categoriasPorId.get(acao.categoria_id),
      previsto: previstoNoAno ? acao.orcamento_previsto : null,
      realizado,
    });
  }
  return linhas.sort(
    (a, b) =>
      (a.categoria?.nome ?? "").localeCompare(b.categoria?.nome ?? "", "pt-BR") ||
      a.acao.data_inicio.localeCompare(b.acao.data_inicio),
  );
}

function cabecalho(planilha: ExcelJS.Worksheet, linha: number, rotulos: string[]) {
  const row = planilha.getRow(linha);
  rotulos.forEach((rotulo, i) => {
    const celula = row.getCell(i + 1);
    celula.value = rotulo;
    celula.font = { bold: true, color: { argb: "FFFFFFFF" } };
    celula.fill = { type: "pattern", pattern: "solid", fgColor: { argb: `FF${COONTROL_LARANJA}` } };
    celula.alignment = { vertical: "middle", wrapText: true };
  });
  row.height = 22;
}

function titulo(planilha: ExcelJS.Worksheet, ultimaColuna: string, texto: string, subtitulo: string) {
  planilha.mergeCells(`A1:${ultimaColuna}1`);
  const t = planilha.getCell("A1");
  t.value = texto;
  t.font = { bold: true, size: 14, color: { argb: `FF${COONTROL_CINZA}` } };
  planilha.getRow(1).height = 22;
  planilha.mergeCells(`A2:${ultimaColuna}2`);
  const s = planilha.getCell("A2");
  s.value = subtitulo;
  s.font = { italic: true, size: 10, color: { argb: `FF${COONTROL_CINZA}` } };
}

function pintarCategoria(celula: ExcelJS.Cell, cor: string | undefined) {
  celula.fill = { type: "pattern", pattern: "solid", fgColor: { argb: argb(cor) } };
  celula.font = { bold: true, color: { argb: corDoTexto(cor ?? "#7A8594") } };
}

export async function gerarOrcamentoXlsx({
  ano,
  filtroCategoria,
  acoes,
  despesas,
  categorias,
}: {
  ano: number;
  filtroCategoria: string | null;
  acoes: AcaoPlanejamento[];
  despesas: DespesaPlanejamento[];
  categorias: CategoriaPlanejamento[];
}) {
  const categoriasPorId = new Map(categorias.map((c) => [c.id, c]));
  const despesasPorAcao = new Map<string, DespesaPlanejamento[]>();
  for (const d of despesas) {
    const lista = despesasPorAcao.get(d.acao_id) ?? [];
    lista.push(d);
    despesasPorAcao.set(d.acao_id, lista);
  }
  const linhas = montarLinhas(ano, acoes, despesasPorAcao, categoriasPorId);
  const rotuloFiltro = filtroCategoria ? ` · categoria ${filtroCategoria}` : "";
  const geradoEm = `Gerado em ${new Date().toLocaleString("pt-BR")}`;

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "COONTROL · Gestão de Pessoas";
  workbook.created = new Date();

  // ---------------------------------------------------------------- Aba 1: Orçamento
  const planilha = workbook.addWorksheet(`Orçamento ${ano}`, { views: [{ state: "frozen", ySplit: 4 }] });
  const colunas = [
    { rotulo: "Categoria", largura: 24 },
    { rotulo: "Ação", largura: 34 },
    { rotulo: "Tipo", largura: 20 },
    { rotulo: "Data", largura: 24 },
    { rotulo: "Status", largura: 14 },
    { rotulo: "Descrição", largura: 50 },
    { rotulo: "Orçamento previsto", largura: 18 },
    { rotulo: "Realizado", largura: 16 },
    { rotulo: "Diferença", largura: 16 },
  ];
  titulo(planilha, "I", `COONTROL · Orçamento do Planejamento de Gente ${ano}`, `${geradoEm}${rotuloFiltro}`);
  cabecalho(planilha, 4, colunas.map((c) => c.rotulo));
  colunas.forEach((c, i) => (planilha.getColumn(i + 1).width = c.largura));
  [7, 8, 9].forEach((i) => (planilha.getColumn(i).numFmt = FORMATO_MOEDA));

  let totalPrevisto = 0;
  let totalRealizado = 0;
  let i = 0;
  while (i < linhas.length) {
    const catId = linhas[i].acao.categoria_id;
    const grupo: LinhaRelatorio[] = [];
    while (i < linhas.length && linhas[i].acao.categoria_id === catId) grupo.push(linhas[i++]);
    const cat = grupo[0].categoria;

    for (const l of grupo) {
      const row = planilha.addRow([
        cat?.nome ?? "Sem categoria",
        l.acao.titulo,
        TIPO_LABEL[l.acao.tipo],
        rotuloData(l.acao),
        l.acao.tipo === "verba" ? "" : STATUS_LABEL[l.acao.status],
        l.acao.descricao ?? "",
        l.previsto ?? "Não informado",
        l.realizado,
        l.previsto !== null ? l.previsto - l.realizado : null,
      ]);
      row.eachCell({ includeEmpty: true }, (celula) => {
        celula.alignment = { vertical: "top", wrapText: true };
      });
      pintarCategoria(row.getCell(1), cat?.cor);
      if (l.previsto === null) {
        row.getCell(7).font = { italic: true, color: { argb: "FF8A8A8A" } };
        row.getCell(7).alignment = { horizontal: "right", vertical: "top" };
      }
    }

    const subPrevisto = grupo.reduce((s, l) => s + (l.previsto ?? 0), 0);
    const subRealizado = grupo.reduce((s, l) => s + l.realizado, 0);
    totalPrevisto += subPrevisto;
    totalRealizado += subRealizado;
    const sub = planilha.addRow([
      `Subtotal ${cat?.nome ?? ""}`,
      "",
      "",
      "",
      "",
      "",
      subPrevisto,
      subRealizado,
      subPrevisto - subRealizado,
    ]);
    sub.eachCell({ includeEmpty: true }, (celula) => {
      celula.font = { bold: true, color: { argb: `FF${COONTROL_CINZA}` } };
      celula.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF2F2F2" } };
    });
    planilha.addRow([]);
  }

  if (linhas.length === 0) {
    planilha.addRow(["Nenhuma ação com orçamento previsto ou despesa neste ano."]);
  } else {
    const total = planilha.addRow([
      "TOTAL GERAL",
      "",
      "",
      "",
      "",
      "",
      totalPrevisto,
      totalRealizado,
      totalPrevisto - totalRealizado,
    ]);
    total.eachCell({ includeEmpty: true }, (celula) => {
      celula.font = { bold: true, color: { argb: "FFFFFFFF" } };
      celula.fill = { type: "pattern", pattern: "solid", fgColor: { argb: `FF${COONTROL_CINZA}` } };
    });
  }

  // ---------------------------------------------------------------- Aba 2: Despesas
  const planDespesas = workbook.addWorksheet("Despesas", { views: [{ state: "frozen", ySplit: 4 }] });
  titulo(
    planDespesas,
    "E",
    `COONTROL · Despesas das ações de ${ano}`,
    `${geradoEm}${rotuloFiltro} · a data é a do pagamento; o valor conta no ano da ação`,
  );
  cabecalho(planDespesas, 4, ["Data do pagamento", "Categoria", "Ação", "Descrição da despesa", "Valor"]);
  [12, 24, 34, 44, 16].forEach((w, k) => (planDespesas.getColumn(k + 1).width = w));
  planDespesas.getColumn(5).numFmt = FORMATO_MOEDA;

  const acoesPorId = new Map(acoes.map((a) => [a.id, a]));
  const despesasDoAno = despesas
    .filter((d) => acoesPorId.get(d.acao_id)?.data_inicio.startsWith(`${ano}-`))
    .sort((a, b) => a.data.localeCompare(b.data));
  for (const d of despesasDoAno) {
    const acao = acoesPorId.get(d.acao_id)!;
    const cat = categoriasPorId.get(acao.categoria_id);
    const row = planDespesas.addRow([formatarData(d.data), cat?.nome ?? "", acao.titulo, d.descricao, d.valor]);
    pintarCategoria(row.getCell(2), cat?.cor);
  }
  if (despesasDoAno.length) {
    const total = planDespesas.addRow(["", "", "", "TOTAL", despesasDoAno.reduce((s, d) => s + d.valor, 0)]);
    total.eachCell({ includeEmpty: true }, (celula) => {
      celula.font = { bold: true, color: { argb: "FFFFFFFF" } };
      celula.fill = { type: "pattern", pattern: "solid", fgColor: { argb: `FF${COONTROL_CINZA}` } };
    });
  } else {
    planDespesas.addRow(["Nenhuma despesa lançada neste ano."]);
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer).toString("base64");
}
