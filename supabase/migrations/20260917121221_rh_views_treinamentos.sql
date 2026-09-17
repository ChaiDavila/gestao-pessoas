-- Views internas para a tela Treinamentos (seção 5.5).

-- Uma linha por treinamento (para a lista "Treinamentos gerais" e cadastro em geral),
-- com nome da categoria/NR e contagem de participantes.
create view rh.vw_treinamentos
with (security_invoker = true)
as
select
  t.id,
  t.nome,
  t.tipo,
  t.nr_numero,
  n.nome as nr_nome,
  t.categoria_id,
  cat.nome as categoria_nome,
  t.data,
  t.carga_horaria,
  t.instrutor,
  t.custo_total,
  t.data_vencimento,
  (
    select count(*)::int
    from rh.treinamento_participantes tp
    where tp.treinamento_id = t.id
  ) as total_participantes
from rh.treinamentos t
left join rh.config_categorias_treinamento cat on cat.id = t.categoria_id
left join rh.config_nrs_catalogo n on n.id = t.nr_numero;

grant select on rh.vw_treinamentos to authenticated, service_role;

-- Uma linha por participação (treinamento x colaborador), com dados do colaborador e do
-- treinamento já resolvidos. Alimenta os indicadores agregados e a aba "Por colaborador".
create view rh.vw_treinamento_participantes
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
  t.data_vencimento
from rh.treinamento_participantes tp
join rh.treinamentos t on t.id = tp.treinamento_id
join rh.colaboradores c on c.id = tp.colaborador_id
join core.pessoas p on p.id = c.pessoa_id
left join rh.config_setores s on s.id = c.setor_id
left join rh.config_categorias_treinamento cat on cat.id = t.categoria_id
left join rh.config_nrs_catalogo n on n.id = t.nr_numero;

grant select on rh.vw_treinamento_participantes to authenticated, service_role;

-- Uma linha por (colaborador, NR) com o registro MAIS RECENTE daquele curso para aquela
-- pessoa — independe de qualquer filtro de período da tela (regra de negócio da seção 7.1:
-- o status de conformidade sempre olha o último registro, nunca o recorte selecionado).
create view rh.vw_nr_colaborador
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
  t.instrutor
from rh.treinamento_participantes tp
join rh.treinamentos t on t.id = tp.treinamento_id and t.tipo = 'NR'
join rh.config_nrs_catalogo n on n.id = t.nr_numero
join rh.colaboradores c on c.id = tp.colaborador_id
join core.pessoas p on p.id = c.pessoa_id
left join rh.config_setores s on s.id = c.setor_id
order by tp.colaborador_id, t.nr_numero, t.data desc;

grant select on rh.vw_nr_colaborador to authenticated, service_role;
