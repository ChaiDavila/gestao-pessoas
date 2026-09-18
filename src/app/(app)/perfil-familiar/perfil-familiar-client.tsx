"use client";

import { useMemo, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { StatTile } from "@/components/stat-tile";
import { ChartCard } from "@/components/chart-card";
import { BarChart } from "@/components/charts/bar-chart";
import { ColaboradorAvatar } from "@/components/colaborador-avatar";
import { calcularIdade } from "@/lib/date";
import type {
  ColaboradorFamiliarItem,
  DependenteFamiliarItem,
  PerfilFamiliarFiltros,
} from "@/lib/data/perfil-familiar";
import {
  gerarRelatorioFilhos,
  gerarRelatorioConjuges,
  gerarRelatorioCompleto,
} from "./relatorio-actions";

const LABEL_SEXO: Record<string, string> = { M: "Masculino", F: "Feminino" };

const FAIXAS_ETARIAS: { rotulo: string; min: number; max: number }[] = [
  { rotulo: "Até 2 anos", min: 0, max: 2 },
  { rotulo: "2 a 5", min: 3, max: 5 },
  { rotulo: "6 a 10", min: 6, max: 10 },
  { rotulo: "11 a 18", min: 11, max: 18 },
  { rotulo: "Acima de 18", min: 19, max: 999 },
];

function baixarCsv(conteudo: string, nomeArquivo: string) {
  const blob = new Blob([conteudo], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nomeArquivo;
  a.click();
  URL.revokeObjectURL(url);
}

export function PerfilFamiliarClient({
  colaboradores,
  dependentes,
  filtros,
}: {
  colaboradores: ColaboradorFamiliarItem[];
  dependentes: DependenteFamiliarItem[];
  filtros: PerfilFamiliarFiltros;
}) {
  const [dialogTitulo, setDialogTitulo] = useState<string | null>(null);
  const [dialogLinhas, setDialogLinhas] = useState<string[]>([]);
  const [pending, startTransition] = useTransition();

  const casadosOuUniaoEstavel = colaboradores.filter(
    (c) => c.estado_civil === "Casado(a)" || c.estado_civil === "União estável",
  );
  const comConjugeMulher = colaboradores.filter((c) => c.conjuge_sexo === "F");
  const comConjugeHomem = colaboradores.filter((c) => c.conjuge_sexo === "M");
  const comFilhosCount = new Set(dependentes.map((d) => d.colaborador_id)).size;

  const filhosPorSexo = useMemo(() => {
    const m = dependentes.filter((d) => d.sexo === "M").length;
    const f = dependentes.filter((d) => d.sexo === "F").length;
    return [
      { rotulo: "Meninas", valor: f },
      { rotulo: "Meninos", valor: m },
    ];
  }, [dependentes]);

  const filhosPorFaixa = useMemo(() => {
    return FAIXAS_ETARIAS.map((faixa) => ({
      rotulo: faixa.rotulo,
      valor: dependentes.filter((d) => {
        const idade = calcularIdade(d.data_nascimento);
        return idade != null && idade >= faixa.min && idade <= faixa.max;
      }).length,
    }));
  }, [dependentes]);

  function abrirListaConjuges(titulo: string, lista: ColaboradorFamiliarItem[]) {
    setDialogTitulo(titulo);
    setDialogLinhas(lista.map((c) => `${c.conjuge_nome} — cônjuge de ${c.nome}`));
  }

  function abrirListaSexo(sexo: "M" | "F") {
    const lista = dependentes.filter((d) => d.sexo === sexo);
    setDialogTitulo(`Filhos — ${LABEL_SEXO[sexo]}`);
    setDialogLinhas(
      lista.map(
        (d) =>
          `${d.nome} (${calcularIdade(d.data_nascimento) ?? "?"} anos) — filho(a) de ${d.colaborador_nome}`,
      ),
    );
  }

  function abrirListaFaixa(index: number) {
    const faixa = FAIXAS_ETARIAS[index];
    const lista = dependentes.filter((d) => {
      const idade = calcularIdade(d.data_nascimento);
      return idade != null && idade >= faixa.min && idade <= faixa.max;
    });
    setDialogTitulo(`Filhos — ${faixa.rotulo}`);
    setDialogLinhas(
      lista.map(
        (d) =>
          `${d.nome} (${calcularIdade(d.data_nascimento) ?? "?"} anos) — filho(a) de ${d.colaborador_nome}`,
      ),
    );
  }

  function exportar(gerador: (f: PerfilFamiliarFiltros) => Promise<string>, arquivo: string) {
    startTransition(async () => {
      const csv = await gerador(filtros);
      baixarCsv(csv, arquivo);
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
          Exportar relatório (respeita os filtros acima)
        </p>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            disabled={pending}
            onClick={() => exportar(gerarRelatorioFilhos, "filhos.csv")}
          >
            ↓ Filhos (CSV)
          </Button>
          <Button
            variant="outline"
            disabled={pending}
            onClick={() => exportar(gerarRelatorioConjuges, "conjuges.csv")}
          >
            ↓ Cônjuges (CSV)
          </Button>
          <Button
            variant="outline"
            disabled={pending}
            onClick={() => exportar(gerarRelatorioCompleto, "relacao-completa.csv")}
          >
            ↓ Relação completa (CSV)
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <StatTile
          label="Casados / União estável"
          valor={String(casadosOuUniaoEstavel.length)}
          subtitulo={`de ${colaboradores.length} colaborador(es) no filtro atual`}
        />
        <StatTile
          label="Com cônjuge mulher (esposa)"
          valor={String(comConjugeMulher.length)}
          subtitulo="clique para ver os nomes"
          onClick={() => abrirListaConjuges("Com cônjuge mulher (esposa)", comConjugeMulher)}
        />
        <StatTile
          label="Com cônjuge homem (marido)"
          valor={String(comConjugeHomem.length)}
          subtitulo="clique para ver os nomes"
          onClick={() => abrirListaConjuges("Com cônjuge homem (marido)", comConjugeHomem)}
        />
        <StatTile
          label="Filhos cadastrados"
          valor={String(dependentes.length)}
          subtitulo="no recorte filtrado"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard titulo="Filhos por sexo">
          <BarChart
            labels={filhosPorSexo.map((f) => f.rotulo)}
            valores={filhosPorSexo.map((f) => f.valor)}
            aoClicarBarra={(i) => abrirListaSexo(i === 0 ? "F" : "M")}
          />
        </ChartCard>
        <ChartCard titulo="Filhos por faixa etária">
          <BarChart
            labels={filhosPorFaixa.map((f) => f.rotulo)}
            valores={filhosPorFaixa.map((f) => f.valor)}
            aoClicarBarra={(i) => abrirListaFaixa(i)}
          />
        </ChartCard>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border bg-card">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Colaborador</th>
              <th className="px-4 py-3 font-medium">Setor</th>
              <th className="px-4 py-3 font-medium">Estado civil</th>
              <th className="px-4 py-3 font-medium">Cônjuge / companheiro(a)</th>
              <th className="px-4 py-3 font-medium">Nome do(s) filho(s)</th>
              <th className="px-4 py-3 font-medium">Idade</th>
            </tr>
          </thead>
          <tbody>
            {colaboradores.map((c) => {
              const filhos = dependentes.filter((d) => d.colaborador_id === c.id);
              return (
                <tr key={c.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <ColaboradorAvatar nome={c.nome} size="sm" />
                      <div>
                        <p className="font-medium text-foreground">{c.nome}</p>
                        <p className="text-xs text-muted-foreground">
                          {c.cargo_nome ?? "—"}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {c.setor_nome ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{c.estado_civil}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {c.conjuge_nome ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {filhos.length > 0
                      ? filhos.map((f, i) => (
                          <span key={f.id}>
                            {i > 0 && <br />}
                            {f.nome}
                          </span>
                        ))
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {filhos.length > 0
                      ? filhos.map((f, i) => (
                          <span key={f.id}>
                            {i > 0 && <br />}
                            {calcularIdade(f.data_nascimento) ?? "?"} anos
                          </span>
                        ))
                      : "—"}
                  </td>
                </tr>
              );
            })}
            {colaboradores.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                  Nenhum colaborador encontrado para os filtros selecionados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={dialogTitulo !== null} onOpenChange={(v: boolean) => !v && setDialogTitulo(null)}>
        <DialogContent className="max-w-md sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{dialogTitulo}</DialogTitle>
          </DialogHeader>
          <div className="max-h-96 space-y-1 overflow-y-auto text-sm">
            {dialogLinhas.map((linha, i) => (
              <p key={i} className="border-b border-border py-1.5 last:border-0">
                {linha}
              </p>
            ))}
            {dialogLinhas.length === 0 && (
              <p className="text-muted-foreground">Nenhum registro.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
