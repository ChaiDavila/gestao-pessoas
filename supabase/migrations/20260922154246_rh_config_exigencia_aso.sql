-- Nem todo tipo de contrato precisa de acompanhamento de ASO/PGR (ex.: PJ e Estágio nesta
-- empresa não entram no PCMSO) — esta tabela deixa isso configurável por tipo de contrato em
-- vez de fixo no código, editável em Configurações → ASO e PGR.
create table rh.config_exigencia_aso (
  id uuid primary key default gen_random_uuid(),
  unidade_id uuid not null references core.unidades(id),
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  criado_por uuid,
  atualizado_em timestamptz not null default now(),
  atualizado_por uuid,
  tipo_contrato text not null unique check (
    tipo_contrato in ('CLT', 'Estágio', 'Aprendiz', 'PJ', 'Temporário', 'Pró-labore')
  ),
  exige_aso boolean not null default true
);

alter table rh.config_exigencia_aso enable row level security;

create trigger trg_atualizado
  before update on rh.config_exigencia_aso
  for each row execute function core.tg_set_atualizado();

create policy select_rh on rh.config_exigencia_aso for select
  using (core.tem_papel('rh', array['leitor', 'operador', 'gestor', 'admin']));
create policy insert_rh on rh.config_exigencia_aso for insert
  with check (core.tem_papel('rh', array['operador', 'gestor', 'admin']));
create policy update_rh on rh.config_exigencia_aso for update
  using (core.tem_papel('rh', array['operador', 'gestor', 'admin']))
  with check (core.tem_papel('rh', array['operador', 'gestor', 'admin']));
create policy delete_rh on rh.config_exigencia_aso for delete
  using (core.tem_papel('rh', array['gestor', 'admin']));

grant select, insert, update, delete on rh.config_exigencia_aso to authenticated, service_role;

-- Default: PJ e Estágio não exigem ASO (pedido explícito da área de RH); os demais tipos de
-- contrato (relação de emprego CLT-like) continuam exigindo, até a área decidir o contrário
-- na tela de Configurações.
do $$
declare
  v_unidade_id uuid;
begin
  select id into v_unidade_id from core.unidades limit 1;

  insert into rh.config_exigencia_aso (unidade_id, tipo_contrato, exige_aso) values
    (v_unidade_id, 'CLT', true),
    (v_unidade_id, 'Estágio', false),
    (v_unidade_id, 'Aprendiz', true),
    (v_unidade_id, 'PJ', false),
    (v_unidade_id, 'Temporário', true),
    (v_unidade_id, 'Pró-labore', true);
end $$;
