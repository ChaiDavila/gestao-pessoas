export function formatarMoeda(valor: unknown) {
  if (valor == null || valor === "") return null;
  return Number(valor).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}
