export function escaparCampoCsv(valor: string) {
  if (/[;"\n]/.test(valor)) {
    return `"${valor.replace(/"/g, '""')}"`;
  }
  return valor;
}

export type ColunaCsv<T> = { rotulo: string; valor: (linha: T) => string };

export function montarCsv<T>(colunas: ColunaCsv<T>[], linhas: T[]) {
  const cabecalho = colunas.map((c) => escaparCampoCsv(c.rotulo)).join(";");
  const corpo = linhas
    .map((linha) => colunas.map((c) => escaparCampoCsv(c.valor(linha))).join(";"))
    .join("\n");
  return "﻿" + cabecalho + "\n" + corpo;
}

/**
 * Parser de CSV tolerante a `;` ou `,` como separador (detecta pela primeira linha),
 * campos entre aspas (com `;`/`,`/quebra de linha/aspas escapadas `""`) e BOM UTF-8.
 */
export function parseCsv(texto: string): string[][] {
  const semBom = texto.replace(/^﻿/, "");
  const primeiraLinha = semBom.slice(0, semBom.search(/\r?\n/) + 1 || semBom.length);
  const separador = (primeiraLinha.match(/;/g)?.length ?? 0) >= (primeiraLinha.match(/,/g)?.length ?? 0) ? ";" : ",";

  const linhas: string[][] = [];
  let linhaAtual: string[] = [];
  let campoAtual = "";
  let dentroDeAspas = false;

  for (let i = 0; i < semBom.length; i++) {
    const char = semBom[i];
    const proximo = semBom[i + 1];

    if (dentroDeAspas) {
      if (char === '"' && proximo === '"') {
        campoAtual += '"';
        i++;
      } else if (char === '"') {
        dentroDeAspas = false;
      } else {
        campoAtual += char;
      }
      continue;
    }

    if (char === '"') {
      dentroDeAspas = true;
    } else if (char === separador) {
      linhaAtual.push(campoAtual);
      campoAtual = "";
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && proximo === "\n") i++;
      linhaAtual.push(campoAtual);
      linhas.push(linhaAtual);
      linhaAtual = [];
      campoAtual = "";
    } else {
      campoAtual += char;
    }
  }
  if (campoAtual !== "" || linhaAtual.length > 0) {
    linhaAtual.push(campoAtual);
    linhas.push(linhaAtual);
  }

  return linhas.filter((linha) => linha.some((c) => c.trim() !== ""));
}
