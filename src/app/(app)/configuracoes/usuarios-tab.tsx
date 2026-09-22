"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/native-select";
import { BotaoRemover } from "@/components/botao-remover";
import { PainelAdicionar } from "@/components/painel-adicionar";
import { formatarData } from "@/lib/date";
import type { PapelRh } from "@/lib/auth";
import type { UsuarioArea, UsuarioFormState } from "./usuarios-actions";
import {
  criarUsuario,
  atualizarPapelUsuario,
  removerAcessoUsuario,
} from "./usuarios-actions";

const PAPEL_LABEL: Record<PapelRh, string> = {
  leitor: "Leitor",
  operador: "Operador",
  gestor: "Gestor",
  admin: "Admin",
};

const PAPEIS: PapelRh[] = ["leitor", "operador", "gestor", "admin"];

export function UsuariosTab({ usuarios }: { usuarios: UsuarioArea[] }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-foreground">
            Quem tem acesso
          </h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            "Remover" tira o acesso a RH — a conta continua existindo (pode
            ser reaproveitada por outra área da COONTROL no futuro).
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
          {usuarios.length}
        </span>
      </div>

      <div className="mb-3">
        <PainelAdicionar rotulo="+ Novo usuário">
          {(fechar) => <FormularioNovoUsuario aoSalvar={fechar} />}
        </PainelAdicionar>
      </div>

      <div className="overflow-x-auto rounded-md border border-border">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-3 py-2 font-medium">E-mail</th>
              <th className="px-3 py-2 font-medium">Papel</th>
              <th className="px-3 py-2 font-medium">Desde</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {usuarios.map((u) => (
              <LinhaUsuario key={u.usuarioId} usuario={u} />
            ))}
            {usuarios.length === 0 && (
              <tr>
                <td colSpan={4} className="px-3 py-6 text-center text-muted-foreground">
                  Nenhum usuário cadastrado ainda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function LinhaUsuario({ usuario }: { usuario: UsuarioArea }) {
  const [papel, setPapel] = useState(usuario.papel);
  const [pending, startTransition] = useTransition();

  function aoTrocarPapel(novoPapel: string) {
    setPapel(novoPapel as PapelRh);
    startTransition(() => {
      atualizarPapelUsuario(usuario.usuarioId, novoPapel);
    });
  }

  return (
    <tr className="border-b border-border last:border-0">
      <td className="px-3 py-2 text-foreground">{usuario.email}</td>
      <td className="px-3 py-2">
        <NativeSelect
          value={papel}
          onChange={(e) => aoTrocarPapel(e.target.value)}
          disabled={pending}
          className="w-36"
        >
          {PAPEIS.map((p) => (
            <option key={p} value={p}>
              {PAPEL_LABEL[p]}
            </option>
          ))}
        </NativeSelect>
      </td>
      <td className="px-3 py-2 text-muted-foreground">
        {formatarData(usuario.criadoEm.slice(0, 10))}
      </td>
      <td className="px-3 py-2 text-right">
        <BotaoRemover
          action={() => removerAcessoUsuario(usuario.usuarioId)}
          confirmar={`Remover o acesso de ${usuario.email}? A conta continua existindo, só perde o acesso ao RH.`}
        />
      </td>
    </tr>
  );
}

function FormularioNovoUsuario({ aoSalvar }: { aoSalvar: () => void }) {
  const [state, formAction, pending] = useActionState<UsuarioFormState, FormData>(
    criarUsuario,
    undefined,
  );

  useEffect(() => {
    if (state && "ok" in state) aoSalvar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <form
      action={formAction}
      className="max-w-lg space-y-4 rounded-lg border border-border bg-card p-4"
    >
      {state && "error" in state && (
        <p className="rounded-md bg-danger-bg px-3 py-2 text-sm text-danger">
          {state.error}
        </p>
      )}
      <div className="space-y-1.5">
        <Label htmlFor="usr_email">E-mail</Label>
        <Input id="usr_email" name="email" type="email" required />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="usr_senha">Senha provisória</Label>
        <Input id="usr_senha" name="senha" type="text" required minLength={6} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="usr_papel">Papel</Label>
        <NativeSelect id="usr_papel" name="papel" required defaultValue="leitor">
          {PAPEIS.map((p) => (
            <option key={p} value={p}>
              {PAPEL_LABEL[p]}
            </option>
          ))}
        </NativeSelect>
      </div>
      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? "Criando..." : "Criar usuário"}
        </Button>
      </div>
    </form>
  );
}
