-- View interna para o gráfico "Formação" do Dashboard (seção 5.1): a formação mais
-- recente cadastrada de cada colaborador (regra da seção 7.7 — sempre a de criado_em
-- mais recente, nunca uma flag separada de "principal").
create view rh.vw_formacao_atual
with (security_invoker = true)
as
select distinct on (f.colaborador_id)
  f.colaborador_id,
  f.nivel_id,
  cf.nome as nivel_nome,
  cf.ordem
from rh.formacoes f
join rh.config_formacoes cf on cf.id = f.nivel_id
where f.ativo = true
order by f.colaborador_id, f.criado_em desc;

grant select on rh.vw_formacao_atual to authenticated, service_role;
