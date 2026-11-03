-- A colocação (1º a 12º) de cada força é sempre derivada ordenando as 12 pontuações na
-- hora de exibir (ver migration anterior) — mas quando duas forças empatam no mesmo valor
-- arredondado, não dá pra deduzir sozinho qual vem primeiro: o relatório de origem usa
-- casas decimais que o sistema não guarda. Nesse caso (raro), a área de RH registra aqui
-- manualmente a ordem de desempate, só para as forças empatadas — null/sem entrada = usa a
-- ordem padrão dos continuuns como critério de desempate.
alter table rh.perfil_comportamental
  add column desempate_forcas text[];
