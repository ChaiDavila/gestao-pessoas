"use client";

import { useMemo, useState } from "react";
import { ColaboradorAvatar } from "@/components/colaborador-avatar";
import { StatTile } from "@/components/stat-tile";
import { NativeSelect } from "@/components/native-select";
import { cn } from "@/lib/utils";
import {
  mesEDia,
  anosCompletadosNoAnoAtual,
  ehMarcoRedondo,
  ehHoje,
} from "@/lib/aniversarios";
import type { ColaboradorAniversarioItem } from "@/lib/data/aniversarios";

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

export function AniversariosClient({
  colaboradores,
}: {
  colaboradores: ColaboradorAniversarioItem[];
}) {
  const hoje = useMemo(() => new Date(), []);
  const [mes, setMes] = useState(hoje.getMonth() + 1);

  const aniversariantesNatal = useMemo(() => {
    return colaboradores
      .filter((c) => c.data_nascimento && mesEDia(c.data_nascimento).mes === mes)
      .map((c) => ({
        colaborador: c,
        dia: mesEDia(c.data_nascimento!).dia,
        idade: anosCompletadosNoAnoAtual(c.data_nascimento!, hoje.getFullYear()),
        hoje: ehHoje(c.data_nascimento!, hoje),
      }))
      .sort((a, b) => a.dia - b.dia);
  }, [colaboradores, mes, hoje]);

  const aniversariosEmpresa = useMemo(() => {
    return colaboradores
      .filter((c) => mesEDia(c.data_admissao).mes === mes)
      .map((c) => ({
        colaborador: c,
        dia: mesEDia(c.data_admissao).dia,
        anos: anosCompletadosNoAnoAtual(c.data_admissao, hoje.getFullYear()),
        hoje: ehHoje(c.data_admissao, hoje),
      }))
      .filter((a) => a.anos > 0)
      .sort((a, b) => a.dia - b.dia);
  }, [colaboradores, mes, hoje]);

  // "Hoje" sempre olha a data real de hoje, independente do mês selecionado no filtro.
  const hojeNomes = useMemo(() => {
    const nomes: string[] = [];
    for (const c of colaboradores) {
      if (c.data_nascimento && ehHoje(c.data_nascimento, hoje)) nomes.push(c.nome);
      else if (ehHoje(c.data_admissao, hoje)) nomes.push(c.nome);
    }
    return nomes;
  }, [colaboradores, hoje]);

  return (
    <div className="space-y-8">
      <div className="w-48 space-y-1">
        <label className="text-xs font-medium text-muted-foreground">Mês</label>
        <NativeSelect value={String(mes)} onChange={(e) => setMes(Number(e.target.value))}>
          {MESES.map((nome, i) => (
            <option key={nome} value={i + 1}>
              {nome}
            </option>
          ))}
        </NativeSelect>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatTile
          label={`Aniversariantes em ${MESES[mes - 1]}`}
          valor={String(aniversariantesNatal.length)}
          subtitulo="colaboradores ativos"
          accent
        />
        <StatTile
          label="Aniversários de empresa no mês"
          valor={String(aniversariosEmpresa.length)}
          subtitulo="qualquer quantidade de anos"
        />
        <StatTile
          label="Hoje"
          valor={hojeNomes.length > 0 ? String(hojeNomes.length) : "—"}
          subtitulo={hojeNomes.length > 0 ? hojeNomes.join(", ") : "Nenhum hoje"}
          accent
        />
      </div>

      <section>
        <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-foreground">
          🎂 Aniversariantes do mês
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {aniversariantesNatal.map(({ colaborador, dia, idade, hoje: eHoje }) => (
            <div
              key={colaborador.id}
              className={cn(
                "relative rounded-lg border bg-card p-4",
                eHoje ? "border-primary ring-2 ring-primary/30" : "border-border",
              )}
            >
              <span className="absolute right-3 top-3 rounded-full bg-sidebar px-2 py-0.5 text-xs font-medium text-sidebar-foreground">
                Dia {String(dia).padStart(2, "0")}
              </span>
              <div className="flex items-center gap-3 pr-14">
                <ColaboradorAvatar nome={colaborador.nome} size="md" />
                <div className="min-w-0">
                  <p className="truncate font-medium text-foreground">{colaborador.nome}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {colaborador.cargo_nome ?? "—"}
                  </p>
                </div>
              </div>
              <p className="mt-2 text-xs font-semibold text-primary">
                🎂 Completa {idade} anos
              </p>
              {eHoje && (
                <p className="mt-0.5 text-xs font-semibold text-success">🎉 Hoje!</p>
              )}
            </div>
          ))}
          {aniversariantesNatal.length === 0 && (
            <p className="col-span-full text-sm text-muted-foreground">
              Nenhum aniversariante neste mês.
            </p>
          )}
        </div>
      </section>

      <section>
        <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-foreground">
          🎉 Aniversários de empresa (tempo de casa)
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {aniversariosEmpresa.map(({ colaborador, dia, anos, hoje: eHoje }) => (
            <div
              key={colaborador.id}
              className={cn(
                "relative rounded-lg border bg-card p-4",
                eHoje ? "border-primary ring-2 ring-primary/30" : "border-border",
              )}
            >
              <span className="absolute right-3 top-3 rounded-full bg-sidebar px-2 py-0.5 text-xs font-medium text-sidebar-foreground">
                Dia {String(dia).padStart(2, "0")}
              </span>
              <div className="flex items-center gap-3 pr-14">
                <ColaboradorAvatar nome={colaborador.nome} size="md" />
                <div className="min-w-0">
                  <p className="truncate font-medium text-foreground">{colaborador.nome}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {colaborador.cargo_nome ?? "—"}
                  </p>
                </div>
              </div>
              <p className="mt-2 text-xs font-semibold text-primary">
                🎉 Completa {anos} {anos === 1 ? "ano" : "anos"} de empresa
              </p>
              {ehMarcoRedondo(anos) && (
                <p className="mt-0.5 text-xs font-semibold text-warning">
                  🏆 Marco de {anos} anos
                </p>
              )}
              {eHoje && (
                <p className="mt-0.5 text-xs font-semibold text-success">🎉 Hoje!</p>
              )}
            </div>
          ))}
          {aniversariosEmpresa.length === 0 && (
            <p className="col-span-full text-sm text-muted-foreground">
              Nenhum aniversário de empresa neste mês.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
