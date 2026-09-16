-- Sem estes GRANTs, o Postgres nega o acesso antes mesmo de avaliar as políticas de RLS
-- (RLS restringe LINHAS de uma operação já permitida a nível de privilégio, não substitui o GRANT).

grant usage on schema core to authenticated;
grant usage on schema rh to authenticated;

grant select, insert, update, delete on all tables in schema core to authenticated;
grant select, insert, update, delete on all tables in schema rh to authenticated;

alter default privileges in schema core
  grant select, insert, update, delete on tables to authenticated;
alter default privileges in schema rh
  grant select, insert, update, delete on tables to authenticated;
