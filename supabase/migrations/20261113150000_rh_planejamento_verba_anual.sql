-- Planejamento de Gente: novo tipo "verba" (verba anual), um orçamento do ano sem data de
-- evento (ex.: aniversariantes do mês, R$ 1.000/ano, compras em datas variadas).
-- Só aparece na aba Orçamentos (não entra em calendário, visão anual nem pendências).
-- O ano fica representado por data_inicio = 01/01 e data_fim = 31/12 do mesmo ano, o que
-- mantém as consultas por data e o "Duplicar para o ano" funcionando sem caso especial.
-- As compras continuam em rh.planejamento_despesas, cada uma com a data em que foi feita.

alter table rh.planejamento_acoes drop constraint planejamento_acoes_tipo_check;
alter table rh.planejamento_acoes
  add constraint planejamento_acoes_tipo_check check (tipo in ('pontual', 'periodo', 'verba'));

alter table rh.planejamento_acoes drop constraint planejamento_acoes_datas_ck;
alter table rh.planejamento_acoes
  add constraint planejamento_acoes_datas_ck check (
    (tipo = 'pontual' and data_fim is null)
    or (tipo = 'periodo' and data_fim is not null and data_fim >= data_inicio)
    or (
      tipo = 'verba'
      and data_inicio = make_date(extract(year from data_inicio)::int, 1, 1)
      and data_fim = make_date(extract(year from data_inicio)::int, 12, 31)
    )
  );
