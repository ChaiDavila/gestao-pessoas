-- Schema core: dados compartilhados entre áreas da COONTROL (Padrão de Software COONTROL v1.0).
-- Este projeto Supabase ainda não tinha nenhum schema além dos padrões do Supabase;
-- core é criado aqui pela primeira vez junto com o schema rh (ver docs/PROMPT-coontrol-rh-gestao-pessoas.md).

create extension if not exists pgcrypto with schema extensions;

create schema if not exists core;

-- Unidade de negócio/localidade da COONTROL. Hoje só existe uma, mas o padrão da empresa
-- já prevê várias áreas/unidades usando o mesmo banco (Portal Central).
create table core.unidades (
  id uuid primary key default gen_random_uuid(),
  nome text not null unique,
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  criado_por uuid,
  atualizado_em timestamptz not null default now(),
  atualizado_por uuid
);

insert into core.unidades (nome) values ('COONTROL - Rio do Sul/SC');

-- Pessoa física compartilhada entre áreas. rh.colaboradores referencia esta tabela em vez de
-- duplicar dados cadastrais básicos (nome, CPF, data de nascimento).
create table core.pessoas (
  id uuid primary key default gen_random_uuid(),
  unidade_id uuid not null references core.unidades(id),
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  criado_por uuid,
  atualizado_em timestamptz not null default now(),
  atualizado_por uuid,
  nome text not null,
  cpf text unique,
  data_nascimento date
);

-- Papel de cada usuário autenticado (auth.users) em cada área do sistema (leitor/operador/gestor/admin).
-- Populada na etapa de login, depois que as contas forem criadas no Supabase Auth.
create table core.usuarios_areas (
  usuario_id uuid not null references auth.users(id) on delete cascade,
  area text not null,
  papel text not null check (papel in ('leitor', 'operador', 'gestor', 'admin')),
  unidade_id uuid references core.unidades(id),
  criado_em timestamptz not null default now(),
  primary key (usuario_id, area)
);

-- Função de apoio para as políticas de RLS: o usuário autenticado tem um dos papéis
-- informados na área informada?
create or replace function core.tem_papel(p_area text, p_papeis text[])
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from core.usuarios_areas ua
    where ua.usuario_id = auth.uid()
      and ua.area = p_area
      and ua.papel = any (p_papeis)
  );
$$;

-- Trigger de auditoria: mantém atualizado_em/atualizado_por corretos em qualquer UPDATE,
-- independente da aplicação lembrar de setar isso.
create or replace function core.tg_set_atualizado()
returns trigger
language plpgsql
as $$
begin
  new.atualizado_em := now();
  new.atualizado_por := auth.uid();
  return new;
end;
$$;

alter table core.unidades enable row level security;
alter table core.pessoas enable row level security;
alter table core.usuarios_areas enable row level security;

create trigger trg_atualizado before update on core.unidades
  for each row execute function core.tg_set_atualizado();
create trigger trg_atualizado before update on core.pessoas
  for each row execute function core.tg_set_atualizado();

-- core.unidades: leitura liberada para qualquer usuário autenticado (dado de referência),
-- escrita só para admin de rh (única área existente até aqui).
create policy select_authenticated on core.unidades for select
  using (auth.role() = 'authenticated');
create policy write_admin on core.unidades for insert
  with check (core.tem_papel('rh', array['admin']));
create policy update_admin on core.unidades for update
  using (core.tem_papel('rh', array['admin']))
  with check (core.tem_papel('rh', array['admin']));
create policy delete_admin on core.unidades for delete
  using (core.tem_papel('rh', array['admin']));

-- core.pessoas: hoje só a área rh consome esta tabela. Quando uma segunda área existir,
-- revisar esta política para não depender só do papel 'rh'.
create policy select_rh on core.pessoas for select
  using (core.tem_papel('rh', array['leitor', 'operador', 'gestor', 'admin']));
create policy insert_rh on core.pessoas for insert
  with check (core.tem_papel('rh', array['operador', 'gestor', 'admin']));
create policy update_rh on core.pessoas for update
  using (core.tem_papel('rh', array['operador', 'gestor', 'admin']))
  with check (core.tem_papel('rh', array['operador', 'gestor', 'admin']));
create policy delete_rh on core.pessoas for delete
  using (core.tem_papel('rh', array['gestor', 'admin']));

-- core.usuarios_areas: só admin gerencia papéis; cada usuário pode ver o próprio papel.
create policy select_own_or_admin on core.usuarios_areas for select
  using (usuario_id = auth.uid() or core.tem_papel('rh', array['admin']));
create policy write_admin on core.usuarios_areas for insert
  with check (core.tem_papel('rh', array['admin']));
create policy update_admin on core.usuarios_areas for update
  using (core.tem_papel('rh', array['admin']))
  with check (core.tem_papel('rh', array['admin']));
create policy delete_admin on core.usuarios_areas for delete
  using (core.tem_papel('rh', array['admin']));
