-- Planejamento de Gente: ação pontual pode durar mais de um dia (ex.: CONCARH, 08 e 09/07),
-- até no máximo 7 dias. Diferente da atividade com período, ela aparece em todos os dias
-- do calendário. data_fim continua nula para a ação pontual de um dia só.

alter table rh.planejamento_acoes drop constraint planejamento_acoes_datas_ck;
alter table rh.planejamento_acoes
  add constraint planejamento_acoes_datas_ck check (
    (
      tipo = 'pontual'
      and (data_fim is null or (data_fim > data_inicio and data_fim - data_inicio <= 6))
    )
    or (tipo = 'periodo' and data_fim is not null and data_fim >= data_inicio)
    or (
      tipo = 'verba'
      and data_inicio = make_date(extract(year from data_inicio)::int, 1, 1)
      and data_fim = make_date(extract(year from data_inicio)::int, 12, 31)
    )
  );
