-- View interna para a tela Desligamentos (seção 5.3): histórico completo, com nome/cargo/setor
-- do colaborador e nome do motivo, sem depender de embutimento PostgREST entre schemas.
create view rh.vw_desligamentos
with (security_invoker = true)
as
select
  d.id,
  d.colaborador_id,
  p.nome as colaborador_nome,
  cg.nome as cargo_nome,
  s.nome as setor_nome,
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
left join rh.config_cargos cg on cg.id = c.cargo_id
left join rh.config_setores s on s.id = c.setor_id
left join rh.config_motivos_desligamento m on m.id = d.motivo_id;

grant select on rh.vw_desligamentos to authenticated, service_role;
