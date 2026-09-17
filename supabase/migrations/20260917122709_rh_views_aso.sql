-- Views internas para a tela ASO (seção 5.6).

-- Registro de ASO mais recente de cada colaborador (independe de qualquer filtro de
-- período — mesma regra da seção 7.1 aplicada aqui).
create view rh.vw_aso_colaborador
with (security_invoker = true)
as
select distinct on (a.colaborador_id)
  a.colaborador_id,
  p.nome as colaborador_nome,
  c.cargo_id,
  cg.nome as cargo_nome,
  c.setor_id,
  s.nome as setor_nome,
  c.status_rh,
  a.id as registro_id,
  a.tipo_exame,
  a.data,
  a.resultado,
  a.data_vencimento
from rh.aso_registros a
join rh.colaboradores c on c.id = a.colaborador_id
join core.pessoas p on p.id = c.pessoa_id
left join rh.config_cargos cg on cg.id = c.cargo_id
left join rh.config_setores s on s.id = c.setor_id
order by a.colaborador_id, a.data desc;

grant select on rh.vw_aso_colaborador to authenticated, service_role;

-- Para cada colaborador, para cada exame complementar exigido pelo cargo dele (PGR via
-- rh.config_exames_por_funcao), o registro mais recente daquele exame para aquela pessoa
-- (ou nulo, se nunca foi feito). Um colaborador cujo cargo não tem nenhum exame mapeado
-- simplesmente não aparece aqui (nenhuma exigência de PGR cadastrada para a função dele).
create view rh.vw_pgr_colaborador
with (security_invoker = true)
as
select
  c.id as colaborador_id,
  p.nome as colaborador_nome,
  c.cargo_id,
  cg.nome as cargo_nome,
  c.setor_id,
  s.nome as setor_nome,
  c.status_rh,
  cef.exame_id,
  te.nome as exame_nome,
  te.periodicidade_meses,
  ultimo.id as registro_id,
  ultimo.data,
  ultimo.data_vencimento
from rh.colaboradores c
join core.pessoas p on p.id = c.pessoa_id
join rh.config_exames_por_funcao cef on cef.cargo_id = c.cargo_id and cef.ativo = true
join rh.config_tipos_exame te on te.id = cef.exame_id
left join rh.config_cargos cg on cg.id = c.cargo_id
left join rh.config_setores s on s.id = c.setor_id
left join lateral (
  select ecr.id, ecr.data, ecr.data_vencimento
  from rh.exames_complementares_registros ecr
  where ecr.colaborador_id = c.id and ecr.exame_id = cef.exame_id
  order by ecr.data desc
  limit 1
) ultimo on true;

grant select on rh.vw_pgr_colaborador to authenticated, service_role;
