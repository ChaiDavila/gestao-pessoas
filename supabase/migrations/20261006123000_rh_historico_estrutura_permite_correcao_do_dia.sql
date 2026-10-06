-- Permite corrigir o registro de HOJE de rh.historico_estrutura_organizacional (ex.: HR
-- edita a função duas vezes no mesmo dia) — o upsert da Server Action usa
-- (colaborador_id, data_vigencia) como chave de conflito, então a segunda edição do mesmo
-- dia vira um UPDATE, não um INSERT. Só o registro de HOJE pode ser corrigido assim;
-- qualquer vigência de um dia anterior continua imutável (já "fechada" no histórico).
create or replace function rh.tg_historico_estrutura_protect()
returns trigger
language plpgsql
as $$
begin
  if old.data_vigencia = current_date and new.data_vigencia = current_date
    and new.colaborador_id is not distinct from old.colaborador_id
  then
    return new;
  end if;

  if new.colaborador_id is distinct from old.colaborador_id
    or new.data_vigencia is distinct from old.data_vigencia
    or new.cargo_id is distinct from old.cargo_id
    or new.nivel_id is distinct from old.nivel_id
    or new.eixo_id is distinct from old.eixo_id
    or new.setor_id is distinct from old.setor_id
    or new.gestor_colaborador_id is distinct from old.gestor_colaborador_id
  then
    raise exception 'Registro de histórico de estrutura organizacional não pode ser editado, só desativado (ativo=false).';
  end if;
  return new;
end;
$$;
