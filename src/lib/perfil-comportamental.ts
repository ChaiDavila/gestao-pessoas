import type { PerfilComportamentalItem } from "@/lib/data/perfil-comportamental";

// Cores padrão do DISC (mesmas do relatório): D vermelho, I amarelo, S verde, C azul.
export const DISC_CORES = {
  d: "#E6483C",
  i: "#F2C230",
  s: "#4FAE5C",
  c: "#3B8FD4",
} as const;

export type DiscLetra = "d" | "i" | "s" | "c";

// Os 6 continuuns das 12 Forças Impulsionadoras, com o polo esquerdo/direito e a cor do
// relatório — framework fixo, por isso vive aqui como constante, não como catálogo editável.
export const FORCAS_CONTINUUM = [
  {
    titulo: "Conhecimento",
    cor: "#7A1220",
    esquerda: { chave: "forca_instintivo", nome: "Instintivo" },
    direita: { chave: "forca_intelectual", nome: "Intelectual" },
  },
  {
    titulo: "Utilidade",
    cor: "#F0A202",
    esquerda: { chave: "forca_desprendido", nome: "Desprendido" },
    direita: { chave: "forca_eficiente", nome: "Eficiente" },
  },
  {
    titulo: "Ambiente",
    cor: "#6B3FA0",
    esquerda: { chave: "forca_objetivo", nome: "Objetivo" },
    direita: { chave: "forca_harmonioso", nome: "Harmonioso" },
  },
  {
    titulo: "Outros",
    cor: "#13786D",
    esquerda: { chave: "forca_intencional", nome: "Intencional" },
    direita: { chave: "forca_altruista", nome: "Altruísta" },
  },
  {
    titulo: "Poder",
    cor: "#1C1C1C",
    esquerda: { chave: "forca_participante", nome: "Participante" },
    direita: { chave: "forca_comandante", nome: "Comandante" },
  },
  {
    titulo: "Metodologias",
    cor: "#9CA3AF",
    esquerda: { chave: "forca_receptivo", nome: "Receptivo" },
    direita: { chave: "forca_estruturado", nome: "Estruturado" },
  },
] as const satisfies readonly {
  titulo: string;
  cor: string;
  esquerda: { chave: keyof PerfilComportamentalItem; nome: string };
  direita: { chave: keyof PerfilComportamentalItem; nome: string };
}[];

export type ForcaRankeada = {
  chave: string;
  nome: string;
  cor: string;
  valor: number;
  rank: number;
};

// As 12 forças com ranking (1 = maior pontuação) — sempre derivado ordenando as 12
// pontuações na hora de exibir, nunca guardado (ver migration). Quando duas forças
// empatam no mesmo valor arredondado, a pontuação sozinha não diz qual vem primeiro (o
// relatório de origem usa casas decimais que não guardamos) — nesse caso, usa-se a ordem
// de desempate manual registrada em `desempate_forcas`, se houver.
export function ordenarForcas(perfil: PerfilComportamentalItem): ForcaRankeada[] {
  const itens = FORCAS_CONTINUUM.flatMap((continuum) => [
    {
      chave: continuum.esquerda.chave,
      nome: continuum.esquerda.nome,
      cor: continuum.cor,
      valor: Number(perfil[continuum.esquerda.chave]),
    },
    {
      chave: continuum.direita.chave,
      nome: continuum.direita.nome,
      cor: continuum.cor,
      valor: Number(perfil[continuum.direita.chave]),
    },
  ]);

  const posicaoDesempate = new Map(
    (perfil.desempate_forcas ?? []).map((chave, i) => [chave, i]),
  );

  return [...itens]
    .sort((a, b) => {
      if (b.valor !== a.valor) return b.valor - a.valor;
      const posA = posicaoDesempate.get(a.chave);
      const posB = posicaoDesempate.get(b.chave);
      if (posA !== undefined && posB !== undefined) return posA - posB;
      if (posA !== undefined) return -1;
      if (posB !== undefined) return 1;
      return 0;
    })
    .map((item, i) => ({ ...item, rank: i + 1 }));
}

export type GrupoEmpatado = {
  valor: number;
  forcas: ForcaRankeada[];
  // false = a ordem ainda não foi confirmada manualmente (palpite automático); true = já
  // tem um desempate salvo — mesmo assim fica visível, pra dar pra corrigir se foi
  // escolhido errado (ver `resolverEmpateForcas`).
  resolvido: boolean;
};

// Todos os grupos de forças empatadas na mesma pontuação, resolvidos ou não — sempre
// visíveis (não só os pendentes), porque um desempate já salvo pode ter sido escolhido
// errado e precisa continuar dando pra corrigir.
export function gruposEmpatados(perfil: PerfilComportamentalItem): GrupoEmpatado[] {
  const ranking = ordenarForcas(perfil);
  const porValor = new Map<number, ForcaRankeada[]>();
  for (const item of ranking) {
    const grupo = porValor.get(item.valor) ?? [];
    grupo.push(item);
    porValor.set(item.valor, grupo);
  }

  const desempate = new Set(perfil.desempate_forcas ?? []);
  const grupos: GrupoEmpatado[] = [];
  for (const [valor, forcas] of porValor) {
    if (forcas.length < 2) continue;
    const resolvido = forcas.every((f) => desempate.has(f.chave));
    grupos.push({ valor, forcas, resolvido });
  }
  return grupos.sort((a, b) => b.valor - a.valor);
}

export type TracoAlto = { letra: Uppercase<DiscLetra>; cor: string; valor: number };

// Traços "altos" do DISC Natural pro badge compacto da listagem: todo traço acima da linha
// de referência (50) entra, não só o maior — alguém pode ser alto-I e alto-S ao mesmo
// tempo. Sem nenhum acima de 50 (raro), cai pro traço mais alto mesmo assim, pro badge
// nunca ficar vazio.
export function tracosAltos(disc: {
  disc_d: number;
  disc_i: number;
  disc_s: number;
  disc_c: number;
}): TracoAlto[] {
  const todos: TracoAlto[] = [
    { letra: "D", cor: DISC_CORES.d, valor: disc.disc_d },
    { letra: "I", cor: DISC_CORES.i, valor: disc.disc_i },
    { letra: "S", cor: DISC_CORES.s, valor: disc.disc_s },
    { letra: "C", cor: DISC_CORES.c, valor: disc.disc_c },
  ];
  const acimaDaLinha = todos.filter((t) => t.valor > 50).sort((a, b) => b.valor - a.valor);
  if (acimaDaLinha.length > 0) return acimaDaLinha;
  return [[...todos].sort((a, b) => b.valor - a.valor)[0]];
}
