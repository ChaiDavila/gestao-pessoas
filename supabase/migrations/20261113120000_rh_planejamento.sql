-- Planejamento de Gente: planejamento anual da área de RH (ações pontuais e atividades com
-- período de execução), com checklist e orçamento (previsto + despesas lançadas).
-- Sem responsável por ação/tarefa: a rotina é de uso da própria área de RH.
-- Leitura: qualquer papel do RH (o acesso à tela é controlado por escopo_telas no app).
-- Escrita: somente admin.

-- ---------------------------------------------------------------------------------------
-- Catálogo de categorias (editável em Configurações), com cor de exibição
-- ---------------------------------------------------------------------------------------
create table rh.config_categorias_planejamento (
  id uuid primary key default gen_random_uuid(),
  unidade_id uuid not null references core.unidades(id),
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  criado_por uuid,
  atualizado_em timestamptz not null default now(),
  atualizado_por uuid,

  nome text not null unique,
  cor text not null default '#7A8594' check (cor ~ '^#[0-9A-Fa-f]{6}$')
);

-- ---------------------------------------------------------------------------------------
-- Ações / atividades
-- ---------------------------------------------------------------------------------------
create table rh.planejamento_acoes (
  id uuid primary key default gen_random_uuid(),
  unidade_id uuid not null references core.unidades(id),
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  criado_por uuid,
  atualizado_em timestamptz not null default now(),
  atualizado_por uuid,

  titulo text not null check (length(trim(titulo)) between 1 and 150),
  descricao text,
  categoria_id uuid not null references rh.config_categorias_planejamento(id),
  tipo text not null check (tipo in ('pontual', 'periodo')),
  -- Ação pontual: data_inicio é a data da ação e data_fim fica nula.
  -- Atividade com período: data_fim obrigatória e >= data_inicio.
  data_inicio date not null,
  data_fim date,
  status text not null default 'planejada'
    check (status in ('planejada', 'em_andamento', 'concluida', 'cancelada')),
  -- Preenchida automaticamente (trigger abaixo) ao marcar como concluída.
  data_conclusao date,
  -- Nulo = orçamento não informado (diferente de R$ 0,00 confirmado).
  -- Na visão mensal, o previsto é atribuído ao mês de data_inicio (sem rateio).
  orcamento_previsto numeric(14,2) check (orcamento_previsto >= 0),
  observacoes text,

  constraint planejamento_acoes_datas_ck check (
    (tipo = 'pontual' and data_fim is null)
    or (tipo = 'periodo' and data_fim is not null and data_fim >= data_inicio)
  )
);

create index planejamento_acoes_datas_idx on rh.planejamento_acoes (data_inicio, data_fim);

-- Data de conclusão: grava hoje ao entrar em "concluida" (se não vier informada) e limpa
-- ao sair desse status.
create or replace function rh.tg_planejamento_data_conclusao()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'concluida' then
    if new.data_conclusao is null then
      new.data_conclusao := current_date;
    end if;
  else
    new.data_conclusao := null;
  end if;
  return new;
end;
$$;

create trigger trg_data_conclusao before insert or update on rh.planejamento_acoes
  for each row execute function rh.tg_planejamento_data_conclusao();

-- ---------------------------------------------------------------------------------------
-- Checklist
-- ---------------------------------------------------------------------------------------
create table rh.planejamento_tarefas (
  id uuid primary key default gen_random_uuid(),
  unidade_id uuid not null references core.unidades(id),
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  criado_por uuid,
  atualizado_em timestamptz not null default now(),
  atualizado_por uuid,

  acao_id uuid not null references rh.planejamento_acoes(id) on delete cascade,
  descricao text not null check (length(trim(descricao)) between 1 and 200),
  prazo date,
  concluida boolean not null default false,
  concluida_em date,
  ordem int not null default 0
);

create index planejamento_tarefas_acao_idx on rh.planejamento_tarefas (acao_id, ordem);

create or replace function rh.tg_planejamento_tarefa_concluida()
returns trigger
language plpgsql
as $$
begin
  if new.concluida then
    if new.concluida_em is null then
      new.concluida_em := current_date;
    end if;
  else
    new.concluida_em := null;
  end if;
  return new;
end;
$$;

create trigger trg_tarefa_concluida before insert or update on rh.planejamento_tarefas
  for each row execute function rh.tg_planejamento_tarefa_concluida();

-- ---------------------------------------------------------------------------------------
-- Despesas realizadas (o "realizado" é sempre a soma destas, nunca digitado)
-- ---------------------------------------------------------------------------------------
create table rh.planejamento_despesas (
  id uuid primary key default gen_random_uuid(),
  unidade_id uuid not null references core.unidades(id),
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  criado_por uuid,
  atualizado_em timestamptz not null default now(),
  atualizado_por uuid,

  acao_id uuid not null references rh.planejamento_acoes(id) on delete cascade,
  data date not null,
  descricao text not null check (length(trim(descricao)) between 1 and 200),
  valor numeric(14,2) not null check (valor > 0)
);

create index planejamento_despesas_acao_idx on rh.planejamento_despesas (acao_id);
create index planejamento_despesas_data_idx on rh.planejamento_despesas (data);

-- ---------------------------------------------------------------------------------------
-- Auditoria, RLS e grants (mesmo padrão das demais tabelas do schema rh)
-- ---------------------------------------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array[
    'config_categorias_planejamento',
    'planejamento_acoes',
    'planejamento_tarefas',
    'planejamento_despesas'
  ] loop
    execute format('alter table rh.%I enable row level security', t);
    execute format(
      'create trigger trg_atualizado before update on rh.%I
         for each row execute function core.tg_set_atualizado()', t);
    execute format(
      'create policy select_rh on rh.%I for select
         using (core.tem_papel(''rh'', array[''leitor'', ''operador'', ''gestor'', ''admin'']))', t);
    execute format(
      'create policy insert_rh on rh.%I for insert
         with check (core.tem_papel(''rh'', array[''admin'']))', t);
    execute format(
      'create policy update_rh on rh.%I for update
         using (core.tem_papel(''rh'', array[''admin'']))
         with check (core.tem_papel(''rh'', array[''admin'']))', t);
    execute format(
      'create policy delete_rh on rh.%I for delete
         using (core.tem_papel(''rh'', array[''admin'']))', t);
    execute format(
      'grant select, insert, update, delete on rh.%I to authenticated, service_role', t);
  end loop;
end;
$$;

-- ---------------------------------------------------------------------------------------
-- Seed das categorias (cores fora da faixa verde/âmbar/vermelho dos badges de status e
-- fora do laranja COONTROL, pra não confundir categoria com situação)
-- ---------------------------------------------------------------------------------------
insert into rh.config_categorias_planejamento (unidade_id, nome, cor)
select u.id, c.nome, c.cor
from (select id from core.unidades order by criado_em limit 1) u
cross join (values
  ('Endomarketing', '#C2417A'),
  ('Treinamentos', '#2F6FBF'),
  ('Gestão por Competências', '#7A5BB5'),
  ('Recrutamento e Seleção', '#1E8C9C'),
  ('Saúde e Segurança', '#8A6A3F'),
  ('Outros', '#7A8594')
) as c(nome, cor);
