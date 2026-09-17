-- Treinamentos de NR não usam o catálogo de categorias (já são categorizados pelo próprio
-- curso de NR/segurança do trabalho) — só treinamentos gerais exigem categoria_id.
alter table rh.treinamentos alter column categoria_id drop not null;

alter table rh.treinamentos
  add constraint chk_categoria_coerente check (
    (tipo = 'geral' and categoria_id is not null) or (tipo = 'NR')
  );
