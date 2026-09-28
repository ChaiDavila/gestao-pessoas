// Lista estática dos usuários ativos do Bitrix24 da COONTROL, consultada em 2026-09-28.
// Contas de teste/serviço ("Implementação Zopu", "Fernando teste", "Agência Bivox") já
// ficaram de fora. Atualizar manualmente se a equipe no Bitrix mudar (Configurações →
// Integrações → esta lista alimenta o seletor de Responsável/Corresponsável).
export const BITRIX_USUARIOS = [
  { id: 1, nome: "Fernando Luchtenberg" },
  { id: 8, nome: "Bruna Dolzan" },
  { id: 10, nome: "Arthur Espindola" },
  { id: 12, nome: "Thomas Schaefer" },
  { id: 14, nome: "Gabriel Massoco" },
  { id: 16, nome: "Marcelo Benvenutti" },
  { id: 22, nome: "Cristiano dos Reis" },
  { id: 24, nome: "Rodrigo Lorensetti" },
  { id: 26, nome: "Warley Cândido Peixoto Júnior" },
  { id: 38, nome: "Rafael Martins" },
  { id: 40, nome: "Augusto Cesar Rocha Moratelli" },
  { id: 70, nome: "Eduardo Fischer Fronza" },
  { id: 92, nome: "Ruan Jessé Gieseler" },
  { id: 94, nome: "Chaiane Cristina D'Avila" },
  { id: 96, nome: "Ana Paula Cruz" },
  { id: 98, nome: "Rafael Branger" },
  { id: 100, nome: "Felipe Santos de Souza" },
  { id: 102, nome: "Helmuth Berger" },
  { id: 106, nome: "Alessandra Pfleger" },
  { id: 108, nome: "Anderson André Felix" },
  { id: 110, nome: "Cesar Bogo" },
  { id: 112, nome: "Denilson Laucsen da Rosa" },
  { id: 114, nome: "Elvis Vasselai" },
  { id: 116, nome: "Gustavo Gomes Peixoto" },
  { id: 118, nome: "Juan Ramón Prada Sánchez" },
  { id: 120, nome: "Maicon Fabricio Nicolau" },
  { id: 122, nome: "Maurício Cesar Vieira" },
  { id: 124, nome: "Mayra Carolina das Merces Mesquita" },
  { id: 128, nome: "Rafael Filipe Girardi" },
  { id: 130, nome: "Rafaga dos Santos Trentini" },
  { id: 132, nome: "Sofya Bruzadelli Borges Seidler de Andrade" },
  { id: 134, nome: "Samuel Scheffmacher" },
  { id: 148, nome: "Juliano Neves" },
  { id: 182, nome: "Giovani Tonet" },
  { id: 192, nome: "Nathalia Vieira" },
] as const;

export const TIPO_EVENTO_LABEL: Record<string, string> = {
  aniversario_nascimento: "Aniversário (nascimento)",
  aniversario_empresa: "Aniversário de empresa (tempo de casa)",
  aso_vencimento: "ASO/exame complementar a vencer",
  nr_vencimento: "Treinamento de NR a vencer",
};
