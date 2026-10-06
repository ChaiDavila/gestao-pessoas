-- Histórico de estrutura organizacional (função/cargo, nível, eixo, setor, gestor) por
-- colaborador, com data de vigência. rh.colaboradores só guarda o valor ATUAL dessas
-- colunas, então consultas históricas (treinamentos realizados, evolução salarial,
-- desligamentos, folha histórica) que filtram por elas sempre usaram a estrutura de HOJE
-- do colaborador, não a de quando o evento aconteceu — ex.: alguém que treinou em Produção
-- e depois mudou pra Serviço devia continuar aparecendo em "Produção" ao filtrar aquele
-- treinamento, mas não aparecia.
--
-- Decisão de produto: sem reconstrução para eventos anteriores a esta migration (não há
-- como saber com certeza qual era a estrutura de cada um antes de existir este rastreio) —
-- esses continuam usando o cadastro atual do colaborador como aproximação, sem nenhum
-- aviso extra na interface. A partir de hoje, toda edição de função/nível/eixo/setor/
-- gestor passa a gerar um novo registro aqui, e eventos novos passam a resolver pela
-- vigência correta.
--
-- Mesmo padrão de log imutável de rh.historico_cargo_salarial: nunca editar um lançamento
-- existente; a correção de um lançamento errado é uma exclusão lógica (ativo=false) + um
-- lançamento novo correto.
create table rh.historico_estrutura_organizacional (
  id uuid primary key default gen_random_uuid(),
  unidade_id uuid not null references core.unidades(id),
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  criado_por uuid,
  atualizado_em timestamptz not null default now(),
  atualizado_por uuid,

  colaborador_id uuid not null references rh.colaboradores(id) on delete cascade,
  data_vigencia date not null,
  cargo_id uuid references rh.config_cargos(id),
  nivel_id uuid references rh.config_niveis(id),
  eixo_id uuid references rh.config_eixos(id),
  setor_id uuid references rh.config_setores(id),
  gestor_colaborador_id uuid references rh.colaboradores(id) on delete set null,

  unique (colaborador_id, data_vigencia)
);

create index idx_historico_estrutura_colaborador
  on rh.historico_estrutura_organizacional (colaborador_id, data_vigencia desc);

alter table rh.historico_estrutura_organizacional enable row level security;

create trigger trg_atualizado
  before update on rh.historico_estrutura_organizacional
  for each row execute function core.tg_set_atualizado();

-- Log imutável: só `ativo` pode mudar depois de criado (exclusão lógica de um lançamento
-- errado), nunca os dados em si.
create or replace function rh.tg_historico_estrutura_protect()
returns trigger
language plpgsql
as $$
begin
  if new.colaborador_id is distinct from old.colaborador_id
    or new.data_vigencia is distinct from old.data_vigencia
    or new.cargo_id is distinct from old.cargo_id
    or new.nivel_id is distinct from old.nivel_id
    or new.eixo_id is distinct from old.eixo_id
    or new.setor_id is distinct from old.setor_id
    or new.gestor_colaborador_id is distinct from old.gestor_colaborador_id
  then
    raise exception 'Registro de histórico de estrutura organizacional não pode ser editado, só desativado (ativo=false).';
  end if;
  return new;
end;
$$;

create trigger trg_historico_estrutura_protect
  before update on rh.historico_estrutura_organizacional
  for each row execute function rh.tg_historico_estrutura_protect();

create policy select_rh on rh.historico_estrutura_organizacional for select
  using (core.tem_papel('rh', array['leitor', 'operador', 'gestor', 'admin']));
create policy insert_rh on rh.historico_estrutura_organizacional for insert
  with check (core.tem_papel('rh', array['operador', 'gestor', 'admin']));
create policy update_rh on rh.historico_estrutura_organizacional for update
  using (core.tem_papel('rh', array['operador', 'gestor', 'admin']))
  with check (core.tem_papel('rh', array['operador', 'gestor', 'admin']));
create policy delete_rh on rh.historico_estrutura_organizacional for delete
  using (core.tem_papel('rh', array['gestor', 'admin']));

grant select, insert, update, delete on rh.historico_estrutura_organizacional to authenticated, service_role;

-- Baseline: 1 registro por colaborador já cadastrado, com vigência a partir de HOJE (data
-- desta migration) e os valores ATUAIS dele. Garante que toda próxima edição tenha uma
-- base pra comparar e gerar o lançamento seguinte.
insert into rh.historico_estrutura_organizacional
  (unidade_id, colaborador_id, data_vigencia, cargo_id, nivel_id, eixo_id, setor_id, gestor_colaborador_id)
select unidade_id, id, current_date, cargo_id, nivel_id, eixo_id, setor_id, gestor_colaborador_id
from rh.colaboradores;

-- Estrutura vigente de um colaborador numa data — usada nas views de eventos históricos
-- abaixo via LEFT JOIN LATERAL. Pode devolver ZERO linhas (ex.: data anterior ao primeiro
-- registro); quem consome trata isso com COALESCE pro cadastro atual do colaborador.
create or replace function rh.estrutura_vigente_em(p_colaborador_id uuid, p_data date)
returns table (
  cargo_id uuid,
  nivel_id uuid,
  eixo_id uuid,
  setor_id uuid,
  gestor_colaborador_id uuid
)
language sql
stable
as $$
  select h.cargo_id, h.nivel_id, h.eixo_id, h.setor_id, h.gestor_colaborador_id
  from rh.historico_estrutura_organizacional h
  where h.colaborador_id = p_colaborador_id
    and h.ativo = true
    and h.data_vigencia <= p_data
  order by h.data_vigencia desc
  limit 1
$$;

-- Treinamentos realizados: a estrutura do participante passa a ser a vigente na DATA DO
-- TREINAMENTO (coalescida com o cadastro atual, pra eventos anteriores a este rastreio).
-- rh.vw_nr_colaborador (conformidade de NR) fica de fora de propósito — pendência de NR é
-- sempre sobre a estrutura ATUAL da pessoa, não a de quando ela fez o curso.
create or replace view rh.vw_treinamento_participantes
with (security_invoker = true)
as
select
  tp.id as participante_id,
  tp.treinamento_id,
  tp.colaborador_id,
  p.nome as colaborador_nome,
  coalesce(e.setor_id, c.setor_id) as setor_id,
  s.nome as setor_nome,
  c.status_rh,
  t.nome as treinamento_nome,
  t.tipo,
  t.nr_numero,
  n.nome as nr_nome,
  t.categoria_id,
  cat.nome as categoria_nome,
  t.data,
  t.carga_horaria,
  t.custo_total,
  t.instrutor,
  t.data_vencimento,
  coalesce(e.cargo_id, c.cargo_id) as cargo_id,
  cg.nome as cargo_nome,
  coalesce(e.nivel_id, c.nivel_id) as nivel_id,
  coalesce(e.eixo_id, c.eixo_id) as eixo_id,
  coalesce(e.gestor_colaborador_id, c.gestor_colaborador_id) as gestor_colaborador_id
from rh.treinamento_participantes tp
join rh.treinamentos t on t.id = tp.treinamento_id
join rh.colaboradores c on c.id = tp.colaborador_id
join core.pessoas p on p.id = c.pessoa_id
left join lateral rh.estrutura_vigente_em(c.id, t.data) e on true
left join rh.config_setores s on s.id = coalesce(e.setor_id, c.setor_id)
left join rh.config_cargos cg on cg.id = coalesce(e.cargo_id, c.cargo_id)
left join rh.config_categorias_treinamento cat on cat.id = t.categoria_id
left join rh.config_nrs_catalogo n on n.id = t.nr_numero;

grant select on rh.vw_treinamento_participantes to authenticated, service_role;

-- Desligamentos: estrutura vigente na DATA DO DESLIGAMENTO.
drop view rh.vw_desligamentos;

create view rh.vw_desligamentos
with (security_invoker = true)
as
select
  d.id,
  d.colaborador_id,
  p.nome as colaborador_nome,
  coalesce(e.cargo_id, c.cargo_id) as cargo_id,
  cg.nome as cargo_nome,
  coalesce(e.nivel_id, c.nivel_id) as nivel_id,
  coalesce(e.eixo_id, c.eixo_id) as eixo_id,
  coalesce(e.setor_id, c.setor_id) as setor_id,
  s.nome as setor_nome,
  coalesce(e.gestor_colaborador_id, c.gestor_colaborador_id) as gestor_colaborador_id,
  c.status_rh,
  d.data,
  d.tipo,
  d.motivo_id,
  m.motivo as motivo_nome,
  d.descricao,
  d.data_reativacao,
  d.ativo,
  d.criado_em
from rh.desligamentos d
join rh.colaboradores c on c.id = d.colaborador_id
join core.pessoas p on p.id = c.pessoa_id
left join lateral rh.estrutura_vigente_em(c.id, d.data) e on true
left join rh.config_cargos cg on cg.id = coalesce(e.cargo_id, c.cargo_id)
left join rh.config_setores s on s.id = coalesce(e.setor_id, c.setor_id)
left join rh.config_motivos_desligamento m on m.id = d.motivo_id;

grant select on rh.vw_desligamentos to authenticated, service_role;

-- Evolução salarial: estrutura vigente na DATA DA ALTERAÇÃO.
create or replace view rh.vw_historico_cargo_salarial
with (security_invoker = true)
as
select
  h.id,
  h.colaborador_id,
  p.nome as colaborador_nome,
  coalesce(e.cargo_id, c.cargo_id) as cargo_id,
  coalesce(e.setor_id, c.setor_id) as setor_id,
  coalesce(e.nivel_id, c.nivel_id) as nivel_id,
  coalesce(e.eixo_id, c.eixo_id) as eixo_id,
  coalesce(e.gestor_colaborador_id, c.gestor_colaborador_id) as gestor_colaborador_id,
  c.status_rh,
  h.data,
  h.cargo_anterior,
  h.cargo_novo,
  h.salario_anterior,
  h.salario_novo,
  h.motivo_id,
  m.motivo as motivo_nome
from rh.historico_cargo_salarial h
join rh.colaboradores c on c.id = h.colaborador_id
join core.pessoas p on p.id = c.pessoa_id
left join lateral rh.estrutura_vigente_em(c.id, h.data) e on true
left join rh.config_motivos_evolucao_salarial m on m.id = h.motivo_id
where h.ativo = true;

grant select on rh.vw_historico_cargo_salarial to authenticated, service_role;
