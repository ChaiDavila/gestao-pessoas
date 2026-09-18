export function formatarData(data: string | null | undefined) {
  if (!data) return "—";
  return new Date(data + "T00:00:00").toLocaleDateString("pt-BR");
}

export function calcularIdade(dataNascimento: string | null | undefined) {
  if (!dataNascimento) return null;
  const nascimento = new Date(dataNascimento + "T00:00:00");
  const hoje = new Date();
  let idade = hoje.getFullYear() - nascimento.getFullYear();
  const aindaNaoFezAniversario =
    hoje.getMonth() < nascimento.getMonth() ||
    (hoje.getMonth() === nascimento.getMonth() &&
      hoje.getDate() < nascimento.getDate());
  if (aindaNaoFezAniversario) idade -= 1;
  return idade;
}

export function somarMeses(data: string, meses: number) {
  const d = new Date(data + "T00:00:00");
  d.setMonth(d.getMonth() + meses);
  return d.toISOString().slice(0, 10);
}

export function hojeISO() {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Preenche os anos "vazios" entre o menor e o maior ano encontrado, para que gráficos de
 * tendência por ano tenham um eixo do tempo contínuo (sem pular anos sem nenhum dado, o
 * que deixaria colunas/pontos vizinhos parecendo consecutivos quando na verdade não são).
 */
export function preencherAnosContinuos(anos: Iterable<string>): string[] {
  const numeros = Array.from(anos, Number).filter((a) => !Number.isNaN(a));
  if (numeros.length === 0) return [];
  const min = Math.min(...numeros);
  const max = Math.max(...numeros);
  const completos: string[] = [];
  for (let ano = min; ano <= max; ano++) completos.push(String(ano));
  return completos;
}
