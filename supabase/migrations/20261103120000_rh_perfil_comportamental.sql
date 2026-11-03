-- Perfil Comportamental: DISC Natural + 12 Forças Impulsionadoras, um registro por
-- colaborador (sem histórico de reavaliação nesta primeira versão — reavaliar substitui o
-- registro existente). Entrada manual, lida a partir do relatório em PDF da ferramenta de
-- avaliação. Os 12 pares de força são um framework fixo (6 continuuns), por isso viram
-- colunas nomeadas em vez de catálogo editável em Configurações — não é algo que a área de
-- RH vai querer renomear ou reordenar. O ranking de cada força (1 a 12) não é guardado: é
-- sempre derivado ordenando as 12 pontuações na hora de exibir.
create table rh.perfil_comportamental (
  id uuid primary key default gen_random_uuid(),
  unidade_id uuid not null references core.unidades(id),
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  criado_por uuid,
  atualizado_em timestamptz not null default now(),
  atualizado_por uuid,

  colaborador_id uuid not null references rh.colaboradores(id) on delete cascade,
  data_avaliacao date,

  -- DISC Natural (0-100 cada, independentes — não precisam somar 100)
  disc_d int not null check (disc_d between 0 and 100),
  disc_i int not null check (disc_i between 0 and 100),
  disc_s int not null check (disc_s between 0 and 100),
  disc_c int not null check (disc_c between 0 and 100),

  -- 12 Forças Impulsionadoras, em pares (continuum):
  -- Conhecimento: Instintivo x Intelectual
  forca_instintivo int not null check (forca_instintivo between 0 and 100),
  forca_intelectual int not null check (forca_intelectual between 0 and 100),
  -- Utilidade: Desprendido x Eficiente
  forca_desprendido int not null check (forca_desprendido between 0 and 100),
  forca_eficiente int not null check (forca_eficiente between 0 and 100),
  -- Ambiente: Objetivo x Harmonioso
  forca_objetivo int not null check (forca_objetivo between 0 and 100),
  forca_harmonioso int not null check (forca_harmonioso between 0 and 100),
  -- Outros: Intencional x Altruísta
  forca_intencional int not null check (forca_intencional between 0 and 100),
  forca_altruista int not null check (forca_altruista between 0 and 100),
  -- Poder: Participante x Comandante
  forca_participante int not null check (forca_participante between 0 and 100),
  forca_comandante int not null check (forca_comandante between 0 and 100),
  -- Metodologias: Receptivo x Estruturado
  forca_receptivo int not null check (forca_receptivo between 0 and 100),
  forca_estruturado int not null check (forca_estruturado between 0 and 100),

  unique (colaborador_id)
);

alter table rh.perfil_comportamental enable row level security;
create trigger trg_atualizado before update on rh.perfil_comportamental
  for each row execute function core.tg_set_atualizado();

-- Visível pra qualquer leitor+ do RH, igual às demais abas da ficha do colaborador.
create policy select_rh on rh.perfil_comportamental for select
  using (core.tem_papel('rh', array['leitor', 'operador', 'gestor', 'admin']));
create policy insert_rh on rh.perfil_comportamental for insert
  with check (core.tem_papel('rh', array['operador', 'gestor', 'admin']));
create policy update_rh on rh.perfil_comportamental for update
  using (core.tem_papel('rh', array['operador', 'gestor', 'admin']))
  with check (core.tem_papel('rh', array['operador', 'gestor', 'admin']));
create policy delete_rh on rh.perfil_comportamental for delete
  using (core.tem_papel('rh', array['gestor', 'admin']));
grant select, insert, update, delete on rh.perfil_comportamental to authenticated, service_role;

-- Resumo leve (só o DISC) pra alimentar o badge na listagem de colaboradores, sem puxar as
-- 12 colunas de força à toa pra cada linha da tabela.
create view rh.vw_perfil_disc_resumo
with (security_invoker = true)
as
select colaborador_id, disc_d, disc_i, disc_s, disc_c
from rh.perfil_comportamental
where ativo = true;

grant select on rh.vw_perfil_disc_resumo to authenticated, service_role;
