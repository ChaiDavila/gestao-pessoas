create table rh.colaboradores (
  id uuid primary key default gen_random_uuid(),
  unidade_id uuid not null references core.unidades(id),
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  criado_por uuid,
  atualizado_em timestamptz not null default now(),
  atualizado_por uuid,

  pessoa_id uuid not null unique references core.pessoas(id),
  matricula text not null unique,
  rg text,
  pis_pasep text,
  sexo text check (sexo in ('M', 'F')),
  estado_civil text not null default 'Não informado'
    check (estado_civil in ('Solteiro(a)', 'Casado(a)', 'Divorciado(a)', 'Viúvo(a)', 'União estável', 'Não informado')),
  conjuge_nome text,
  conjuge_sexo text check (conjuge_sexo in ('M', 'F')),
  email_pessoal text,
  telefone_pessoal text,
  numero_corporativo text,
  endereco_rua text,
  endereco_numero text,
  endereco_complemento text,
  endereco_bairro text,
  endereco_cidade text,
  endereco_estado text,
  endereco_cep text,
  contato_emergencia_nome text,
  contato_emergencia_telefone text,

  cargo_id uuid references rh.config_cargos(id),
  cbo text,
  setor_id uuid references rh.config_setores(id),
  nivel_id uuid references rh.config_niveis(id),
  eixo_id uuid references rh.config_eixos(id),
  gestor_colaborador_id uuid references rh.colaboradores(id) on delete set null,

  data_admissao date not null,
  tipo_contrato text not null check (tipo_contrato in ('CLT', 'Estágio', 'Aprendiz', 'PJ', 'Temporário', 'Pró-labore')),
  regime_trabalho text not null check (regime_trabalho in ('Presencial', 'Híbrido', 'Remoto', 'Home Office')),
  salario_atual numeric(14, 2),
  salario_admissional numeric(14, 2),

  -- status do vínculo empregatício; não confundir com a coluna "ativo" de auditoria acima.
  status_rh text not null default 'ativo' check (status_rh in ('ativo', 'desligado'))
);

create index idx_colaboradores_setor on rh.colaboradores (setor_id);
create index idx_colaboradores_gestor on rh.colaboradores (gestor_colaborador_id);
create index idx_colaboradores_status on rh.colaboradores (status_rh);

-- View de integração: o Portal Central consulta headcount por aqui, sem acessar a tabela base.
create view rh.vw_pub_colaboradores
with (security_invoker = true)
as
select
  c.id,
  c.pessoa_id,
  c.unidade_id,
  c.matricula,
  cg.nome as cargo,
  s.nome as setor,
  c.status_rh,
  c.data_admissao,
  c.ativo,
  c.criado_em,
  c.atualizado_em
from rh.colaboradores c
left join rh.config_cargos cg on cg.id = c.cargo_id
left join rh.config_setores s on s.id = c.setor_id;

grant usage on schema rh to authenticated;
grant select on rh.vw_pub_colaboradores to authenticated;
