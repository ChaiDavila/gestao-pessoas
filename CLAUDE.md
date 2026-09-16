@AGENTS.md

# Prompt de build — Software de Gestão de Pessoas (COONTROL)

> **Este arquivo deve virar `CLAUDE.md` na raiz do projeto assim que ele for criado.** Ele segue o Padrão de Software COONTROL v1.0 (Next.js + Supabase + Vercel + PWA) e descreve, telão por telão, o que precisa existir — baseado num protótipo funcional em HTML/JS já validado com a área de RH.

---

## 0. Aviso sobre a stack

A pessoa que pediu este prompt havia solicitado **Vite.js**. O padrão obrigatório da COONTROL para software interno é **Next.js (App Router) + Supabase (schema por área) + Vercel + PWA**, porque um Portal Central vai futuramente consolidar os dados de todas as áreas da empresa — isso só é possível se todo mundo seguir a mesma stack e o mesmo banco. Este documento já foi escrito seguindo o padrão (Next.js), não Vite. Se a área de RH realmente precisar fugir do padrão, o caminho é alinhar antes com `software@coontrol.com.br`.

---

## 1. Identificação do projeto

| Campo | Valor |
|---|---|
| **APP** | `coontrol-rh-gestao-pessoas` |
| **ÁREA / SCHEMA** | `rh` |
| **Projeto Supabase** | o único projeto da empresa (`coontrol-prod`) — não criar um novo |
| **Deploy** | Vercel, 1 projeto Vercel dedicado a este app |

Confirme com a TI (`software@coontrol.com.br`) que o schema `rh` está criado, com os grants aplicados e exposto em **Settings → API → Exposed schemas** antes de rodar a primeira migration.

---

## 2. Stack obrigatória

- **Next.js 14+ (App Router) + TypeScript**
- **Supabase** (schema `rh`, dados compartilhados em `core`) com **Supabase Auth** (login único da empresa)
- **Tailwind CSS + shadcn/ui**
- **Zod** para validação de formulários e de corpo de API
- **PWA** instalável (manifest + ícones; service worker só se for necessário uso offline em campo)
- **Chart.js** para os gráficos do Dashboard (mesma biblioteca do protótipo, ou `recharts` se preferir um wrapper React — decidir e manter consistente)
- Sem ORM (nada de Prisma/Drizzle), sem outro provedor de auth, sem estado global (Zustand/Redux) — usar Server Components + Server Actions do próprio Next.js

---

## 3. Visão geral do produto

Sistema interno de Gestão de Pessoas para a COONTROL (Rio do Sul/SC), cobrindo o ciclo completo de um colaborador: cadastro, contrato e evolução salarial, formação, dependentes, exames ocupacionais (ASO), treinamentos obrigatórios (NR) e gerais, desligamentos, e rotinas de apoio a endomarketing (perfil familiar, aniversários). O sistema **não tem múltiplos "clientes"** — é uso interno da própria COONTROL, ~33 colaboradores atualmente.

Existe uma versão validada em HTML/JS (protótipo estático, sem backend) com toda a UX já testada com a área de RH — este prompt descreve como portar essa UX e essas regras de negócio para o padrão real da empresa, com banco de dados de verdade.

---

## 4. Modelo de dados (schema `rh`)

Seguir a arquitetura do padrão: colaborador **não é uma tabela nova de pessoa** — ele referencia `core.pessoas(id)` e guarda em `rh.colaboradores` só os campos específicos de RH. Todas as tabelas abaixo levam as 7 colunas obrigatórias (`id`, `unidade_id`, `ativo`, `criado_em`, `criado_por`, `atualizado_em`, `atualizado_por`) + trigger de auditoria + RLS com as 4 políticas — omitidas na lista abaixo para não repetir.

### `rh.colaboradores`
Campos específicos de RH (dados pessoais/cadastrais que hoje não vivem em `core.pessoas` — confirmar com a TI se algum destes já existe lá para não duplicar, especialmente CPF/RG/data de nascimento):
`pessoa_id` (FK única para `core.pessoas`), `matricula` (text, único), `rg`, `pis_pasep`, `sexo` (check M/F), `estado_civil`, `conjuge_nome`, `conjuge_sexo`, `email_pessoal`, `telefone_pessoal`, `numero_corporativo`, `endereco_rua`, `endereco_numero`, `endereco_complemento`, `endereco_bairro`, `endereco_cidade`, `endereco_estado`, `endereco_cep`, `contato_emergencia_nome`, `contato_emergencia_telefone`, `cargo` (text — ou FK para `rh.config_cargos`), `cbo`, `setor` (FK para `rh.config_setores`), `nivel` (FK para `rh.config_niveis`), `eixo` (FK para `rh.config_eixos`), `gestor_colaborador_id` (FK para `rh.colaboradores.id`, nullable), `data_admissao` (date), `tipo_contrato` (check: CLT/Estágio/Aprendiz/PJ/Temporário/Pró-labore), `regime_trabalho` (check: Presencial/Híbrido/Remoto/Home Office), `salario_atual` (numeric 14,2), `salario_admissional` (numeric 14,2), `status_rh` (check: ativo/desligado — **não confundir com a coluna `ativo` de auditoria**, que é sobre o registro em si, não sobre o vínculo empregatício).

### `rh.dependentes`
`colaborador_id` (FK), `nome`, `parentesco` (check: Filho/Filha/Enteado/Enteada/Outro), `data_nascimento`, `sexo` (M/F, pode ser nulo).

### `rh.formacoes`
`colaborador_id` (FK), `nivel` (check: catálogo de `rh.config_formacoes`), `curso`, `instituicao`, `ano_conclusao` (int), `status` (text, ex.: "Concluído", "Em andamento"). A formação "atual" de um colaborador para efeito de indicador é **sempre a de `criado_em` mais recente** — não é preciso campo separado de "principal".

### `rh.historico_cargo_salarial`
`colaborador_id` (FK), `data` (date), `cargo_anterior`, `cargo_novo`, `salario_anterior` (numeric 14,2), `salario_novo` (numeric 14,2), `motivo` (FK para `rh.config_motivos_evolucao_salarial`). **Nunca editar ou apagar registro existente** — é log de auditoria de carreira; a correção de um lançamento errado é uma linha de exclusão lógica (`ativo=false`), nunca update dos valores.

⚠️ Regra de negócio importante herdada do protótipo: ao criar um novo registro aqui, **só atualizar `rh.colaboradores.cargo` / `.salario_atual` se o formulário indicar que este é o registro "atual"** (ver seção 7 — regra do checkbox/data). Sem essa trava, o preenchimento retroativo do histórico de anos anteriores sobrescreve por engano o salário vigente do colaborador.

### `rh.aso_registros`
`colaborador_id` (FK), `tipo_exame` (check: admissional/periodico/demissional/mudanca_funcao/retorno_trabalho), `data` (date), `resultado` (check: apto/inapto), `data_vencimento` (date, calculada a partir da periodicidade do tipo de exame no momento do cadastro).

### `rh.exames_complementares_registros`
`colaborador_id` (FK), `exame` (FK para `rh.config_tipos_exame`), `data` (date), `data_vencimento` (date, nullable — exames "somente na admissão" não têm vencimento).

### `rh.treinamentos`
`nome`, `tipo` (check: NR/geral), `nr_numero` (FK para `rh.config_nrs_catalogo`, nullable — só para tipo NR), `categoria` (FK para `rh.config_categorias_treinamento`), `data` (date), `carga_horaria` (numeric), `instrutor`, `custo_total` (numeric 14,2), `data_vencimento` (date, nullable — calculada a partir da periodicidade do curso de NR; treinamentos gerais podem ou não ter vencimento).

### `rh.treinamento_participantes`
Tabela de junção N:N: `treinamento_id` (FK), `colaborador_id` (FK). Um treinamento pode ter vários participantes (registro em lote/turma).

### `rh.desligamentos`
`colaborador_id` (FK), `data` (date), `tipo` (check: voluntario/involuntario), `motivo` (FK para `rh.config_motivos_desligamento`), `descricao` (text, livre), `data_reativacao` (date, nullable — preenchido se o colaborador voltar a ficar ativo depois). Ao criar um desligamento, `rh.colaboradores.status_rh` vira `desligado`; ao reativar, volta para `ativo` e a coluna `data_reativacao` deste registro é preenchida (o histórico de desligamentos nunca é apagado, só documentado como revertido).

### Tabelas de catálogo (`rh.config_*`)
Cada uma é uma lista simples editável em Configurações, todas seguindo o mesmo padrão (`id`, `nome`/`valor`, + campo específico quando houver):

- `rh.config_setores` (`nome`)
- `rh.config_cargos` (`nome`, `cbo`)
- `rh.config_niveis` (`nome`, `ordem` int — para manter a hierarquia Iniciante→Estratégico na exibição)
- `rh.config_eixos` (`nome`)
- `rh.config_motivos_desligamento` (`motivo`, `tipo_padrao` check voluntario/involuntario)
- `rh.config_motivos_evolucao_salarial` (`motivo`)
- `rh.config_categorias_treinamento` (`nome`)
- `rh.config_formacoes` (`nome`, `ordem` int)
- `rh.config_nrs_catalogo` (`nr` text único, `nome`, `periodicidade_meses` int nullable)
- `rh.config_tipos_exame` (`nome`, `periodicidade_meses` int nullable — nulo = "somente na admissão")
- `rh.config_exames_por_funcao` (`funcao` text ou FK para `rh.config_cargos`, `exame_id` FK para `rh.config_tipos_exame`) — este é o PGR: quais exames cada função exige. A periodicidade é sempre herdada do exame, nunca duplicada aqui.

Gestor direto (hoje uma lista solta de nomes no protótipo) deve virar **FK real para `rh.colaboradores.id`** no banco de verdade — ganho direto de integridade que o protótipo não tinha.

### View de integração
Publicar pelo menos `rh.vw_pub_colaboradores` (id, pessoa_id, unidade_id, matricula, cargo, setor, status_rh, data_admissao, ativo, criado_em, atualizado_em) para o Portal Central poder consultar headcount sem acessar a tabela base.

---

## 5. Telas e funcionalidades

### 5.1 Dashboard
KPIs: colaboradores ativos, folha salarial atual (soma de `salario_atual` dos ativos), turnover do ano corrente, tempo médio de casa. Filtros: função, nível, eixo, setor, gestor, status, período (De/Até).

Gráficos, **todos clicáveis (drill-down)** — clicar numa barra/fatia abre uma lista dos colaboradores (ou desligamentos, quando for o caso) daquele grupo, e clicar num nome na lista abre a ficha completa dele:
- Admissões x desligamentos por ano (barras, 2 séries)
- Turnover anual (%) (linha) — drill-down mostra os desligamentos daquele ano
- Colaboradores por setor (barras horizontais)
- Distribuição por sexo (rosca)
- Distribuição por faixa etária (barras: <15, 15-19, 20-25, 26-35, 36-40, 41-60, 61+)
- Tempo de empresa (barras: <1 ano, 1-3, 4-5, 6-10, >10)
- Formação (barras horizontais, usa a formação mais recente de cada colaborador ativo)
- Evolução da folha salarial total (linha por ano) — **não precisa ser clicável** (é uma soma, não uma lista de pessoas)
- Desligamentos por tipo (rosca voluntário/involuntário)
- Desligamentos por motivo (barras horizontais)

### 5.2 Colaboradores
Lista com busca por nome/matrícula + filtros (função, nível, eixo, setor, gestor, status). Ações por linha: Editar, Desativar (abre um mini-fluxo de desligamento: data, tipo, motivo, descrição), Reativar.

- **Botão "+ Novo colaborador"**: abre a ficha já em modo de edição, formulário em branco. Se a pessoa cancelar ou fechar sem salvar, o registro não é criado (não deixar rascunho no banco).
- **Botão "Excluir"** na ficha: exclusão **de verdade** (não é o padrão do resto do sistema, que é `ativo=false` — aqui existe um caso de uso real de "cadastrei um colaborador de teste, preciso apagar"). Ao excluir, remover em cascata os registros vinculados (dependentes, formações, ASO, exames, participação em treinamentos, histórico salarial) antes de excluir o colaborador, com confirmação clara de que é irreversível.
- **Ficha do colaborador**, em abas: Dados cadastrais, Contrato e função, Dependentes (com "+ Adicionar dependente" e "Remover" por linha), Histórico salarial (ver regra especial na seção 7), Formação (com "+ Adicionar formação" e "Remover" por linha), Exames ocupacionais (histórico completo de ASO + exames complementares, com "Remover" por linha).
- **Botão "Relatório personalizado" (CSV)**: modal com ~30 campos disponíveis, agrupados (Identificação, Dados pessoais, Contrato e função, Outros), cada um com checkbox. Pré-marcados: nome, data de nascimento, e-mail. Botões "Marcar todos"/"Limpar". Gera CSV (`;` como separador, BOM UTF-8) **respeitando os filtros aplicados na lista** — se a lista está filtrada por setor, o relatório sai só com aquele setor.

### 5.3 Desligamentos
Lista de todo o histórico de desligamentos (não só os atuais), com colaborador, setor/função, data, tipo, motivo, descrição, situação (ainda desligado / reativado em [data]). Botão "Remover" por linha — se o registro removido for o desligamento vigente do colaborador, ele volta automaticamente para `status_rh = ativo`.

### 5.4 Evolução Salarial
Uma linha por alteração de cargo/salário de todos os colaboradores (não por colaborador). Filtro por texto (nome do colaborador — **funcionalidade que faltava no protótipo até um dos últimos ajustes**, garantir que existe desde o início aqui), colaborador (dropdown), setor, função, nível, eixo, gestor, status, período.

### 5.5 Treinamentos
4 sub-abas, todas puxando de `rh.treinamentos` + `rh.treinamento_participantes`, com filtro de texto por nome de colaborador compartilhado entre as 4:

1. **Indicadores**: KPIs (horas totais, investimento total, custo médio por colaborador) + gráficos (horas por categoria, investimento por categoria, horas por setor, ranking top 10 colaboradores por horas, investimento por ano). Filtro de ano com atalho "Todos os anos".
2. **Treinamentos gerais**: tabela dos treinamentos `tipo=geral`. Botão "+ Novo treinamento geral": formulário com nome, categoria, data, carga horária, custo, instrutor, vencimento opcional, lista de participantes (checkboxes, "Marcar todos"/"Limpar"). "Remover" por linha.
3. **Treinamentos obrigatórios (NR)**: uma linha por colaborador com NR registrada (quem nunca fez nenhuma fica fora da lista, mas conta nos KPIs como "sem NR registrada"). Expansão inline mostra cada curso de NR daquele colaborador com data, vencimento e status.
   - **Toggle "Lista / Linha do tempo"**: a visão de linha do tempo agrupa por "Vencidos" (destaque) e depois por mês, cronologicamente, com botão "Renovar" por linha.
   - **Botão "Renovar" (por linha, na expansão)**: mini-formulário inline (data de realização, carga horária, custo, instrutor) que calcula o próximo vencimento sozinho a partir da periodicidade cadastrada, e cria um **novo** registro de treinamento (não sobrescreve o anterior — histórico preservado).
   - **Botão "+ Registrar treinamento de NR" (topo)**: funciona também como registro **em lote** — ao escolher o curso, o formulário pré-marca automaticamente quem **já fez aquele curso antes** e está vencido/a vencer (não marca quem nunca fez, pois pode ser que a função da pessoa não exija aquela NR).
   - Regra importante: o cálculo de "vencido/a vencer" **ignora o filtro de período** da tela — ele sempre olha o registro mais recente de cada NR de cada pessoa, independente do ano selecionado no filtro (o filtro de período só vale para os indicadores agregados, não para o status de conformidade).
4. **Por colaborador**: ficha unificada (NR + geral) por pessoa, busca por nome, expansão inline mostrando todos os treinamentos daquela pessoa no recorte filtrado, com "Remover" por linha.

### 5.6 ASO
Uma linha por colaborador (situação geral + próxima pendência), expansão inline mostrando ASO + todos os exames complementares exigidos pela função dele (config PGR), ordenados por urgência. "Registrar exame" sugere os exames da função (PGR). "Remover" por linha de exame.

- **Toggle "Lista / Linha do tempo"**, mesmo padrão de Treinamentos obrigatórios: agrupado por "Vencidos" e depois por mês, com botão "+ Registrar" por linha que abre o formulário já com aquele colaborador selecionado.

### 5.7 Perfil Familiar
Tela de consulta para ações de endomarketing: estado civil, cônjuge, filhos (nome + idade), com filtros (setor, gestor, status, estado civil, "somente com filhos"). KPIs clicáveis ("Com cônjuge mulher/homem" abre lista com o **nome de cada cônjuge**, não só a contagem). Gráficos "Filhos por sexo" e "Filhos por faixa etária" também clicáveis (abrem lista de dependentes daquele grupo, com o colaborador responsável).

- **3 botões de exportação CSV**, respeitando os filtros da tela: "Filhos" (nome, sexo, idade, parentesco, colaborador responsável), "Cônjuges" (nome, sexo, colaborador), "Relação completa" (uma linha por colaborador com tudo).

### 5.8 Aniversários
Seletor de mês (padrão: mês atual). Duas seções de cards visuais: "Aniversariantes do mês" (nascimento) e "Aniversários de empresa" (tempo de casa) — **este segundo mostra qualquer quantidade de anos completados (1, 3, 7, 13...), não só marcos redondos**; marcos redondos (5, 10, 15...) ganham um selo extra "🏆 Marco de X anos" só como destaque visual, sem filtrar os demais. Cards com aniversário hoje ganham destaque visual. KPI "Hoje" mostra quem faz aniversário/tempo de casa justamente no dia.

### 5.9 Configurações
3 sub-abas:
1. **Geral**: setores, funções/CBO (editável inline: nome + CBO juntos), níveis, eixos, funções/CBO, motivos de evolução salarial, motivos de desligamento (com tipo padrão voluntário/involuntário), formação acadêmica.
2. **Treinamentos**: categorias de treinamento, cursos de NR e periodicidade (editável inline, incluindo a periodicidade).
3. **ASO e PGR**: tipos de exame complementar e periodicidade (editável inline); "Exames exigidos por função (PGR)" **agrupado por função** (uma linha por função, expandindo mostra os exames daquela função — não repete o nome da função a cada exame); cadastro rápido em lote (marca funções + exames, aplica a periodicidade automaticamente vinda do catálogo do exame).

Todo catálogo tem "Editar" (com cascata: renomear um valor atualiza todos os registros que o referenciam) e "Remover" (não apaga uso já feito, só some da lista de sugestão).

---

## 6. Identidade visual

Seguir a identidade da COONTROL, não a paleta genérica do padrão de software (`--cor-primaria` etc. do modelo padrão é só um exemplo — trocar pelas cores reais da marca):

- Laranja COONTROL: `#E84E0F` (e um tom mais escuro `#C43F0C` para hover/ênfase)
- Cinza COONTROL: `#434342`
- Tipografia: New June Book / New June Medium / New June Bold (se as fontes não estiverem disponíveis via web font, usar uma sans-serif neutra como fallback e avisar a TI)
- Logo: o símbolo do infinito laranja (asset já usado no protótipo), dentro de um quadrado de fundo branco quando aplicado sobre fundo escuro (menu lateral)
- Menu lateral escuro (cinza COONTROL), conteúdo em cartões brancos sobre fundo levemente acinzentado, badges de status coloridos (verde=em dia/ativo, âmbar=a vencer, vermelho=vencido)

---

## 7. Regras de negócio importantes (não perder na reconstrução)

Estas são decisões refinadas ao longo de várias rodadas de validação com a área de RH — **não são óbvias e é fácil perdê-las numa reescrita**:

1. **Filtro de período não esconde pendência de conformidade.** Nas telas de ASO e Treinamentos obrigatórios, o status "vencido/a vencer" de cada pessoa sempre usa o registro mais recente dela, mesmo que esse registro tenha sido feito fora do intervalo De/Até selecionado. Só os indicadores agregados (custo, horas) respeitam o período.
2. **Histórico salarial: registro retroativo não pode sobrescrever o salário atual por engano.** Ao adicionar um registro de histórico com data diferente de hoje, o formulário deve **assumir automaticamente que não é para atualizar o cargo/salário vigente** do colaborador (mas deixar isso visível e reversível pela pessoa, não escondido). Um aviso visual claro (verde = "vai atualizar o atual" / âmbar = "não vai atualizar") deve acompanhar a escolha em tempo real. Isso existe para permitir carregar vários anos de histórico de uma vez sem corromper o salário vigente de cada colaborador.
3. **Sugestão de renovação em lote de NR não marca quem nunca fez o curso.** Só marca automaticamente quem já tem um registro daquele curso e está vencido/a vencer — "nunca fez" pode simplesmente significar que a função da pessoa não exige aquela NR (o sistema não tem, hoje, um mapeamento formal "NR obrigatória por função" como tem para os exames complementares via PGR).
4. **PGR agrupado por função, nunca por linha de exame.** Uma função pode exigir 9 exames diferentes — a lista deve mostrar 1 linha por função, expansível.
5. **Exclusão de colaborador é diferente de desligamento.** "Desativar" é o fluxo normal (preserva tudo, é o padrão RLS/soft-delete da COONTROL). "Excluir" é uma exceção deliberada para corrigir cadastro de teste, e precisa de confirmação bem explícita.
6. **Toda lista de "adicionar" (dependente, formação, histórico, exame, treinamento) precisa do seu par "remover".** Foi um ponto cego recorrente no protótipo — ao construir CRUD de qualquer sub-recurso da ficha do colaborador, sempre implementar os dois lados desde o início.
7. **"Última formação" para efeito de indicador é sempre a mais recente cadastrada**, não uma flag de "principal" separada.
8. **Relatórios/exportações sempre respeitam o filtro aplicado na tela onde o botão está**, nunca exportam a base inteira ignorando o que a pessoa filtrou.

---

## 8. Fora de escopo desta primeira versão

- **Login/autenticação de colaborador comum**: o protótipo chegou a ter uma tela de login com e-mail/senha e permissão por rotina, mas foi removida a pedido da área por falta de uma forma de gerenciar credenciais junto. Reintroduzir isso é natural aqui porque o padrão já exige **Supabase Auth** — implementar login de verdade (não a simulação client-side que existiu no protótipo) e RLS por papel (`leitor`/`operador`/`gestor`/`admin` em `core.usuarios_areas`, já citado no padrão da COONTROL) resolve isso de forma correta desde o início.
- **Integração com Bitrix24** (notificar treinamentos vencidos, ASO a vencer, aniversariantes): validada manualmente como prova de conceito (criação de tarefas via API do Bitrix), mas depende de uma rotina agendada (cron/Edge Function do Supabase, por exemplo) rodando no backend real — não existe no protótipo estático e deve ser um item de backlog explícito deste projeto, não implícito.

---

## Como usar este documento

1. Confirme com a TI o schema `rh` e as credenciais Supabase.
2. Rode a etapa "estrutura → banco → login → listagem → cadastro → resto" do padrão, uma de cada vez, parando para eu testar cada etapa.
3. Ao final de cada módulo, rode o checklist "Antes de dizer que terminou" do padrão COONTROL antes de seguir para o próximo.
