-- View de leitura da ficha do colaborador: histórico de função/nível/eixo/setor/gestor com
-- os nomes já resolvidos (inclusive de itens hoje desativados no catálogo, pra não perder a
-- legenda de um registro antigo). Nenhuma tabela nova — só expõe
-- rh.historico_estrutura_organizacional (já existente) de um jeito pronto pra exibir.
create view rh.vw_historico_estrutura_colaborador
with (security_invoker = true)
as
select
  h.id,
  h.colaborador_id,
  h.data_vigencia,
  h.cargo_id,
  cg.nome as cargo_nome,
  h.nivel_id,
  nv.nome as nivel_nome,
  h.eixo_id,
  ex.nome as eixo_nome,
  h.setor_id,
  st.nome as setor_nome,
  h.gestor_colaborador_id,
  gp.nome as gestor_nome
from rh.historico_estrutura_organizacional h
left join rh.config_cargos cg on cg.id = h.cargo_id
left join rh.config_niveis nv on nv.id = h.nivel_id
left join rh.config_eixos ex on ex.id = h.eixo_id
left join rh.config_setores st on st.id = h.setor_id
left join rh.colaboradores gc on gc.id = h.gestor_colaborador_id
left join core.pessoas gp on gp.id = gc.pessoa_id
where h.ativo = true;

grant select on rh.vw_historico_estrutura_colaborador to authenticated, service_role;
