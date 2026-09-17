-- View interna (uso da aplicação, não confundir com rh.vw_pub_colaboradores que é para o
-- Portal Central): junta rh.colaboradores com core.pessoas e os catálogos, expondo tanto os
-- ids (para filtros/edição) quanto os nomes (para exibição), sem precisar de embutimento
-- PostgREST entre schemas diferentes (core x rh), que não é suportado numa única request.
create view rh.vw_colaboradores
with (security_invoker = true)
as
select
  c.id,
  c.unidade_id,
  c.ativo,
  c.criado_em,
  c.atualizado_em,
  c.pessoa_id,
  p.nome,
  p.cpf,
  p.data_nascimento,
  c.matricula,
  c.rg,
  c.pis_pasep,
  c.sexo,
  c.estado_civil,
  c.conjuge_nome,
  c.conjuge_sexo,
  c.email_pessoal,
  c.telefone_pessoal,
  c.numero_corporativo,
  c.endereco_rua,
  c.endereco_numero,
  c.endereco_complemento,
  c.endereco_bairro,
  c.endereco_cidade,
  c.endereco_estado,
  c.endereco_cep,
  c.contato_emergencia_nome,
  c.contato_emergencia_telefone,
  c.cargo_id,
  cg.nome as cargo_nome,
  c.cbo,
  c.setor_id,
  s.nome as setor_nome,
  c.nivel_id,
  n.nome as nivel_nome,
  n.ordem as nivel_ordem,
  c.eixo_id,
  e.nome as eixo_nome,
  c.gestor_colaborador_id,
  gp.nome as gestor_nome,
  c.data_admissao,
  c.tipo_contrato,
  c.regime_trabalho,
  c.salario_atual,
  c.salario_admissional,
  c.status_rh
from rh.colaboradores c
join core.pessoas p on p.id = c.pessoa_id
left join rh.config_cargos cg on cg.id = c.cargo_id
left join rh.config_setores s on s.id = c.setor_id
left join rh.config_niveis n on n.id = c.nivel_id
left join rh.config_eixos e on e.id = c.eixo_id
left join rh.colaboradores g on g.id = c.gestor_colaborador_id
left join core.pessoas gp on gp.id = g.pessoa_id;

grant select on rh.vw_colaboradores to authenticated, service_role;
