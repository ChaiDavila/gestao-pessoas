-- Regras configuráveis de notificação no Bitrix24 (seção 8 do prompt original — item de
-- backlog explícito, agora sendo construído). Cada regra: um tipo de evento (aniversário,
-- ASO a vencer, NR a vencer...), quantos dias de antecedência disparar, um responsável no
-- Bitrix e, opcionalmente, corresponsáveis (ex.: ASO/NR exigem duas pessoas responsáveis).
create table rh.config_bitrix_regras (
  id uuid primary key default gen_random_uuid(),
  unidade_id uuid not null references core.unidades(id),
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  criado_por uuid,
  atualizado_em timestamptz not null default now(),
  atualizado_por uuid,
  tipo_evento text not null check (
    tipo_evento in ('aniversario_nascimento', 'aniversario_empresa', 'aso_vencimento', 'nr_vencimento')
  ),
  dias_antecedencia int not null default 0 check (dias_antecedencia >= 0),
  responsavel_bitrix_id int not null,
  responsavel_bitrix_nome text not null,
  corresponsaveis_bitrix_ids int[],
  corresponsaveis_bitrix_nomes text[],
  titulo_template text not null,
  descricao_template text
);

alter table rh.config_bitrix_regras enable row level security;

create trigger trg_atualizado
  before update on rh.config_bitrix_regras
  for each row execute function core.tg_set_atualizado();

create policy select_rh on rh.config_bitrix_regras for select
  using (core.tem_papel('rh', array['leitor', 'operador', 'gestor', 'admin']));
create policy insert_rh on rh.config_bitrix_regras for insert
  with check (core.tem_papel('rh', array['operador', 'gestor', 'admin']));
create policy update_rh on rh.config_bitrix_regras for update
  using (core.tem_papel('rh', array['operador', 'gestor', 'admin']))
  with check (core.tem_papel('rh', array['operador', 'gestor', 'admin']));
create policy delete_rh on rh.config_bitrix_regras for delete
  using (core.tem_papel('rh', array['gestor', 'admin']));

grant select, insert, update, delete on rh.config_bitrix_regras to authenticated, service_role;

-- Log de tarefas já criadas, pra rotina diária nunca criar a mesma tarefa duas vezes pro
-- mesmo evento (ex.: mesmo aniversário, mesmo vencimento de ASO). Sem esse controle, rodar
-- o cron de novo (ou atrasar um dia) duplicaria tarefas no Bitrix.
create table rh.bitrix_notificacoes_enviadas (
  id uuid primary key default gen_random_uuid(),
  unidade_id uuid not null references core.unidades(id),
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  criado_por uuid,
  atualizado_em timestamptz not null default now(),
  atualizado_por uuid,
  regra_id uuid not null references rh.config_bitrix_regras(id) on delete cascade,
  colaborador_id uuid not null references rh.colaboradores(id) on delete cascade,
  referencia_evento text not null,
  bitrix_task_id int,
  unique (regra_id, colaborador_id, referencia_evento)
);

alter table rh.bitrix_notificacoes_enviadas enable row level security;

create trigger trg_atualizado
  before update on rh.bitrix_notificacoes_enviadas
  for each row execute function core.tg_set_atualizado();

create policy select_rh on rh.bitrix_notificacoes_enviadas for select
  using (core.tem_papel('rh', array['leitor', 'operador', 'gestor', 'admin']));
create policy insert_rh on rh.bitrix_notificacoes_enviadas for insert
  with check (core.tem_papel('rh', array['operador', 'gestor', 'admin']));
create policy update_rh on rh.bitrix_notificacoes_enviadas for update
  using (core.tem_papel('rh', array['operador', 'gestor', 'admin']))
  with check (core.tem_papel('rh', array['operador', 'gestor', 'admin']));
create policy delete_rh on rh.bitrix_notificacoes_enviadas for delete
  using (core.tem_papel('rh', array['gestor', 'admin']));

grant select, insert, update, delete on rh.bitrix_notificacoes_enviadas to authenticated, service_role;
