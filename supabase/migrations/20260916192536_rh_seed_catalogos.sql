-- Seed dos catálogos de Configurações, extraído literalmente dos dados já validados com a
-- área de RH no protótipo (docs/coontrol-rh-prototipo.html, bloco `const config = {...}`).
-- config_exames_por_funcao é explicitamente marcado no protótipo como "EXEMPLO ilustrativo"
-- do PGR — a COONTROL deve revisar/ajustar essas linhas em Configurações → ASO e PGR.

do $$
declare
  v_unidade_id uuid;
begin
  select id into v_unidade_id from core.unidades limit 1;

  insert into rh.config_setores (unidade_id, nome) values
    (v_unidade_id, 'Administrativo e Financeiro'),
    (v_unidade_id, 'Comercial e Marketing'),
    (v_unidade_id, 'Engenharia de Performance do Cliente'),
    (v_unidade_id, 'Gente e Gestão'),
    (v_unidade_id, 'Inovação e Tecnologia - Hardware'),
    (v_unidade_id, 'Inovação e Tecnologia - Software'),
    (v_unidade_id, 'Produção'),
    (v_unidade_id, 'Serviço');

  insert into rh.config_cargos (unidade_id, nome, cbo) values
    (v_unidade_id, 'Analista Administrativo Financeiro', '4110-05'),
    (v_unidade_id, 'Analista de Gente e Gestão', '2524-05'),
    (v_unidade_id, 'Analista de Marketing e Comercial', '3541-25'),
    (v_unidade_id, 'Assistente Administrativo Financeiro', '4110-05'),
    (v_unidade_id, 'Assistente de Marketing e Comercial', '3541-25'),
    (v_unidade_id, 'Comprador Júnior', '3542-05'),
    (v_unidade_id, 'Desenvolvedor de Eletrônica Júnior', '3171-10'),
    (v_unidade_id, 'Desenvolvedor de Eletrônica Mentor Técnico', '3171-10'),
    (v_unidade_id, 'Desenvolvedor de Eletrônica Sênior', '3171-10'),
    (v_unidade_id, 'Desenvolvedor de Software Júnior', '2124-05'),
    (v_unidade_id, 'Desenvolvedor de Software Pleno', '2124-05'),
    (v_unidade_id, 'Diretor', '1231-05'),
    (v_unidade_id, 'Diretor de Gente e Gestão', '1231-05'),
    (v_unidade_id, 'Estágio', null),
    (v_unidade_id, 'Gerente de Engenharia de Performance do Cliente', '1423-10'),
    (v_unidade_id, 'Gerente de Inovação e Tecnologia', '1425-10'),
    (v_unidade_id, 'Gerente de Marketing', null),
    (v_unidade_id, 'Gerente de Produção', '1412-05'),
    (v_unidade_id, 'Gerente de Serviços', '1414-20'),
    (v_unidade_id, 'Pesquisador em Física Mentor Técnico', '2031-15'),
    (v_unidade_id, 'Projetista Sênior', '3186-10'),
    (v_unidade_id, 'Técnico Externo Júnior', '3001-05'),
    (v_unidade_id, 'Técnico Externo Sênior', '3001-05'),
    (v_unidade_id, 'Técnico Interno Júnior', '3912-20'),
    (v_unidade_id, 'Técnico Interno Pleno', '3912-20'),
    (v_unidade_id, 'Vendedor', null);

  insert into rh.config_niveis (unidade_id, nome, ordem) values
    (v_unidade_id, 'Iniciante', 1),
    (v_unidade_id, 'Intermediário', 2),
    (v_unidade_id, 'Avançado', 3),
    (v_unidade_id, 'Especialista', 4),
    (v_unidade_id, 'Tático', 5),
    (v_unidade_id, 'Estratégico', 6);

  insert into rh.config_eixos (unidade_id, nome) values
    (v_unidade_id, 'Apoio'),
    (v_unidade_id, 'Técnico'),
    (v_unidade_id, 'Mercadológico'),
    (v_unidade_id, 'Gestão');

  insert into rh.config_motivos_desligamento (unidade_id, motivo, tipo_padrao) values
    (v_unidade_id, 'Pedido de demissão', 'voluntario'),
    (v_unidade_id, 'Nova oportunidade profissional', 'voluntario'),
    (v_unidade_id, 'Inadaptação com a cultura da COONTROL', 'involuntario'),
    (v_unidade_id, 'Baixa produtividade', 'involuntario'),
    (v_unidade_id, 'Justa causa', 'involuntario'),
    (v_unidade_id, 'Sem justa causa', 'involuntario'),
    (v_unidade_id, 'Fim de contrato de experiência', 'involuntario'),
    (v_unidade_id, 'Aposentadoria', 'voluntario'),
    (v_unidade_id, 'Outro', 'involuntario');

  insert into rh.config_motivos_evolucao_salarial (unidade_id, motivo) values
    (v_unidade_id, 'Promoção'),
    (v_unidade_id, 'Reajuste geral'),
    (v_unidade_id, 'Mérito'),
    (v_unidade_id, 'Equiparação salarial'),
    (v_unidade_id, 'Mudança de função'),
    (v_unidade_id, 'Outro');

  insert into rh.config_categorias_treinamento (unidade_id, nome) values
    (v_unidade_id, 'Segurança do Trabalho'),
    (v_unidade_id, 'Técnico'),
    (v_unidade_id, 'Comportamental'),
    (v_unidade_id, 'Liderança e Gestão'),
    (v_unidade_id, 'Compliance/Regulatório'),
    (v_unidade_id, 'Integração (Onboarding)'),
    (v_unidade_id, 'Idiomas'),
    (v_unidade_id, 'Outro');

  insert into rh.config_formacoes (unidade_id, nome, ordem) values
    (v_unidade_id, 'Ensino Fundamental', 1),
    (v_unidade_id, 'Ensino Médio', 2),
    (v_unidade_id, 'Técnico', 3),
    (v_unidade_id, 'Superior incompleto', 4),
    (v_unidade_id, 'Superior completo', 5),
    (v_unidade_id, 'Pós-graduação', 6),
    (v_unidade_id, 'Mestrado', 7),
    (v_unidade_id, 'Doutorado', 8);

  insert into rh.config_nrs_catalogo (unidade_id, nr, nome, periodicidade_meses) values
    (v_unidade_id, 'NR-06', 'Uso de Equipamento de Proteção Individual (EPI)', 12),
    (v_unidade_id, 'NR-10', 'Segurança em Instalações e Serviços em Eletricidade', 24),
    (v_unidade_id, 'NR-12', 'Segurança no Trabalho em Máquinas e Equipamentos', 12),
    (v_unidade_id, 'NR-18', 'Condições de Segurança no Trabalho na Indústria da Construção', 24),
    (v_unidade_id, 'NR-33', 'Segurança e Saúde no Trabalho em Espaços Confinados', 12),
    (v_unidade_id, 'NR-35', 'Trabalho em Altura', 24);

  insert into rh.config_tipos_exame (unidade_id, nome, periodicidade_meses) values
    (v_unidade_id, 'Hemograma Completo + Reticulócitos', 12),
    (v_unidade_id, 'Glicose', 12),
    (v_unidade_id, 'Acuidade Visual', 12),
    (v_unidade_id, 'Eletrocardiograma', 12),
    (v_unidade_id, 'Eletroencefalograma', 12),
    (v_unidade_id, 'Avaliação Psicossocial', 12),
    (v_unidade_id, 'Audiometria', 12),
    (v_unidade_id, 'Espirometria', 24),
    (v_unidade_id, 'RX Tórax PA', null);

  insert into rh.config_exames_por_funcao (unidade_id, cargo_id, exame_id)
  select
    v_unidade_id,
    cg.id,
    ex.id
  from (values
    ('Técnico Externo Júnior', 'Hemograma Completo + Reticulócitos'),
    ('Técnico Externo Júnior', 'Glicose'),
    ('Técnico Externo Júnior', 'Acuidade Visual'),
    ('Técnico Externo Júnior', 'Eletrocardiograma'),
    ('Técnico Externo Júnior', 'Eletroencefalograma'),
    ('Técnico Externo Júnior', 'Avaliação Psicossocial'),
    ('Técnico Externo Júnior', 'Audiometria'),
    ('Técnico Externo Júnior', 'Espirometria'),
    ('Técnico Externo Júnior', 'RX Tórax PA'),
    ('Técnico Externo Sênior', 'Hemograma Completo + Reticulócitos'),
    ('Técnico Externo Sênior', 'Glicose'),
    ('Técnico Externo Sênior', 'Acuidade Visual'),
    ('Técnico Externo Sênior', 'Eletrocardiograma'),
    ('Técnico Externo Sênior', 'Eletroencefalograma'),
    ('Técnico Externo Sênior', 'Avaliação Psicossocial'),
    ('Técnico Externo Sênior', 'Audiometria'),
    ('Técnico Externo Sênior', 'Espirometria'),
    ('Técnico Externo Sênior', 'RX Tórax PA'),
    ('Gerente de Serviços', 'Hemograma Completo + Reticulócitos'),
    ('Gerente de Serviços', 'Glicose'),
    ('Gerente de Serviços', 'Acuidade Visual'),
    ('Gerente de Serviços', 'Eletrocardiograma'),
    ('Gerente de Serviços', 'Eletroencefalograma'),
    ('Gerente de Serviços', 'Avaliação Psicossocial'),
    ('Gerente de Serviços', 'Audiometria'),
    ('Gerente de Serviços', 'Espirometria'),
    ('Gerente de Serviços', 'RX Tórax PA'),
    ('Diretor', 'Hemograma Completo + Reticulócitos'),
    ('Diretor', 'Glicose'),
    ('Diretor', 'Acuidade Visual'),
    ('Diretor', 'Eletrocardiograma'),
    ('Diretor', 'Eletroencefalograma'),
    ('Diretor', 'Avaliação Psicossocial'),
    ('Diretor', 'Audiometria'),
    ('Diretor', 'Espirometria'),
    ('Diretor', 'RX Tórax PA'),
    ('Desenvolvedor de Eletrônica Mentor Técnico', 'Eletrocardiograma'),
    ('Desenvolvedor de Eletrônica Sênior', 'Audiometria'),
    ('Pesquisador em Física Mentor Técnico', 'Audiometria')
  ) as v(cargo_nome, exame_nome)
  join rh.config_cargos cg on cg.nome = v.cargo_nome
  join rh.config_tipos_exame ex on ex.nome = v.exame_nome;
end $$;
