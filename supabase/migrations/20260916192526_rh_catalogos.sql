-- Schema rh: tabelas de catálogo (Configurações). Estrutura só; dados de seed (extraídos do
-- protótipo validado com a área de RH) vêm numa migration separada.

create schema if not exists rh;

create table rh.config_setores (
  id uuid primary key default gen_random_uuid(),
  unidade_id uuid not null references core.unidades(id),
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  criado_por uuid,
  atualizado_em timestamptz not null default now(),
  atualizado_por uuid,
  nome text not null unique
);

create table rh.config_cargos (
  id uuid primary key default gen_random_uuid(),
  unidade_id uuid not null references core.unidades(id),
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  criado_por uuid,
  atualizado_em timestamptz not null default now(),
  atualizado_por uuid,
  nome text not null unique,
  cbo text
);

create table rh.config_niveis (
  id uuid primary key default gen_random_uuid(),
  unidade_id uuid not null references core.unidades(id),
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  criado_por uuid,
  atualizado_em timestamptz not null default now(),
  atualizado_por uuid,
  nome text not null unique,
  ordem int not null
);

create table rh.config_eixos (
  id uuid primary key default gen_random_uuid(),
  unidade_id uuid not null references core.unidades(id),
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  criado_por uuid,
  atualizado_em timestamptz not null default now(),
  atualizado_por uuid,
  nome text not null unique
);

create table rh.config_motivos_desligamento (
  id uuid primary key default gen_random_uuid(),
  unidade_id uuid not null references core.unidades(id),
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  criado_por uuid,
  atualizado_em timestamptz not null default now(),
  atualizado_por uuid,
  motivo text not null unique,
  tipo_padrao text not null check (tipo_padrao in ('voluntario', 'involuntario'))
);

create table rh.config_motivos_evolucao_salarial (
  id uuid primary key default gen_random_uuid(),
  unidade_id uuid not null references core.unidades(id),
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  criado_por uuid,
  atualizado_em timestamptz not null default now(),
  atualizado_por uuid,
  motivo text not null unique
);

create table rh.config_categorias_treinamento (
  id uuid primary key default gen_random_uuid(),
  unidade_id uuid not null references core.unidades(id),
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  criado_por uuid,
  atualizado_em timestamptz not null default now(),
  atualizado_por uuid,
  nome text not null unique
);

create table rh.config_formacoes (
  id uuid primary key default gen_random_uuid(),
  unidade_id uuid not null references core.unidades(id),
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  criado_por uuid,
  atualizado_em timestamptz not null default now(),
  atualizado_por uuid,
  nome text not null unique,
  ordem int not null
);

create table rh.config_nrs_catalogo (
  id uuid primary key default gen_random_uuid(),
  unidade_id uuid not null references core.unidades(id),
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  criado_por uuid,
  atualizado_em timestamptz not null default now(),
  atualizado_por uuid,
  nr text not null unique,
  nome text not null,
  periodicidade_meses int
);

create table rh.config_tipos_exame (
  id uuid primary key default gen_random_uuid(),
  unidade_id uuid not null references core.unidades(id),
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  criado_por uuid,
  atualizado_em timestamptz not null default now(),
  atualizado_por uuid,
  nome text not null unique,
  periodicidade_meses int
);

-- PGR: quais exames complementares cada cargo exige. Periodicidade sempre vem do exame
-- (rh.config_tipos_exame), nunca é duplicada aqui.
create table rh.config_exames_por_funcao (
  id uuid primary key default gen_random_uuid(),
  unidade_id uuid not null references core.unidades(id),
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  criado_por uuid,
  atualizado_em timestamptz not null default now(),
  atualizado_por uuid,
  cargo_id uuid not null references rh.config_cargos(id) on delete cascade,
  exame_id uuid not null references rh.config_tipos_exame(id) on delete cascade,
  unique (cargo_id, exame_id)
);
