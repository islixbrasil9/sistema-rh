import { supabase } from "@/lib/supabase";

export type SituacaoFuncionario =
  | "Ativo"
  | "Férias"
  | "Afastado"
  | "Suspenso"
  | "Inativo";

function hojeISO() {
  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = String(hoje.getMonth() + 1).padStart(2, "0");
  const dia = String(hoje.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

export async function recalcularSituacaoFuncionario(
  funcionarioId: string
): Promise<SituacaoFuncionario> {
  const hoje = hojeISO();

  // 1. aviso prévio
  const { data: avisos, error: avisoError } = await supabase
    .from("aviso_previo")
    .select("status, tipo, data_inicio, data_fim")
    .eq("funcionario_id", funcionarioId);

  if (avisoError) throw avisoError;

  const avisoIndenizadoAtivo = (avisos || []).some((a) => {
    if (a.status === "Cancelado") return false;
    if (a.tipo !== "Indenizado") return false;

    return hoje >= a.data_inicio && hoje <= a.data_fim;
  });

  if (avisoIndenizadoAtivo) {
    return "Inativo";
  }

  // 2. férias em andamento
  const { data: ferias, error: feriasError } = await supabase
    .from("ferias")
    .select("status, data_inicio, data_fim")
    .eq("funcionario_id", funcionarioId);

  if (feriasError) throw feriasError;

  const feriasAtivas = (ferias || []).some((f) => {
    if (f.status === "Canceladas") return false;
    return hoje >= f.data_inicio && hoje <= f.data_fim;
  });

  if (feriasAtivas) {
    return "Férias";
  }

  // 3. última movimentação relevante
  const { data: movimentacoes, error: movError } = await supabase
    .from("movimentacoes")
    .select("tipo, data")
    .eq("funcionario_id", funcionarioId)
    .order("data", { ascending: false })
    .limit(1);

  if (movError) throw movError;

  const ultima = movimentacoes?.[0];

  if (ultima) {
    if (ultima.tipo === "Suspensão") return "Suspenso";
    if (ultima.tipo === "Demissão") return "Inativo";
    if (ultima.tipo === "Afastamento") return "Afastado";
    if (ultima.tipo === "Acidente de Trabalho") return "Afastado";
    if (ultima.tipo === "Retorno") return "Ativo";
  }

  return "Ativo";
}

export async function sincronizarSituacaoFuncionario(funcionarioId: string) {
  const novaSituacao = await recalcularSituacaoFuncionario(funcionarioId);

  const { error } = await supabase
    .from("funcionarios")
    .update({ situacao: novaSituacao })
    .eq("id", funcionarioId);

  if (error) throw error;

  return novaSituacao;
}