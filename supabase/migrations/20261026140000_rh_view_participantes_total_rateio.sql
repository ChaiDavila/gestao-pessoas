-- rh.vw_treinamento_participantes mostrava t.custo_total (custo TOTAL do treinamento/turma)
-- em cada linha de participação — "Por colaborador" (e a aba Treinamentos da ficha do
-- colaborador) exibiam esse valor como se fosse o custo daquele colaborador, inflando o
-- gasto de quem fez curso em turma. Acrescenta total_participantes (mesmo cálculo já usado
-- em rh.vw_treinamentos) pra quem exibe o custo poder ratear: custo_total / total_participantes.
create or replace view rh.vw_treinamento_participantes
with (security_invoker = true)
as
select
  tp.id as participante_id,
  tp.treinamento_id,
  tp.colaborador_id,
  p.nome as colaborador_nome,
  c.setor_id,
  s.nome as setor_nome,
  c.status_rh,
  t.nome as treinamento_nome,
  t.tipo,
  t.nr_numero,
  n.nome as nr_nome,
  t.categoria_id,
  cat.nome as categoria_nome,
  t.data,
  t.carga_horaria,
  t.custo_total,
  t.instrutor,
  t.data_vencimento,
  c.cargo_id,
  cg.nome as cargo_nome,
  c.nivel_id,
  c.eixo_id,
  c.gestor_colaborador_id,
  (
    select count(*)::int
    from rh.treinamento_participantes tp2
    where tp2.treinamento_id = t.id
  ) as total_participantes
from rh.treinamento_participantes tp
join rh.treinamentos t on t.id = tp.treinamento_id
join rh.colaboradores c on c.id = tp.colaborador_id
join core.pessoas p on p.id = c.pessoa_id
left join rh.config_setores s on s.id = c.setor_id
left join rh.config_cargos cg on cg.id = c.cargo_id
left join rh.config_categorias_treinamento cat on cat.id = t.categoria_id
left join rh.config_nrs_catalogo n on n.id = t.nr_numero;

grant select on rh.vw_treinamento_participantes to authenticated, service_role;
