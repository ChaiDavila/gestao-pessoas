"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InfoBanner } from "@/components/info-banner";
import { TabelaCatalogo, type ColunaCatalogo } from "./tabela-catalogo";
import { PgrTab } from "./pgr-tab";
import { UsuariosTab } from "./usuarios-tab";
import type { PgrItem } from "@/lib/data/catalogos";
import type { getTodosCatalogos } from "@/lib/data/catalogos";
import type { UsuarioArea } from "./usuarios-actions";

const COL_NOME: ColunaCatalogo[] = [
  { chave: "nome", rotulo: "Nome", tipo: "text", obrigatorio: true },
];

const COL_MOTIVO: ColunaCatalogo[] = [
  { chave: "motivo", rotulo: "Motivo", tipo: "text", obrigatorio: true },
];

const COL_CARGO: ColunaCatalogo[] = [
  { chave: "nome", rotulo: "Nome", tipo: "text", obrigatorio: true },
  { chave: "cbo", rotulo: "CBO", tipo: "text" },
];

const COL_NIVEL: ColunaCatalogo[] = [
  { chave: "nome", rotulo: "Nome", tipo: "text", obrigatorio: true },
  { chave: "ordem", rotulo: "Ordem", tipo: "number", obrigatorio: true },
];

const COL_MOTIVO_DESLIGAMENTO: ColunaCatalogo[] = [
  { chave: "motivo", rotulo: "Motivo", tipo: "text", obrigatorio: true },
  {
    chave: "tipo_padrao",
    rotulo: "Tipo padrão",
    tipo: "select",
    obrigatorio: true,
    opcoes: [
      { value: "voluntario", label: "Voluntário" },
      { value: "involuntario", label: "Involuntário" },
    ],
  },
];

const COL_NR: ColunaCatalogo[] = [
  { chave: "nr", rotulo: "NR", tipo: "text", obrigatorio: true },
  { chave: "nome", rotulo: "Nome", tipo: "text", obrigatorio: true },
  { chave: "periodicidade_meses", rotulo: "Periodicidade (meses)", tipo: "number" },
];

const COL_TIPO_EXAME: ColunaCatalogo[] = [
  { chave: "nome", rotulo: "Nome", tipo: "text", obrigatorio: true },
  { chave: "periodicidade_meses", rotulo: "Periodicidade (meses)", tipo: "number" },
];

type Catalogos = Awaited<ReturnType<typeof getTodosCatalogos>>;

export function ConfiguracoesClient({
  catalogos,
  pgrItens,
  usuarios,
  souAdmin,
}: {
  catalogos: Catalogos;
  pgrItens: PgrItem[];
  usuarios: UsuarioArea[];
  souAdmin: boolean;
}) {
  const cargosOpcoes = catalogos.cargos.map((c) => ({
    id: String(c.id),
    nome: String(c.nome),
  }));
  const tiposExameOpcoes = catalogos.tiposExame.map((e) => ({
    id: String(e.id),
    nome: String(e.nome),
    periodicidade_meses: e.periodicidade_meses as number | null,
  }));

  return (
    <Tabs defaultValue="geral">
      <TabsList>
        <TabsTrigger value="geral">Geral</TabsTrigger>
        <TabsTrigger value="treinamentos">Treinamentos</TabsTrigger>
        <TabsTrigger value="aso">ASO e PGR</TabsTrigger>
        {souAdmin && <TabsTrigger value="usuarios">Usuários</TabsTrigger>}
      </TabsList>

      <TabsContent value="geral" className="space-y-6 pt-4">
        <InfoBanner>
          Remover um item do catálogo não altera cadastros já existentes que
          usam aquele valor — só deixa de sugeri-lo em novos cadastros,
          edições ou filtros.
        </InfoBanner>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <TabelaCatalogo
            titulo="Setores"
            tabela="config_setores"
            colunas={COL_NOME}
            itens={catalogos.setores}
          />
          <TabelaCatalogo
            titulo="Eixos"
            tabela="config_eixos"
            colunas={COL_NOME}
            itens={catalogos.eixos}
          />
          <TabelaCatalogo
            titulo="Níveis"
            descricao="Hierarquia exibida do menor pro maior conforme a ordem."
            tabela="config_niveis"
            colunas={COL_NIVEL}
            itens={catalogos.niveis}
          />
          <TabelaCatalogo
            titulo="Formação acadêmica"
            descricao="Usada no cadastro do colaborador e no indicador Formação do Dashboard."
            tabela="config_formacoes"
            colunas={COL_NIVEL}
            itens={catalogos.formacoes}
          />
          <TabelaCatalogo
            titulo="Motivos de evolução salarial"
            tabela="config_motivos_evolucao_salarial"
            colunas={COL_MOTIVO}
            itens={catalogos.motivosEvolucao}
          />
          <TabelaCatalogo
            titulo="Motivos de desligamento"
            descricao="Usados no resumo de Desligamentos e nos indicadores de turnover."
            tabela="config_motivos_desligamento"
            colunas={COL_MOTIVO_DESLIGAMENTO}
            itens={catalogos.motivosDesligamento}
          />
        </div>

        <TabelaCatalogo
          titulo="Funções (cargo + CBO)"
          tabela="config_cargos"
          colunas={COL_CARGO}
          itens={catalogos.cargos}
        />
      </TabsContent>

      <TabsContent value="treinamentos" className="space-y-6 pt-4">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <TabelaCatalogo
            titulo="Categorias de treinamento"
            descricao="Classificação usada nos indicadores de Treinamentos, além de NR/Geral."
            tabela="config_categorias_treinamento"
            colunas={COL_NOME}
            itens={catalogos.categoriasTreinamento}
          />
          <TabelaCatalogo
            titulo="Cursos de NR"
            descricao="A periodicidade define o vencimento calculado automaticamente."
            tabela="config_nrs_catalogo"
            colunas={COL_NR}
            itens={catalogos.nrsCatalogo}
          />
        </div>
      </TabsContent>

      <TabsContent value="aso" className="space-y-6 pt-4">
        <TabelaCatalogo
          titulo="Tipos de exame complementar"
          descricao="A periodicidade já vale automaticamente ao vincular o exame a uma função no PGR abaixo."
          tabela="config_tipos_exame"
          colunas={COL_TIPO_EXAME}
          itens={catalogos.tiposExame}
        />
        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="mb-1 text-sm font-semibold text-foreground">
            Exames exigidos por função (PGR)
          </h3>
          <PgrTab
            pgrItens={pgrItens}
            cargos={cargosOpcoes}
            tiposExame={tiposExameOpcoes}
          />
        </div>
      </TabsContent>

      {souAdmin && (
        <TabsContent value="usuarios" className="pt-4">
          <UsuariosTab usuarios={usuarios} />
        </TabsContent>
      )}
    </Tabs>
  );
}
