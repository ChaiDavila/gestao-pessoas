-- service_role é usado por rotinas server-side/admin que precisam ignorar RLS (ex.: futura
-- integração com Bitrix24 via Edge Function, seeds administrativos). anon continua sem
-- nenhum acesso a core/rh de propósito — este app exige login.

grant usage on schema core to service_role;
grant usage on schema rh to service_role;

grant select, insert, update, delete on all tables in schema core to service_role;
grant select, insert, update, delete on all tables in schema rh to service_role;

alter default privileges in schema core
  grant select, insert, update, delete on tables to service_role;
alter default privileges in schema rh
  grant select, insert, update, delete on tables to service_role;
