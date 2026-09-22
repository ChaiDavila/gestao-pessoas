-- Restrição opcional de acesso por tela, por usuário. NULL = acesso a todas as telas
-- (comportamento atual, preservado para todo usuário já cadastrado). Quando preenchida,
-- a lista de ids de tela (ver src/lib/nav.ts) define o que aparece no menu e quais rotas
-- o usuário consegue abrir — é uma restrição de navegação em cima do papel (leitor/
-- operador/gestor/admin), que continua sendo o que a RLS do banco de fato aplica.
alter table core.usuarios_areas
  add column escopo_telas text[];

comment on column core.usuarios_areas.escopo_telas is
  'Ids de tela (rh) que o usuário pode acessar; NULL = acesso a todas as telas.';
