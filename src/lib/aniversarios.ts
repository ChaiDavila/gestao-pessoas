const MARCOS_REDONDOS = new Set([5, 10, 15, 20, 25, 30, 35, 40, 45, 50]);

export function mesEDia(dataIso: string) {
  const [, mes, dia] = dataIso.split("-").map(Number);
  return { mes, dia };
}

export function anosCompletadosNoAnoAtual(dataIso: string, anoReferencia: number) {
  const [ano] = dataIso.split("-").map(Number);
  return anoReferencia - ano;
}

export function ehMarcoRedondo(anos: number) {
  return MARCOS_REDONDOS.has(anos);
}

export function ehHoje(dataIso: string, hoje: Date) {
  const { mes, dia } = mesEDia(dataIso);
  return mes === hoje.getMonth() + 1 && dia === hoje.getDate();
}
