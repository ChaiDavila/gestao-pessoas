"use client";

import { useActionState, useRef } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { StatusBadge } from "@/components/status-badge";
import { importarColaboradores } from "./actions";

const CABECALHO_MODELO = [
  "nome",
  "matricula",
  "cpf",
  "data_nascimento",
  "rg",
  "pis_pasep",
  "sexo",
  "estado_civil",
  "conjuge_nome",
  "conjuge_sexo",
  "email",
  "telefone_pessoal",
  "numero_corporativo",
  "endereco_rua",
  "endereco_numero",
  "endereco_complemento",
  "endereco_bairro",
  "endereco_cidade",
  "endereco_estado",
  "endereco_cep",
  "contato_emergencia_nome",
  "contato_emergencia_telefone",
  "cargo",
  "cbo",
  "setor",
  "nivel",
  "eixo",
  "matricula_gestor",
  "data_admissao",
  "tipo_contrato",
  "regime_trabalho",
  "salario_atual",
  "salario_admissional",
];

const LINHA_EXEMPLO = [
  "Maria da Silva",
  "1001",
  "123.456.789-00",
  "1990-04-12",
  "",
  "",
  "F",
  "Casado(a)",
  "",
  "",
  "maria@exemplo.com",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "Operador de Caldeira",
  "",
  "Produção",
  "Iniciante",
  "",
  "",
  "2024-03-01",
  "CLT",
  "Presencial",
  "3500,00",
  "3200,00",
];

function baixarModelo() {
  const conteudo =
    "﻿" + CABECALHO_MODELO.join(";") + "\n" + LINHA_EXEMPLO.join(";") + "\n";
  const blob = new Blob([conteudo], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "modelo-importacao-colaboradores.csv";
  a.click();
  URL.revokeObjectURL(url);
}

export function ImportarClient() {
  const [state, formAction, pending] = useActionState(importarColaboradores, undefined);
  const formRef = useRef<HTMLFormElement>(null);

  const resultados = state && "resultados" in state ? state.resultados : null;
  const totalOk = resultados?.filter((r) => r.status === "ok").length ?? 0;
  const totalErro = resultados?.filter((r) => r.status === "erro").length ?? 0;

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-border bg-card p-4">
        <h2 className="text-sm font-semibold text-foreground">1. Baixe o modelo</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          O modelo já vem com as colunas certas e uma linha de exemplo. Só as
          colunas <strong>nome</strong>, <strong>matricula</strong>,{" "}
          <strong>data_admissao</strong>, <strong>tipo_contrato</strong> e{" "}
          <strong>regime_trabalho</strong> são obrigatórias — as demais podem
          ficar em branco. Cargo, setor, nível e eixo são criados
          automaticamente em Configurações se o nome ainda não existir.
          "matricula_gestor" é opcional e deve conter a matrícula de outro
          colaborador (que já exista na base ou apareça antes no mesmo
          arquivo).
        </p>
        <Button type="button" variant="outline" className="mt-3" onClick={baixarModelo}>
          ↓ Baixar modelo CSV
        </Button>
      </div>

      <div className="rounded-lg border border-border bg-card p-4">
        <h2 className="text-sm font-semibold text-foreground">2. Envie o arquivo preenchido</h2>
        <form
          ref={formRef}
          action={formAction}
          className="mt-3 flex flex-wrap items-end gap-3"
        >
          {state && "error" in state && (
            <p className="w-full rounded-md bg-danger-bg px-3 py-2 text-sm text-danger">
              {state.error}
            </p>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="arquivo">Arquivo CSV</Label>
            <input
              id="arquivo"
              name="arquivo"
              type="file"
              accept=".csv,text/csv"
              required
              className="block text-sm text-foreground file:mr-3 file:rounded-md file:border file:border-border file:bg-secondary file:px-3 file:py-1.5 file:text-sm file:font-medium"
            />
          </div>
          <Button type="submit" disabled={pending}>
            {pending ? "Importando..." : "Importar"}
          </Button>
        </form>
      </div>

      {resultados && (
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-foreground">Resultado da importação</h2>
            <div className="flex gap-2 text-sm">
              <StatusBadge tone="success">{totalOk} cadastrado(s)</StatusBadge>
              {totalErro > 0 && <StatusBadge tone="danger">{totalErro} com erro</StatusBadge>}
            </div>
          </div>

          <div className="mt-4 overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 font-medium">Linha</th>
                  <th className="px-3 py-2 font-medium">Nome</th>
                  <th className="px-3 py-2 font-medium">Situação</th>
                  <th className="px-3 py-2 font-medium">Mensagem</th>
                </tr>
              </thead>
              <tbody>
                {resultados.map((r) => (
                  <tr key={r.linha} className="border-b border-border last:border-0">
                    <td className="px-3 py-2 text-muted-foreground">{r.linha}</td>
                    <td className="px-3 py-2 font-medium text-foreground">{r.nome}</td>
                    <td className="px-3 py-2">
                      <StatusBadge tone={r.status === "ok" ? "success" : "danger"}>
                        {r.status === "ok" ? "Cadastrado" : "Erro"}
                      </StatusBadge>
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">{r.mensagem}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalOk > 0 && (
            <div className="mt-4">
              <Link href="/colaboradores" className="text-sm font-medium text-primary hover:underline">
                Ver colaboradores cadastrados →
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
