// Cliente mínimo pro Bitrix24 via Webhook de entrada — só o método usado hoje
// (tasks.task.add). BITRIX_WEBHOOK_URL nunca deve ir pro browser (por isso este
// arquivo só é importado de rotinas server-side: a rota do cron).
//
// O webhook do Bitrix só aceita o corpo como application/x-www-form-urlencoded, com
// notação de colchetes pra campos aninhados (fields[TITLE]=..., fields[ACCOMPLICES][0]=...)
// — testado manualmente; enviar como JSON dá "Could not find value for parameter {fields}".
export type NovaTarefaBitrix = {
  titulo: string;
  descricao?: string;
  responsavelBitrixId: number;
  corresponsaveisBitrixIds?: number[];
  // Data (YYYY-MM-DD) do próprio evento (aniversário, vencimento de ASO/NR) — vira o prazo
  // da tarefa no Bitrix, sempre às 18h no horário de Brasília (fixo, sem horário de verão).
  prazoData?: string;
};

export async function criarTarefaBitrix(tarefa: NovaTarefaBitrix): Promise<number> {
  const webhookUrl = process.env.BITRIX_WEBHOOK_URL;
  if (!webhookUrl) throw new Error("BITRIX_WEBHOOK_URL não configurada.");

  const params = new URLSearchParams();
  params.append("fields[TITLE]", tarefa.titulo);
  params.append("fields[RESPONSIBLE_ID]", String(tarefa.responsavelBitrixId));
  if (tarefa.descricao) params.append("fields[DESCRIPTION]", tarefa.descricao);
  if (tarefa.prazoData) params.append("fields[DEADLINE]", `${tarefa.prazoData}T18:00:00-03:00`);
  tarefa.corresponsaveisBitrixIds?.forEach((id, i) => {
    params.append(`fields[ACCOMPLICES][${i}]`, String(id));
  });

  const resposta = await fetch(`${webhookUrl}tasks.task.add.json`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  const dados = await resposta.json();
  if (!resposta.ok || dados.error) {
    throw new Error(dados.error_description ?? dados.error ?? "Erro ao criar tarefa no Bitrix.");
  }

  return Number(dados.result.task.id);
}
