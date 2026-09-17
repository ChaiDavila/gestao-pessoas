-- View interna para a tela Perfil Familiar (seção 5.7): dependentes com os dados do
-- colaborador responsável já resolvidos (para filtro por setor/gestor/status e exibição).
create view rh.vw_dependentes
with (security_invoker = true)
as
select
  d.id,
  d.colaborador_id,
  p.nome as colaborador_nome,
  c.setor_id,
  s.nome as setor_nome,
  c.gestor_colaborador_id,
  c.status_rh,
  d.nome,
  d.parentesco,
  d.data_nascimento,
  d.sexo
from rh.dependentes d
join rh.colaboradores c on c.id = d.colaborador_id
join core.pessoas p on p.id = c.pessoa_id
left join rh.config_setores s on s.id = c.setor_id
where d.ativo = true;

grant select on rh.vw_dependentes to authenticated, service_role;
