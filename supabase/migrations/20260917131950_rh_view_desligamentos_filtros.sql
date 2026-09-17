-- Adiciona os ids necessários para filtrar a tela Desligamentos por função, nível, eixo,
-- setor, gestor e status do colaborador (a view só tinha os nomes até aqui).
-- CREATE OR REPLACE não permite inserir colunas no meio da lista existente, por isso
-- recriamos a view do zero.
drop view rh.vw_desligamentos;

create view rh.vw_desligamentos
with (security_invoker = true)
as
select
  d.id,
  d.colaborador_id,
  p.nome as colaborador_nome,
  c.cargo_id,
  cg.nome as cargo_nome,
  c.nivel_id,
  c.eixo_id,
  c.setor_id,
  s.nome as setor_nome,
  c.gestor_colaborador_id,
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
left join rh.config_cargos cg on cg.id = c.cargo_id
left join rh.config_setores s on s.id = c.setor_id
left join rh.config_motivos_desligamento m on m.id = d.motivo_id;

grant select on rh.vw_desligamentos to authenticated, service_role;
