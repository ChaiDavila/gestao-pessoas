"use client";

import { useActionState, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/native-select";
import {
  ESTADOS_CIVIS,
  REGIMES_TRABALHO,
  SEXOS,
  TIPOS_CONTRATO,
} from "@/lib/constants/rh";
import type { OpcoesFormulario } from "@/lib/data/colaboradores";
import type { FormState } from "./actions";

type Valores = Record<string, string | number | null | undefined>;

type ColaboradorFormProps = {
  action: (prevState: FormState, formData: FormData) => Promise<FormState>;
  opcoes: OpcoesFormulario;
  valoresIniciais?: Valores;
  textoBotao?: string;
  aoSalvar?: () => void;
  aoCancelar?: () => void;
};

const LABEL_SEXO: Record<string, string> = { M: "Masculino", F: "Feminino" };

export function ColaboradorForm({
  action,
  opcoes,
  valoresIniciais,
  textoBotao = "Salvar",
  aoSalvar,
  aoCancelar,
}: ColaboradorFormProps) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const v = valoresIniciais ?? {};
  const [cbo, setCbo] = useState(String(v.cbo ?? ""));

  useEffect(() => {
    if (state && "ok" in state) aoSalvar?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  function aoTrocarCargo(cargoId: string) {
    const cargo = opcoes.cargos.find((c) => c.id === cargoId);
    setCbo(cargo?.cbo ?? "");
  }

  return (
    <form action={formAction} className="space-y-8">
      {state && "error" in state && (
        <p className="rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">
          {state.error}
        </p>
      )}

      <section className="space-y-4 rounded-lg border border-border bg-[#faf9f7] p-4">
        <h2 className="text-sm font-semibold text-foreground">
          Dados cadastrais
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Campo label="Nome completo" name="nome" defaultValue={v.nome} required />
          <Campo
            label="Matrícula"
            name="matricula"
            defaultValue={v.matricula}
            required
          />
          <Campo label="CPF" name="cpf" defaultValue={v.cpf} />
          <Campo
            label="Data de nascimento"
            name="data_nascimento"
            type="date"
            defaultValue={v.data_nascimento}
          />
          <Campo label="RG" name="rg" defaultValue={v.rg} />
          <Campo label="PIS/PASEP" name="pis_pasep" defaultValue={v.pis_pasep} />
          <CampoSelect
            label="Sexo"
            name="sexo"
            defaultValue={v.sexo}
            options={SEXOS.map((s) => ({ value: s, label: LABEL_SEXO[s] }))}
          />
          <CampoSelect
            label="Estado civil"
            name="estado_civil"
            defaultValue={v.estado_civil ?? "Não informado"}
            options={ESTADOS_CIVIS.map((e) => ({ value: e, label: e }))}
          />
          <Campo
            label="Nome do cônjuge"
            name="conjuge_nome"
            defaultValue={v.conjuge_nome}
          />
          <CampoSelect
            label="Sexo do cônjuge"
            name="conjuge_sexo"
            defaultValue={v.conjuge_sexo}
            options={SEXOS.map((s) => ({ value: s, label: LABEL_SEXO[s] }))}
          />
          <Campo
            label="E-mail"
            name="email_pessoal"
            type="email"
            defaultValue={v.email_pessoal}
          />
          <Campo
            label="Telefone pessoal"
            name="telefone_pessoal"
            defaultValue={v.telefone_pessoal}
          />
          <Campo
            label="Número corporativo"
            name="numero_corporativo"
            defaultValue={v.numero_corporativo}
          />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Campo label="Rua" name="endereco_rua" defaultValue={v.endereco_rua} />
          <Campo
            label="Número"
            name="endereco_numero"
            defaultValue={v.endereco_numero}
          />
          <Campo
            label="Complemento"
            name="endereco_complemento"
            defaultValue={v.endereco_complemento}
          />
          <Campo
            label="Bairro"
            name="endereco_bairro"
            defaultValue={v.endereco_bairro}
          />
          <Campo
            label="Cidade"
            name="endereco_cidade"
            defaultValue={v.endereco_cidade}
          />
          <Campo
            label="Estado"
            name="endereco_estado"
            defaultValue={v.endereco_estado}
          />
          <Campo label="CEP" name="endereco_cep" defaultValue={v.endereco_cep} />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Campo
            label="Contato de emergência - nome"
            name="contato_emergencia_nome"
            defaultValue={v.contato_emergencia_nome}
          />
          <Campo
            label="Contato de emergência - telefone"
            name="contato_emergencia_telefone"
            defaultValue={v.contato_emergencia_telefone}
          />
        </div>
      </section>

      <section className="space-y-4 rounded-lg border border-border bg-[#faf9f7] p-4">
        <h2 className="text-sm font-semibold text-foreground">
          Contrato e função
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <CampoSelectOpcoes
            label="Função"
            name="cargo_id"
            defaultValue={v.cargo_id}
            options={opcoes.cargos}
            onChange={aoTrocarCargo}
          />
          <div className="space-y-1.5">
            <Label htmlFor="cbo">CBO</Label>
            <Input
              id="cbo"
              name="cbo"
              value={cbo}
              onChange={(e) => setCbo(e.target.value)}
            />
          </div>
          <CampoSelectOpcoes
            label="Setor"
            name="setor_id"
            defaultValue={v.setor_id}
            options={opcoes.setores}
          />
          <CampoSelectOpcoes
            label="Nível"
            name="nivel_id"
            defaultValue={v.nivel_id}
            options={opcoes.niveis}
          />
          <CampoSelectOpcoes
            label="Eixo"
            name="eixo_id"
            defaultValue={v.eixo_id}
            options={opcoes.eixos}
          />
          <CampoSelectOpcoes
            label="Gestor direto"
            name="gestor_colaborador_id"
            defaultValue={v.gestor_colaborador_id}
            options={opcoes.gestores}
          />
          <Campo
            label="Data de admissão"
            name="data_admissao"
            type="date"
            defaultValue={v.data_admissao}
            required
          />
          <CampoSelect
            label="Tipo de contrato"
            name="tipo_contrato"
            defaultValue={v.tipo_contrato}
            options={TIPOS_CONTRATO.map((t) => ({ value: t, label: t }))}
            required
          />
          <CampoSelect
            label="Regime de trabalho"
            name="regime_trabalho"
            defaultValue={v.regime_trabalho}
            options={REGIMES_TRABALHO.map((t) => ({ value: t, label: t }))}
            required
          />
          <Campo
            label="Salário atual"
            name="salario_atual"
            type="number"
            step="0.01"
            defaultValue={v.salario_atual}
          />
          <Campo
            label="Salário admissional"
            name="salario_admissional"
            type="number"
            step="0.01"
            defaultValue={v.salario_admissional}
          />
        </div>
      </section>

      <div className="flex justify-end gap-3">
        {aoCancelar && (
          <Button type="button" variant="ghost" onClick={aoCancelar}>
            Cancelar
          </Button>
        )}
        <Button type="submit" disabled={pending}>
          {pending ? "Salvando..." : textoBotao}
        </Button>
      </div>
    </form>
  );
}

function Campo({
  label,
  name,
  defaultValue,
  ...props
}: {
  label: string;
  name: string;
  defaultValue?: string | number | null;
} & Omit<React.ComponentProps<typeof Input>, "name" | "defaultValue">) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={name}>{label}</Label>
      <Input
        id={name}
        name={name}
        defaultValue={defaultValue ?? ""}
        {...props}
      />
    </div>
  );
}

function CampoSelect({
  label,
  name,
  defaultValue,
  options,
  required,
}: {
  label: string;
  name: string;
  defaultValue?: string | number | null;
  options: { value: string; label: string }[];
  required?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={name}>{label}</Label>
      <NativeSelect
        id={name}
        name={name}
        defaultValue={defaultValue != null ? String(defaultValue) : ""}
        required={required}
      >
        <option value="">Selecione...</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </NativeSelect>
    </div>
  );
}

function CampoSelectOpcoes({
  label,
  name,
  defaultValue,
  options,
  onChange,
}: {
  label: string;
  name: string;
  defaultValue?: string | number | null;
  options: { id: string; nome: string }[];
  onChange?: (value: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={name}>{label}</Label>
      <NativeSelect
        id={name}
        name={name}
        defaultValue={defaultValue != null ? String(defaultValue) : ""}
        onChange={(e) => onChange?.(e.target.value)}
      >
        <option value="">Nenhum</option>
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.nome}
          </option>
        ))}
      </NativeSelect>
    </div>
  );
}
