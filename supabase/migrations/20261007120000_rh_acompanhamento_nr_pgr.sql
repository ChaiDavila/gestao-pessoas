-- Matriz de NR por função + acompanhamento individual de validade (NR e exames
-- complementares/PGR), preservando todos os treinamentos e certificados já cadastrados.
--
-- Problema que isso resolve: hoje, uma vez que alguém faz um curso de NR, ele é
-- acompanhado pra sempre — mesmo que a função dele mude e aquela NR deixe de ser exigida
-- (ex.: alguém sai de Serviços, onde precisava de uma NR, e vai pra Produção, onde não
-- precisa mais — o curso antigo continua gerando alerta de vencimento pra sempre). O mesmo
-- vale pros exames complementares do PGR, só que lá não existe sequer uma matriz formal de
-- "o que cada função exige" pra NR (só existe pra PGR, em rh.config_exames_por_funcao).
--
-- Desenho: "acompanhar validade: sim/não" é uma ESCOLHA TRAVADA por colaborador+NR (ou
-- colaborador+exame), não recalculada ao vivo contra a função atual — senão trocar de
-- função desligaria o acompanhamento sozinho, silenciosamente, o que é exatamente o que
-- não pode acontecer. A matriz da função só serve pra SEMEAR o valor inicial (sempre
-- acompanhar=true) no momento em que a combinação colaborador+NR/exame passa a ser
-- relevante pela primeira vez (admissão, troca de função, ou a matriz ganhando uma
-- exigência nova) — a partir daí, só uma ação manual explícita muda o valor.

-- 1) Matriz "NR exigida por função" (mesmo padrão de rh.config_exames_por_funcao, que já
-- existe pra PGR). A periodicidade de cada curso já está em rh.config_nrs_catalogo —
-- não é duplicada aqui.
create table rh.config_nrs_por_funcao (
  id uuid primary key default gen_random_uuid(),
  unidade_id uuid not null references core.unidades(id),
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  criado_por uuid,
  atualizado_em timestamptz not null default now(),
  atualizado_por uuid,

  cargo_id uuid not null references rh.config_cargos(id) on delete cascade,
  nr_catalogo_id uuid not null references rh.config_nrs_catalogo(id) on delete cascade,
  unique (cargo_id, nr_catalogo_id)
);

alter table rh.config_nrs_por_funcao enable row level security;
create trigger trg_atualizado before update on rh.config_nrs_por_funcao
  for each row execute function core.tg_set_atualizado();
create policy select_rh on rh.config_nrs_por_funcao for select
  using (core.tem_papel('rh', array['leitor', 'operador', 'gestor', 'admin']));
create policy insert_rh on rh.config_nrs_por_funcao for insert
  with check (core.tem_papel('rh', array['operador', 'gestor', 'admin']));
create policy update_rh on rh.config_nrs_por_funcao for update
  using (core.tem_papel('rh', array['operador', 'gestor', 'admin']))
  with check (core.tem_papel('rh', array['operador', 'gestor', 'admin']));
create policy delete_rh on rh.config_nrs_por_funcao for delete
  using (core.tem_papel('rh', array['gestor', 'admin']));
grant select, insert, update, delete on rh.config_nrs_por_funcao to authenticated, service_role;

-- 2) Diferenciar "função ainda não configurada" de "função confirmada: não exige nada" —
-- sem isso, zero linhas na matriz é ambíguo entre as duas situações, pra NR e pra PGR.
alter table rh.config_cargos
  add column nr_matriz_confirmada boolean not null default false,
  add column exames_matriz_confirmada boolean not null default false;

-- 3) Acompanhamento individual, por colaborador + NR. Guarda só exceções/decisões
-- explícitas (incluindo a semeadura inicial vinda da matriz) — não precisa ter uma linha
-- pra toda combinação colaborador×catálogo, só pras que já foram "tocadas" alguma vez.
create table rh.colaborador_nr_acompanhamento (
  id uuid primary key default gen_random_uuid(),
  unidade_id uuid not null references core.unidades(id),
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  criado_por uuid,
  atualizado_em timestamptz not null default now(),
  atualizado_por uuid,

  colaborador_id uuid not null references rh.colaboradores(id) on delete cascade,
  nr_catalogo_id uuid not null references rh.config_nrs_catalogo(id) on delete cascade,
  acompanhar boolean not null default true,
  unique (colaborador_id, nr_catalogo_id)
);

alter table rh.colaborador_nr_acompanhamento enable row level security;
create trigger trg_atualizado before update on rh.colaborador_nr_acompanhamento
  for each row execute function core.tg_set_atualizado();
create policy select_rh on rh.colaborador_nr_acompanhamento for select
  using (core.tem_papel('rh', array['leitor', 'operador', 'gestor', 'admin']));
create policy insert_rh on rh.colaborador_nr_acompanhamento for insert
  with check (core.tem_papel('rh', array['operador', 'gestor', 'admin']));
create policy update_rh on rh.colaborador_nr_acompanhamento for update
  using (core.tem_papel('rh', array['operador', 'gestor', 'admin']))
  with check (core.tem_papel('rh', array['operador', 'gestor', 'admin']));
create policy delete_rh on rh.colaborador_nr_acompanhamento for delete
  using (core.tem_papel('rh', array['gestor', 'admin']));
grant select, insert, update, delete on rh.colaborador_nr_acompanhamento to authenticated, service_role;

-- 4) Mesma coisa pro PGR (exames complementares) — igual à de NR acima.
create table rh.colaborador_exame_acompanhamento (
  id uuid primary key default gen_random_uuid(),
  unidade_id uuid not null references core.unidades(id),
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  criado_por uuid,
  atualizado_em timestamptz not null default now(),
  atualizado_por uuid,

  colaborador_id uuid not null references rh.colaboradores(id) on delete cascade,
  exame_id uuid not null references rh.config_tipos_exame(id) on delete cascade,
  acompanhar boolean not null default true,
  unique (colaborador_id, exame_id)
);

alter table rh.colaborador_exame_acompanhamento enable row level security;
create trigger trg_atualizado before update on rh.colaborador_exame_acompanhamento
  for each row execute function core.tg_set_atualizado();
create policy select_rh on rh.colaborador_exame_acompanhamento for select
  using (core.tem_papel('rh', array['leitor', 'operador', 'gestor', 'admin']));
create policy insert_rh on rh.colaborador_exame_acompanhamento for insert
  with check (core.tem_papel('rh', array['operador', 'gestor', 'admin']));
create policy update_rh on rh.colaborador_exame_acompanhamento for update
  using (core.tem_papel('rh', array['operador', 'gestor', 'admin']))
  with check (core.tem_papel('rh', array['operador', 'gestor', 'admin']));
create policy delete_rh on rh.colaborador_exame_acompanhamento for delete
  using (core.tem_papel('rh', array['gestor', 'admin']));
grant select, insert, update, delete on rh.colaborador_exame_acompanhamento to authenticated, service_role;

-- 5) Periodicidade do ASO PERIÓDICO por função — diferente do PGR (que são exames
-- complementares específicos por função), o ASO periódico é obrigatório pra todo mundo,
-- só a frequência muda conforme a função. Sem linha aqui = periodicidade ainda não
-- configurada (vencimento continua manual, como hoje).
create table rh.config_periodicidade_aso_por_funcao (
  id uuid primary key default gen_random_uuid(),
  unidade_id uuid not null references core.unidades(id),
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  criado_por uuid,
  atualizado_em timestamptz not null default now(),
  atualizado_por uuid,

  cargo_id uuid not null references rh.config_cargos(id) on delete cascade,
  periodicidade_meses int not null check (periodicidade_meses > 0),
  unique (cargo_id)
);

alter table rh.config_periodicidade_aso_por_funcao enable row level security;
create trigger trg_atualizado before update on rh.config_periodicidade_aso_por_funcao
  for each row execute function core.tg_set_atualizado();
create policy select_rh on rh.config_periodicidade_aso_por_funcao for select
  using (core.tem_papel('rh', array['leitor', 'operador', 'gestor', 'admin']));
create policy insert_rh on rh.config_periodicidade_aso_por_funcao for insert
  with check (core.tem_papel('rh', array['operador', 'gestor', 'admin']));
create policy update_rh on rh.config_periodicidade_aso_por_funcao for update
  using (core.tem_papel('rh', array['operador', 'gestor', 'admin']))
  with check (core.tem_papel('rh', array['operador', 'gestor', 'admin']));
create policy delete_rh on rh.config_periodicidade_aso_por_funcao for delete
  using (core.tem_papel('rh', array['gestor', 'admin']));
grant select, insert, update, delete on rh.config_periodicidade_aso_por_funcao to authenticated, service_role;

-- 6) Backfill: preserva o comportamento atual (todo mundo que já tem registro continua
-- acompanhado) — nunca desliga nada que já existia.
insert into rh.colaborador_nr_acompanhamento (unidade_id, colaborador_id, nr_catalogo_id, acompanhar)
select distinct c.unidade_id, tp.colaborador_id, t.nr_numero, true
from rh.treinamento_participantes tp
join rh.treinamentos t on t.id = tp.treinamento_id and t.tipo = 'NR' and t.nr_numero is not null
join rh.colaboradores c on c.id = tp.colaborador_id
on conflict (colaborador_id, nr_catalogo_id) do nothing;

insert into rh.colaborador_exame_acompanhamento (unidade_id, colaborador_id, exame_id, acompanhar)
select distinct c.unidade_id, ecr.colaborador_id, ecr.exame_id, true
from rh.exames_complementares_registros ecr
join rh.colaboradores c on c.id = ecr.colaborador_id
on conflict (colaborador_id, exame_id) do nothing;

-- 7) Views: passam a partir do acompanhamento (não da matriz nem do registro) — "sem
-- registro" vira um status possível (LEFT JOIN), e um item desativado continua aparecendo
-- (acompanhar=false) pra exibir "Sem acompanhamento" no detalhe sem sumir do histórico.
drop view rh.vw_nr_colaborador;

create view rh.vw_nr_colaborador
with (security_invoker = true)
as
select
  a.colaborador_id,
  p.nome as colaborador_nome,
  c.cargo_id,
  cg.nome as cargo_nome,
  c.setor_id,
  s.nome as setor_nome,
  c.status_rh,
  c.nivel_id,
  c.eixo_id,
  c.gestor_colaborador_id,
  a.acompanhar,
  a.nr_catalogo_id as nr_numero,
  n.nr,
  n.nome as nr_nome,
  n.periodicidade_meses,
  ultimo.id as treinamento_id,
  ultimo.data,
  ultimo.data_vencimento,
  ultimo.carga_horaria,
  ultimo.custo_total,
  ultimo.instrutor,
  a.id as acompanhamento_id
from rh.colaborador_nr_acompanhamento a
join rh.colaboradores c on c.id = a.colaborador_id
join core.pessoas p on p.id = c.pessoa_id
join rh.config_nrs_catalogo n on n.id = a.nr_catalogo_id
left join rh.config_cargos cg on cg.id = c.cargo_id
left join rh.config_setores s on s.id = c.setor_id
left join lateral (
  select t.id, t.data, t.data_vencimento, t.carga_horaria, t.custo_total, t.instrutor
  from rh.treinamento_participantes tp
  join rh.treinamentos t on t.id = tp.treinamento_id and t.tipo = 'NR' and t.nr_numero = a.nr_catalogo_id
  where tp.colaborador_id = a.colaborador_id
  order by t.data desc
  limit 1
) ultimo on true
where a.ativo = true;

grant select on rh.vw_nr_colaborador to authenticated, service_role;

drop view rh.vw_pgr_colaborador;

create view rh.vw_pgr_colaborador
with (security_invoker = true)
as
select
  a.colaborador_id,
  p.nome as colaborador_nome,
  c.cargo_id,
  cg.nome as cargo_nome,
  c.setor_id,
  s.nome as setor_nome,
  c.status_rh,
  a.exame_id,
  te.nome as exame_nome,
  te.periodicidade_meses,
  ultimo.id as registro_id,
  ultimo.data,
  ultimo.data_vencimento,
  a.acompanhar,
  a.id as acompanhamento_id
from rh.colaborador_exame_acompanhamento a
join rh.colaboradores c on c.id = a.colaborador_id
join core.pessoas p on p.id = c.pessoa_id
join rh.config_tipos_exame te on te.id = a.exame_id
left join rh.config_cargos cg on cg.id = c.cargo_id
left join rh.config_setores s on s.id = c.setor_id
left join lateral (
  select ecr.id, ecr.data, ecr.data_vencimento
  from rh.exames_complementares_registros ecr
  where ecr.colaborador_id = a.colaborador_id and ecr.exame_id = a.exame_id
  order by ecr.data desc
  limit 1
) ultimo on true
where a.ativo = true;

grant select on rh.vw_pgr_colaborador to authenticated, service_role;
