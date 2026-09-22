-- Acrescenta cargo_id/nivel_id/eixo_id/gestor_colaborador_id às views de Treinamentos, no
-- mesmo padrão de rh.vw_desligamentos — necessário pros filtros de Função/Nível/Eixo/Gestor
-- (múltipla escolha) na tela de Treinamentos, que hoje só tinha setor_id/status_rh.
create or replace view rh.vw_treinamento_participantes
with (security_invoker = true)
as
select
  tp.id as participante_id,
  tp.treinamento_id,
  tp.colaborador_id,
  p.nome as colaborador_nome,
  c.setor_id,
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
  c.cargo_id,
  cg.nome as cargo_nome,
  c.nivel_id,
  c.eixo_id,
  c.gestor_colaborador_id
from rh.treinamento_participantes tp
join rh.treinamentos t on t.id = tp.treinamento_id
join rh.colaboradores c on c.id = tp.colaborador_id
join core.pessoas p on p.id = c.pessoa_id
left join rh.config_setores s on s.id = c.setor_id
left join rh.config_cargos cg on cg.id = c.cargo_id
left join rh.config_categorias_treinamento cat on cat.id = t.categoria_id
left join rh.config_nrs_catalogo n on n.id = t.nr_numero;

grant select on rh.vw_treinamento_participantes to authenticated, service_role;

create or replace view rh.vw_nr_colaborador
with (security_invoker = true)
as
select distinct on (tp.colaborador_id, t.nr_numero)
  tp.colaborador_id,
  p.nome as colaborador_nome,
  c.setor_id,
  s.nome as setor_nome,
  c.status_rh,
  t.nr_numero,
  n.nr,
  n.nome as nr_nome,
  n.periodicidade_meses,
  t.id as treinamento_id,
  t.data,
  t.data_vencimento,
  t.carga_horaria,
  t.custo_total,
  t.instrutor,
  c.cargo_id,
  cg.nome as cargo_nome,
  c.nivel_id,
  c.eixo_id,
  c.gestor_colaborador_id
from rh.treinamento_participantes tp
join rh.treinamentos t on t.id = tp.treinamento_id and t.tipo = 'NR'
join rh.config_nrs_catalogo n on n.id = t.nr_numero
join rh.colaboradores c on c.id = tp.colaborador_id
join core.pessoas p on p.id = c.pessoa_id
left join rh.config_setores s on s.id = c.setor_id
left join rh.config_cargos cg on cg.id = c.cargo_id
order by tp.colaborador_id, t.nr_numero, t.data desc;

grant select on rh.vw_nr_colaborador to authenticated, service_role;
