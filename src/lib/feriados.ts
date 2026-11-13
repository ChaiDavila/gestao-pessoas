// Feriados exibidos no calendário do Planejamento: nacionais de data fixa + os que dependem
// da Páscoa (Sexta-feira Santa, Páscoa e Corpus Christi). Calculados para qualquer ano, sem
// cadastro. Carnaval fica de fora por decisão da área de RH.

export type Feriado = { data: string; nome: string };

const FIXOS: [mes: number, dia: number, nome: string][] = [
  [1, 1, "Confraternização Universal"],
  [4, 21, "Tiradentes"],
  [5, 1, "Dia do Trabalho"],
  [9, 7, "Independência do Brasil"],
  [10, 12, "Nossa Senhora Aparecida"],
  [11, 2, "Finados"],
  [11, 15, "Proclamação da República"],
  [11, 20, "Consciência Negra"],
  [12, 25, "Natal"],
];

function iso(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// Domingo de Páscoa (algoritmo de Meeus/Jones/Butcher, calendário gregoriano).
function pascoa(ano: number) {
  const a = ano % 19;
  const b = Math.floor(ano / 100);
  const c = ano % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mes = Math.floor((h + l - 7 * m + 114) / 31);
  const dia = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(ano, mes - 1, dia);
}

function deslocar(base: Date, dias: number) {
  const d = new Date(base);
  d.setDate(d.getDate() + dias);
  return d;
}

const cache = new Map<number, Feriado[]>();

export function feriadosDoAno(ano: number): Feriado[] {
  const salvo = cache.get(ano);
  if (salvo) return salvo;
  const p = pascoa(ano);
  const lista: Feriado[] = [
    ...FIXOS.map(([mes, dia, nome]) => ({ data: iso(new Date(ano, mes - 1, dia)), nome })),
    { data: iso(deslocar(p, -2)), nome: "Sexta-feira Santa" },
    { data: iso(p), nome: "Páscoa" },
    { data: iso(deslocar(p, 60)), nome: "Corpus Christi" },
  ].sort((x, y) => x.data.localeCompare(y.data));
  cache.set(ano, lista);
  return lista;
}

export function feriadosPorData(ano: number) {
  return new Map(feriadosDoAno(ano).map((f) => [f.data, f.nome]));
}
