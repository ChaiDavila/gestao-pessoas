import { formatarData } from "@/lib/date";
import type { HistoricoEstruturaRow } from "@/lib/data/colaborador-detalhe";

// Data da migration que criou rh.historico_estrutura_organizacional e gerou o
// registro baseline (vigência = data da migration) pra cada colaborador já cadastrado.
const DATA_INICIO_RASTREAMENTO = "2026-10-06";

type Mudanca = {
  dataVigencia: string;
  campo: string;
  anterior: string;
  novo: string;
  inicial: boolean;
};

function valorOuTraco(nome: string | null) {
  return nome ?? "—";
}

function montarMudancas(historico: HistoricoEstruturaRow[]): Mudanca[] {
  const mudancas: Mudanca[] = [];
  let anterior: HistoricoEstruturaRow | null = null;

  for (const atual of historico) {
    if (!anterior) {
      mudancas.push({
        dataVigencia: atual.data_vigencia,
        campo: "Cadastro inicial",
        anterior: "—",
        novo: [atual.cargo_nome, atual.setor_nome].filter(Boolean).join(" · ") || "—",
        inicial: true,
      });
    } else {
      const campos: { nome: string; antesId: string | null; antesNome: string | null; depoisId: string | null; depoisNome: string | null }[] = [
        { nome: "Função", antesId: anterior.cargo_id, antesNome: anterior.cargo_nome, depoisId: atual.cargo_id, depoisNome: atual.cargo_nome },
        { nome: "Nível", antesId: anterior.nivel_id, antesNome: anterior.nivel_nome, depoisId: atual.nivel_id, depoisNome: atual.nivel_nome },
        { nome: "Eixo", antesId: anterior.eixo_id, antesNome: anterior.eixo_nome, depoisId: atual.eixo_id, depoisNome: atual.eixo_nome },
        { nome: "Setor", antesId: anterior.setor_id, antesNome: anterior.setor_nome, depoisId: atual.setor_id, depoisNome: atual.setor_nome },
        { nome: "Gestor", antesId: anterior.gestor_colaborador_id, antesNome: anterior.gestor_nome, depoisId: atual.gestor_colaborador_id, depoisNome: atual.gestor_nome },
      ];
      for (const c of campos) {
        if (c.antesId !== c.depoisId) {
          mudancas.push({
            dataVigencia: atual.data_vigencia,
            campo: c.nome,
            anterior: valorOuTraco(c.antesNome),
            novo: valorOuTraco(c.depoisNome),
            inicial: false,
          });
        }
      }
    }
    anterior = atual;
  }

  return mudancas.reverse();
}

export function MovimentacoesTab({
  historico,
  dataAdmissao,
}: {
  historico: HistoricoEstruturaRow[];
  dataAdmissao: string | null;
}) {
  const mudancas = montarMudancas(historico);
  // Só falta histórico de verdade se o colaborador já trabalhava aqui antes da migration
  // que criou esse rastreamento — o registro baseline (vigência = data da migration) não
  // reflete uma mudança real, só o estado em que a pessoa estava naquele dia.
  const semRastreamentoAnterior = Boolean(dataAdmissao) && dataAdmissao! < DATA_INICIO_RASTREAMENTO;

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        Mudanças de função, nível, eixo, setor e gestor, com a data em que
        passaram a valer. Toda edição feita em &quot;Contrato e função&quot;
        gera uma linha nova aqui automaticamente.
      </p>
      {semRastreamentoAnterior && (
        <p className="rounded-lg border border-dashed border-border bg-muted/30 px-4 py-2 text-xs text-muted-foreground">
          O rastreamento desse histórico começou em {formatarData(DATA_INICIO_RASTREAMENTO)}.
          Mudanças de função/nível/eixo/setor/gestor anteriores a essa data não
          ficaram registradas e não aparecem aqui.
        </p>
      )}
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-2 font-medium">Vigência</th>
              <th className="px-4 py-2 font-medium">Campo</th>
              <th className="px-4 py-2 font-medium">Anterior</th>
              <th className="px-4 py-2 font-medium">Novo</th>
            </tr>
          </thead>
          <tbody>
            {mudancas.map((m, i) => (
              <tr key={i} className="border-b border-border last:border-0">
                <td className="px-4 py-2 text-muted-foreground">{formatarData(m.dataVigencia)}</td>
                <td className="px-4 py-2">{m.campo}</td>
                <td className="px-4 py-2 text-muted-foreground">{m.anterior}</td>
                <td className="px-4 py-2 font-medium">{m.novo}</td>
              </tr>
            ))}
            {mudancas.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-muted-foreground">
                  Nenhuma movimentação registrada.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
