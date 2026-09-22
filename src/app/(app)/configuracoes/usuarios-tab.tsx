"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { NativeSelect } from "@/components/native-select";
import { BotaoRemover } from "@/components/botao-remover";
import { PainelAdicionar } from "@/components/painel-adicionar";
import { InfoBanner } from "@/components/info-banner";
import { formatarData } from "@/lib/date";
import type { PapelRh } from "@/lib/auth";
import { TELAS_ESCOPO, type TelaId } from "@/lib/nav";
import type { UsuarioArea, UsuarioFormState } from "./usuarios-actions";
import {
  criarUsuario,
  atualizarPapelUsuario,
  atualizarEscopoUsuario,
  removerAcessoUsuario,
} from "./usuarios-actions";

const PAPEL_LABEL: Record<PapelRh, string> = {
  leitor: "Leitor",
  operador: "Operador",
  gestor: "Gestor",
  admin: "Admin",
};

const PAPEL_DESCRICAO: Record<PapelRh, string> = {
  leitor: "só visualiza",
  operador: "visualiza e edita",
  gestor: "visualiza, edita e remove",
  admin: "acesso completo + gerencia usuários",
};

const PAPEIS: PapelRh[] = ["leitor", "operador", "gestor", "admin"];

export function UsuariosTab({
  usuarios,
  usuarioAtualId,
}: {
  usuarios: UsuarioArea[];
  usuarioAtualId: string | null;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-foreground">
            Quem tem acesso
          </h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            &ldquo;Remover&rdquo; tira o acesso a RH — a conta continua
            existindo (pode ser reaproveitada por outra área da COONTROL no
            futuro).
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
          {usuarios.length}
        </span>
      </div>

      <InfoBanner>
        <span className="font-medium text-foreground">Papel</span> define o
        que a pessoa pode fazer (leitor só vê, operador/gestor/admin também
        editam). <span className="font-medium text-foreground">Telas</span>{" "}
        restringe quais menus aparecem pra ela — deixe em &ldquo;Acesso
        completo&rdquo; pra ver tudo, ou marque só as telas necessárias (ex.: um perfil que só
        acessa Colaboradores, Treinamentos e ASO). Admin sempre tem acesso
        completo.
      </InfoBanner>

      <div className="my-3">
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
              <th className="px-3 py-2 font-medium">Telas</th>
              <th className="px-3 py-2 font-medium">Desde</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {usuarios.map((u) => (
              <LinhaUsuario
                key={u.usuarioId}
                usuario={u}
                souEu={u.usuarioId === usuarioAtualId}
              />
            ))}
            {usuarios.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-muted-foreground">
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

function ResumoTelas({ escopoTelas }: { escopoTelas: TelaId[] | null }) {
  if (!escopoTelas || escopoTelas.length === 0) {
    return <span className="text-muted-foreground">Acesso completo</span>;
  }
  const labels = TELAS_ESCOPO.filter((t) => escopoTelas.includes(t.id)).map((t) => t.label);
  return <span title={labels.join(", ")}>{labels.join(", ")}</span>;
}

function SeletorTelas({
  selecionadas,
  onChange,
}: {
  selecionadas: Set<TelaId>;
  onChange: (novo: Set<TelaId>) => void;
}) {
  function alternar(id: TelaId) {
    const novo = new Set(selecionadas);
    if (novo.has(id)) novo.delete(id);
    else novo.add(id);
    onChange(novo);
  }

  return (
    <div className="grid grid-cols-2 gap-2 rounded-md border border-border p-3">
      {TELAS_ESCOPO.map((t) => (
        <label key={t.id} className="flex items-center gap-2 text-sm">
          <Checkbox
            checked={selecionadas.has(t.id)}
            onCheckedChange={() => alternar(t.id)}
          />
          {selecionadas.has(t.id) && (
            <input type="hidden" name="telas" value={t.id} />
          )}
          {t.label}
        </label>
      ))}
    </div>
  );
}

function LinhaUsuario({ usuario, souEu }: { usuario: UsuarioArea; souEu: boolean }) {
  const [editando, setEditando] = useState(false);

  return (
    <>
      <tr className="border-b border-border last:border-0">
        <td className="px-3 py-2 text-foreground">
          {usuario.email}
          {souEu && <span className="ml-1.5 text-xs text-muted-foreground">(você)</span>}
        </td>
        <td className="px-3 py-2 text-foreground">{PAPEL_LABEL[usuario.papel]}</td>
        <td className="px-3 py-2 text-foreground">
          <ResumoTelas escopoTelas={usuario.papel === "admin" ? null : usuario.escopoTelas} />
        </td>
        <td className="px-3 py-2 text-muted-foreground">
          {formatarData(usuario.criadoEm.slice(0, 10))}
        </td>
        <td className="px-3 py-2 text-right">
          <div className="flex justify-end gap-1">
            <Button variant="ghost" size="sm" onClick={() => setEditando((v) => !v)}>
              Editar
            </Button>
            <BotaoRemover
              action={() => removerAcessoUsuario(usuario.usuarioId)}
              confirmar={`Remover o acesso de ${usuario.email}? A conta continua existindo, só perde o acesso ao RH.`}
            />
          </div>
        </td>
      </tr>
      {editando && (
        <tr className="border-b border-border bg-muted/20 last:border-0">
          <td colSpan={5} className="p-3">
            <EditorUsuario
              usuario={usuario}
              souEu={souEu}
              aoSalvar={() => setEditando(false)}
              aoCancelar={() => setEditando(false)}
            />
          </td>
        </tr>
      )}
    </>
  );
}

function EditorUsuario({
  usuario,
  souEu,
  aoSalvar,
  aoCancelar,
}: {
  usuario: UsuarioArea;
  souEu: boolean;
  aoSalvar: () => void;
  aoCancelar: () => void;
}) {
  const [papel, setPapel] = useState<PapelRh>(usuario.papel);
  const [restrito, setRestrito] = useState(
    !!usuario.escopoTelas && usuario.escopoTelas.length > 0,
  );
  const [selecionadas, setSelecionadas] = useState<Set<TelaId>>(
    new Set(usuario.escopoTelas ?? []),
  );
  const [pending, startTransition] = useTransition();

  // Evita o próprio admin trocar o seu papel e ficar sem acesso a Configurações
  // (já aconteceu — sem esse trava, dava pra escolher "leitor" pra si mesmo e
  // perder o acesso à tela que corrigiria isso).
  const travadoNoAdmin = souEu && usuario.papel === "admin";

  function salvar() {
    startTransition(async () => {
      if (papel !== usuario.papel) {
        await atualizarPapelUsuario(usuario.usuarioId, papel);
      }
      if (papel !== "admin") {
        await atualizarEscopoUsuario(
          usuario.usuarioId,
          restrito ? Array.from(selecionadas) : null,
        );
      }
      aoSalvar();
    });
  }

  return (
    <div className="max-w-md space-y-3">
      {travadoNoAdmin && (
        <p className="rounded-md bg-warning-bg px-3 py-2 text-xs text-warning">
          Você não pode tirar o próprio papel de admin por aqui — peça pra
          outro admin fazer essa troca, assim evita perder o próprio acesso.
        </p>
      )}
      <div className="space-y-1.5">
        <Label>Papel</Label>
        <NativeSelect
          value={papel}
          disabled={travadoNoAdmin}
          onChange={(e) => setPapel(e.target.value as PapelRh)}
          className="w-full"
        >
          {PAPEIS.map((p) => (
            <option key={p} value={p}>
              {PAPEL_LABEL[p]} — {PAPEL_DESCRICAO[p]}
            </option>
          ))}
        </NativeSelect>
      </div>
      {papel !== "admin" && (
        <div className="space-y-1.5">
          <Label>Telas</Label>
          <div className="flex flex-wrap gap-4 text-sm">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                checked={!restrito}
                onChange={() => setRestrito(false)}
              />
              Acesso completo
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                checked={restrito}
                onChange={() => setRestrito(true)}
              />
              Restrito a telas específicas
            </label>
          </div>
          {restrito && (
            <SeletorTelas selecionadas={selecionadas} onChange={setSelecionadas} />
          )}
        </div>
      )}
      <div className="flex gap-2">
        <Button
          type="button"
          size="sm"
          disabled={pending || (papel !== "admin" && restrito && selecionadas.size === 0)}
          onClick={salvar}
        >
          {pending ? "Salvando..." : "Salvar"}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={aoCancelar}>
          Cancelar
        </Button>
      </div>
    </div>
  );
}

function FormularioNovoUsuario({ aoSalvar }: { aoSalvar: () => void }) {
  const [state, formAction, pending] = useActionState<UsuarioFormState, FormData>(
    criarUsuario,
    undefined,
  );
  const [papel, setPapel] = useState<PapelRh>("leitor");
  const [restrito, setRestrito] = useState(false);
  const [selecionadas, setSelecionadas] = useState<Set<TelaId>>(new Set());

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
        <NativeSelect
          id="usr_papel"
          name="papel"
          required
          value={papel}
          onChange={(e) => setPapel(e.target.value as PapelRh)}
        >
          {PAPEIS.map((p) => (
            <option key={p} value={p}>
              {PAPEL_LABEL[p]} — {PAPEL_DESCRICAO[p]}
            </option>
          ))}
        </NativeSelect>
      </div>
      {papel !== "admin" && (
        <div className="space-y-1.5">
          <Label>Telas</Label>
          <div className="flex flex-wrap gap-4 text-sm">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                checked={!restrito}
                onChange={() => setRestrito(false)}
              />
              Acesso completo
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                checked={restrito}
                onChange={() => setRestrito(true)}
              />
              Restrito a telas específicas
            </label>
          </div>
          {restrito && (
            <SeletorTelas selecionadas={selecionadas} onChange={setSelecionadas} />
          )}
        </div>
      )}
      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={pending || (papel !== "admin" && restrito && selecionadas.size === 0)}
        >
          {pending ? "Criando..." : "Criar usuário"}
        </Button>
      </div>
    </form>
  );
}
