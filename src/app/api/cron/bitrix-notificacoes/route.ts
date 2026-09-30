import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { criarTarefaBitrix } from "@/lib/bitrix";
import { formatarData, hojeISO } from "@/lib/date";

export const dynamic = "force-dynamic";

type ColaboradorLinha = {
  id: string;
  nome: string;
  data_nascimento: string | null;
  data_admissao: string;
  status_rh: string;
  tipo_contrato: string;
};

type RegraLinha = {
  id: string;
  tipo_evento: string;
  dias_antecedencia: number;
  responsavel_bitrix_id: number;
  corresponsaveis_bitrix_ids: number[] | null;
  titulo_template: string;
  descricao_template: string | null;
};

function diasEntre(hojeStr: string, dataStr: string) {
  const hoje = new Date(hojeStr + "T00:00:00Z");
  const data = new Date(dataStr + "T00:00:00Z");
  return Math.round((data.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
}

// Próxima ocorrência (este ano ou o ano que vem) de um mês/dia a partir de hoje.
function proximaOcorrencia(mesDiaOrigem: string, hojeStr: string) {
  const [, mes, dia] = mesDiaOrigem.split("-");
  const anoAtual = Number(hojeStr.slice(0, 4));
  let candidata = `${anoAtual}-${mes}-${dia}`;
  if (candidata < hojeStr) {
    candidata = `${anoAtual + 1}-${mes}-${dia}`;
  }
  return candidata;
}

function preencherTemplate(template: string, nome: string, data: string) {
  return template
    .replaceAll("{{nome}}", nome)
    .replaceAll("{{data}}", formatarData(data));
}

export async function GET(request: NextRequest) {
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const supabase = createAdminClient();
  const hoje = hojeISO();

  const { data: unidade, error: unidadeError } = await supabase
    .schema("core")
    .from("unidades")
    .select("id")
    .limit(1)
    .maybeSingle();
  if (unidadeError || !unidade) {
    return NextResponse.json(
      { ok: false, error: unidadeError?.message ?? "Nenhuma unidade cadastrada em core.unidades." },
      { status: 500 },
    );
  }
  const unidadeId = unidade.id as string;

  const [{ data: colaboradores }, { data: regrasTodas }] = await Promise.all([
    supabase
      .schema("rh")
      .from("vw_colaboradores")
      .select("id, nome, data_nascimento, data_admissao, status_rh, tipo_contrato")
      .eq("status_rh", "ativo"),
    supabase.schema("rh").from("config_bitrix_regras").select("*").eq("ativo", true),
  ]);

  const regras = (regrasTodas ?? []) as RegraLinha[];
  const colaboradoresAtivos = (colaboradores ?? []) as ColaboradorLinha[];

  if (regras.length === 0) {
    return NextResponse.json({ ok: true, tarefasCriadas: 0, mensagem: "Nenhuma regra ativa." });
  }

  const { data: exigenciaAso } = await supabase
    .schema("rh")
    .from("config_exigencia_aso")
    .select("tipo_contrato, exige_aso")
    .eq("ativo", true);
  const tiposSemAso = new Set(
    (exigenciaAso ?? []).filter((e) => !e.exige_aso).map((e) => e.tipo_contrato),
  );
  const idsComAso = new Set(
    colaboradoresAtivos.filter((c) => !tiposSemAso.has(c.tipo_contrato)).map((c) => c.id),
  );

  const candidatos: {
    regra: RegraLinha;
    colaboradorId: string;
    nome: string;
    dataEvento: string;
    referenciaEvento: string;
  }[] = [];

  for (const regra of regras) {
    if (regra.tipo_evento === "aniversario_nascimento") {
      for (const c of colaboradoresAtivos) {
        if (!c.data_nascimento) continue;
        const proxima = proximaOcorrencia(c.data_nascimento, hoje);
        if (diasEntre(hoje, proxima) === regra.dias_antecedencia) {
          candidatos.push({
            regra,
            colaboradorId: c.id,
            nome: c.nome,
            dataEvento: proxima,
            referenciaEvento: `aniversario-${proxima.slice(0, 4)}`,
          });
        }
      }
    }

    if (regra.tipo_evento === "aniversario_empresa") {
      for (const c of colaboradoresAtivos) {
        const proxima = proximaOcorrencia(c.data_admissao, hoje);
        if (diasEntre(hoje, proxima) === regra.dias_antecedencia) {
          candidatos.push({
            regra,
            colaboradorId: c.id,
            nome: c.nome,
            dataEvento: proxima,
            referenciaEvento: `empresa-${proxima.slice(0, 4)}`,
          });
        }
      }
    }

    if (regra.tipo_evento === "aso_vencimento") {
      const [{ data: aso }, { data: pgr }] = await Promise.all([
        supabase.schema("rh").from("vw_aso_colaborador").select("colaborador_id, colaborador_nome, data_vencimento"),
        supabase.schema("rh").from("vw_pgr_colaborador").select("colaborador_id, colaborador_nome, exame_nome, data_vencimento"),
      ]);
      for (const a of aso ?? []) {
        if (!a.data_vencimento || !idsComAso.has(a.colaborador_id)) continue;
        if (diasEntre(hoje, a.data_vencimento) === regra.dias_antecedencia) {
          candidatos.push({
            regra,
            colaboradorId: a.colaborador_id,
            nome: a.colaborador_nome,
            dataEvento: a.data_vencimento,
            referenciaEvento: `aso-${a.data_vencimento}`,
          });
        }
      }
      for (const p of pgr ?? []) {
        if (!p.data_vencimento || !idsComAso.has(p.colaborador_id)) continue;
        if (diasEntre(hoje, p.data_vencimento) === regra.dias_antecedencia) {
          candidatos.push({
            regra,
            colaboradorId: p.colaborador_id,
            nome: p.colaborador_nome,
            dataEvento: p.data_vencimento,
            referenciaEvento: `pgr-${p.exame_nome}-${p.data_vencimento}`,
          });
        }
      }
    }

    if (regra.tipo_evento === "nr_vencimento") {
      const { data: nr } = await supabase
        .schema("rh")
        .from("vw_nr_colaborador")
        .select("colaborador_id, colaborador_nome, nr, data_vencimento");
      for (const n of nr ?? []) {
        if (!n.data_vencimento) continue;
        if (diasEntre(hoje, n.data_vencimento) === regra.dias_antecedencia) {
          candidatos.push({
            regra,
            colaboradorId: n.colaborador_id,
            nome: n.colaborador_nome,
            dataEvento: n.data_vencimento,
            referenciaEvento: `nr-${n.nr}-${n.data_vencimento}`,
          });
        }
      }
    }
  }

  let tarefasCriadas = 0;
  const erros: string[] = [];

  for (const candidato of candidatos) {
    const { data: jaEnviado } = await supabase
      .schema("rh")
      .from("bitrix_notificacoes_enviadas")
      .select("id")
      .eq("regra_id", candidato.regra.id)
      .eq("colaborador_id", candidato.colaboradorId)
      .eq("referencia_evento", candidato.referenciaEvento)
      .maybeSingle();

    if (jaEnviado) continue;

    try {
      const titulo = preencherTemplate(candidato.regra.titulo_template, candidato.nome, candidato.dataEvento);
      const descricao = candidato.regra.descricao_template
        ? preencherTemplate(candidato.regra.descricao_template, candidato.nome, candidato.dataEvento)
        : undefined;

      const taskId = await criarTarefaBitrix({
        titulo,
        descricao,
        responsavelBitrixId: candidato.regra.responsavel_bitrix_id,
        corresponsaveisBitrixIds: candidato.regra.corresponsaveis_bitrix_ids ?? undefined,
      });

      const { error: logError } = await supabase
        .schema("rh")
        .from("bitrix_notificacoes_enviadas")
        .insert({
          unidade_id: unidadeId,
          regra_id: candidato.regra.id,
          colaborador_id: candidato.colaboradorId,
          referencia_evento: candidato.referenciaEvento,
          bitrix_task_id: taskId,
        });
      if (logError) throw new Error(`Tarefa criada no Bitrix mas log falhou: ${logError.message}`);

      tarefasCriadas++;
    } catch (e) {
      erros.push(`${candidato.nome} (${candidato.regra.tipo_evento}): ${(e as Error).message}`);
    }
  }

  return NextResponse.json({ ok: true, tarefasCriadas, candidatosAvaliados: candidatos.length, erros });
}
