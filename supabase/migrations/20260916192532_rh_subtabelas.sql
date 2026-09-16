create table rh.dependentes (
  id uuid primary key default gen_random_uuid(),
  unidade_id uuid not null references core.unidades(id),
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  criado_por uuid,
  atualizado_em timestamptz not null default now(),
  atualizado_por uuid,

  colaborador_id uuid not null references rh.colaboradores(id) on delete cascade,
  nome text not null,
  parentesco text not null check (parentesco in ('Filho', 'Filha', 'Enteado', 'Enteada', 'Outro')),
  data_nascimento date,
  sexo text check (sexo in ('M', 'F'))
);

create table rh.formacoes (
  id uuid primary key default gen_random_uuid(),
  unidade_id uuid not null references core.unidades(id),
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  criado_por uuid,
  atualizado_em timestamptz not null default now(),
  atualizado_por uuid,

  colaborador_id uuid not null references rh.colaboradores(id) on delete cascade,
  nivel_id uuid not null references rh.config_formacoes(id),
  curso text,
  instituicao text,
  ano_conclusao int,
  -- "formação atual" para efeito de indicador é sempre a de criado_em mais recente,
  -- não existe flag separada de "principal" (ver CLAUDE.md seção 7.7).
  status text not null default 'Concluído' check (status in ('Concluído', 'Em andamento', 'Trancado'))
);

-- Log de auditoria de carreira: nunca editado, só marcado ativo=false para corrigir um
-- lançamento errado (ver CLAUDE.md seção 4 e 7.2). O trigger abaixo bloqueia no banco
-- qualquer tentativa de alterar os dados do histórico, permitindo só a exclusão lógica.
create table rh.historico_cargo_salarial (
  id uuid primary key default gen_random_uuid(),
  unidade_id uuid not null references core.unidades(id),
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  criado_por uuid,
  atualizado_em timestamptz not null default now(),
  atualizado_por uuid,

  colaborador_id uuid not null references rh.colaboradores(id) on delete cascade,
  data date not null,
  cargo_anterior text,
  cargo_novo text,
  salario_anterior numeric(14, 2),
  salario_novo numeric(14, 2),
  motivo_id uuid references rh.config_motivos_evolucao_salarial(id)
);

create or replace function rh.tg_historico_cargo_salarial_protect()
returns trigger
language plpgsql
as $$
begin
  if (new.colaborador_id, new.data, new.cargo_anterior, new.cargo_novo, new.salario_anterior, new.salario_novo, new.motivo_id)
     is distinct from
     (old.colaborador_id, old.data, old.cargo_anterior, old.cargo_novo, old.salario_anterior, old.salario_novo, old.motivo_id)
  then
    raise exception 'rh.historico_cargo_salarial e log de auditoria: nao e permitido alterar estes campos, apenas marcar ativo=false para corrigir um lancamento';
  end if;
  return new;
end;
$$;

create trigger trg_protect_historico before update on rh.historico_cargo_salarial
  for each row execute function rh.tg_historico_cargo_salarial_protect();

create table rh.aso_registros (
  id uuid primary key default gen_random_uuid(),
  unidade_id uuid not null references core.unidades(id),
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  criado_por uuid,
  atualizado_em timestamptz not null default now(),
  atualizado_por uuid,

  colaborador_id uuid not null references rh.colaboradores(id) on delete cascade,
  tipo_exame text not null check (tipo_exame in ('admissional', 'periodico', 'demissional', 'mudanca_funcao', 'retorno_trabalho')),
  data date not null,
  resultado text not null check (resultado in ('apto', 'inapto')),
  data_vencimento date
);

create table rh.exames_complementares_registros (
  id uuid primary key default gen_random_uuid(),
  unidade_id uuid not null references core.unidades(id),
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  criado_por uuid,
  atualizado_em timestamptz not null default now(),
  atualizado_por uuid,

  colaborador_id uuid not null references rh.colaboradores(id) on delete cascade,
  exame_id uuid not null references rh.config_tipos_exame(id),
  data date not null,
  data_vencimento date
);

create table rh.treinamentos (
  id uuid primary key default gen_random_uuid(),
  unidade_id uuid not null references core.unidades(id),
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  criado_por uuid,
  atualizado_em timestamptz not null default now(),
  atualizado_por uuid,

  nome text not null,
  tipo text not null check (tipo in ('NR', 'geral')),
  nr_numero uuid references rh.config_nrs_catalogo(id),
  categoria_id uuid not null references rh.config_categorias_treinamento(id),
  data date not null,
  carga_horaria numeric not null,
  instrutor text,
  custo_total numeric(14, 2),
  data_vencimento date,

  constraint chk_nr_numero_coerente check (
    (tipo = 'NR' and nr_numero is not null) or (tipo = 'geral' and nr_numero is null)
  )
);

create table rh.treinamento_participantes (
  id uuid primary key default gen_random_uuid(),
  unidade_id uuid not null references core.unidades(id),
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  criado_por uuid,
  atualizado_em timestamptz not null default now(),
  atualizado_por uuid,

  treinamento_id uuid not null references rh.treinamentos(id) on delete cascade,
  colaborador_id uuid not null references rh.colaboradores(id) on delete cascade,
  unique (treinamento_id, colaborador_id)
);

-- Ao inserir um desligamento, o colaborador vira "desligado"; ao preencher data_reativacao
-- ou remover o desligamento vigente (sem reativação), ele volta para "ativo" automaticamente
-- (ver CLAUDE.md seção 5.3 e 4). Isso é reforçado aqui no banco para não depender só da
-- aplicação lembrar de sincronizar o status.
create table rh.desligamentos (
  id uuid primary key default gen_random_uuid(),
  unidade_id uuid not null references core.unidades(id),
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  criado_por uuid,
  atualizado_em timestamptz not null default now(),
  atualizado_por uuid,

  colaborador_id uuid not null references rh.colaboradores(id) on delete cascade,
  data date not null,
  tipo text not null check (tipo in ('voluntario', 'involuntario')),
  motivo_id uuid references rh.config_motivos_desligamento(id),
  descricao text,
  data_reativacao date
);

create or replace function rh.tg_desligamento_sync_status()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    update rh.colaboradores set status_rh = 'desligado' where id = new.colaborador_id;
  elsif tg_op = 'UPDATE' then
    if new.data_reativacao is not null and old.data_reativacao is null then
      update rh.colaboradores set status_rh = 'ativo' where id = new.colaborador_id;
    elsif new.data_reativacao is null and old.data_reativacao is not null then
      update rh.colaboradores set status_rh = 'desligado' where id = new.colaborador_id;
    end if;
  elsif tg_op = 'DELETE' then
    if old.data_reativacao is null then
      update rh.colaboradores set status_rh = 'ativo' where id = old.colaborador_id;
    end if;
  end if;
  return coalesce(new, old);
end;
$$;

create trigger trg_desligamento_sync
  after insert or update or delete on rh.desligamentos
  for each row execute function rh.tg_desligamento_sync_status();

-- RLS + trigger de auditoria (atualizado_em/atualizado_por), aplicados de forma idêntica em
-- todas as tabelas do schema rh (as 4 políticas citadas no Padrão COONTROL: leitor/operador
-- vêem e criam/editam, gestor/admin também excluem).
do $$
declare
  t text;
  tabelas text[] := array[
    'colaboradores', 'dependentes', 'formacoes', 'historico_cargo_salarial',
    'aso_registros', 'exames_complementares_registros', 'treinamentos',
    'treinamento_participantes', 'desligamentos',
    'config_setores', 'config_cargos', 'config_niveis', 'config_eixos',
    'config_motivos_desligamento', 'config_motivos_evolucao_salarial',
    'config_categorias_treinamento', 'config_formacoes', 'config_nrs_catalogo',
    'config_tipos_exame', 'config_exames_por_funcao'
  ];
begin
  foreach t in array tabelas loop
    execute format('alter table rh.%I enable row level security', t);
    execute format(
      'create trigger trg_atualizado before update on rh.%I for each row execute function core.tg_set_atualizado()',
      t
    );
    execute format(
      $f$create policy select_rh on rh.%I for select using (core.tem_papel('rh', array['leitor','operador','gestor','admin']))$f$,
      t
    );
    execute format(
      $f$create policy insert_rh on rh.%I for insert with check (core.tem_papel('rh', array['operador','gestor','admin']))$f$,
      t
    );
    execute format(
      $f$create policy update_rh on rh.%I for update using (core.tem_papel('rh', array['operador','gestor','admin'])) with check (core.tem_papel('rh', array['operador','gestor','admin']))$f$,
      t
    );
    execute format(
      $f$create policy delete_rh on rh.%I for delete using (core.tem_papel('rh', array['gestor','admin']))$f$,
      t
    );
  end loop;
end $$;
