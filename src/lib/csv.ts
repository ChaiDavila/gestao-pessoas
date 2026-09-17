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
