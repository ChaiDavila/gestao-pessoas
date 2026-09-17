-- View interna para a tela Evolução Salarial (seção 5.4): uma linha por alteração de
-- cargo/salário de TODOS os colaboradores, com os campos do colaborador (setor, função
-- atual, nível, eixo, gestor, status) disponíveis para filtro.
create view rh.vw_historico_cargo_salarial
with (security_invoker = true)
as
select
  h.id,
  h.colaborador_id,
  p.nome as colaborador_nome,
  c.cargo_id,
  c.setor_id,
  c.nivel_id,
  c.eixo_id,
  c.gestor_colaborador_id,
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
left join rh.config_motivos_evolucao_salarial m on m.id = h.motivo_id
where h.ativo = true;

grant select on rh.vw_historico_cargo_salarial to authenticated, service_role;
