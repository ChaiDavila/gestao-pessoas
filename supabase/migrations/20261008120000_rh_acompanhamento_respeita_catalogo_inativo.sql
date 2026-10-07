-- Desativar um curso de NR (ou tipo de exame complementar) no catálogo significa "não é
-- mais obrigatório fazer" — isso deve parar os alertas/indicadores de pendência pra quem
-- já estava sendo acompanhado, automaticamente, SEM apagar nenhum registro, certificado ou
-- a escolha individual de acompanhamento da pessoa (rh.colaborador_nr_acompanhamento /
-- rh.colaborador_exame_acompanhamento continuam intocadas). Se o curso/exame for
-- reativado depois, os alertas voltam sozinhos — não precisa reconfigurar pessoa por
-- pessoa.
--
-- Implementação: `acompanhar` exposto pelas views passa a ser
-- "a pessoa escolheu acompanhar E o curso/exame ainda está ativo no catálogo", calculado
-- na view, nunca gravado de volta na tabela de acompanhamento.
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
  (a.acompanhar and n.ativo) as acompanhar,
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
  (a.acompanhar and te.ativo) as acompanhar,
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
