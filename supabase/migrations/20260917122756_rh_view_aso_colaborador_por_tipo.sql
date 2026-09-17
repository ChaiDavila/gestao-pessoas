-- Ajuste: uma pessoa pode ter admissional, periódico, demissional etc. em datas bem
-- diferentes — mostrar só "o ASO mais recente" (ignorando o tipo) escondia isso. Agora é
-- o mais recente POR TIPO de exame, igual à granularidade usada em rh.vw_nr_colaborador.
create or replace view rh.vw_aso_colaborador
with (security_invoker = true)
as
select distinct on (a.colaborador_id, a.tipo_exame)
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
order by a.colaborador_id, a.tipo_exame, a.data desc;
