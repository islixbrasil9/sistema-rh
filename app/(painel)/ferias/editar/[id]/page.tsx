"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Funcionario = {
  id: string;
  nome: string;
  cargo: string;
  situacao: string;
};

type Ferias = {
  id: string;
  funcionario_id: string;
  funcionario_nome: string;
  data_inicio: string;
  data_fim: string;
  data_retorno: string;
  status: "Programadas" | "Em andamento" | "Concluídas" | "Canceladas";
  observacao?: string | null;
};

export default function EditarFeriasPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [funcionarioId, setFuncionarioId] = useState("");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [status, setStatus] = useState<Ferias["status"]>("Programadas");
  const [observacao, setObservacao] = useState("");

  useEffect(() => {
    if (id) {
      carregarDados();
    }
  }, [id]);

  async function carregarDados() {
    setLoading(true);

    try {
      const { data: funcionariosData, error: funcionariosError } =
        await supabase
          .from("funcionarios")
          .select("id, nome, cargo, situacao")
          .order("nome", { ascending: true });

      if (funcionariosError) throw funcionariosError;

      const { data: feriasData, error: feriasError } = await supabase
        .from("ferias")
        .select("*")
        .eq("id", id)
        .single();

      if (feriasError) throw feriasError;

      setFuncionarios((funcionariosData as Funcionario[]) || []);

      const registro = feriasData as Ferias;

      setFuncionarioId(registro.funcionario_id);
      setDataInicio(registro.data_inicio);
      setDataFim(registro.data_fim);
      setStatus(registro.status);
      setObservacao(registro.observacao || "");
    } catch (error) {
      console.error("Erro ao carregar férias:", error);
      alert("Erro ao carregar dados das férias.");
    } finally {
      setLoading(false);
    }
  }

  const funcionarioSelecionado = useMemo(() => {
    return funcionarios.find((f) => f.id === funcionarioId) || null;
  }, [funcionarios, funcionarioId]);

  const dataRetorno = useMemo(() => {
    if (!dataFim) return "";

    const retorno = new Date(`${dataFim}T00:00:00`);
    retorno.setDate(retorno.getDate() + 1);

    const ano = retorno.getFullYear();
    const mes = String(retorno.getMonth() + 1).padStart(2, "0");
    const dia = String(retorno.getDate()).padStart(2, "0");

    return `${ano}-${mes}-${dia}`;
  }, [dataFim]);

  const diasFerias = useMemo(() => {
    if (!dataInicio || !dataFim) return 0;

    const inicio = new Date(`${dataInicio}T00:00:00`);
    const fim = new Date(`${dataFim}T00:00:00`);
    const diff = fim.getTime() - inicio.getTime();

    if (diff < 0) return 0;

    return Math.floor(diff / (1000 * 60 * 60 * 24)) + 1;
  }, [dataInicio, dataFim]);

  function formatarData(data: string) {
    if (!data) return "-";
    const [ano, mes, dia] = data.split("-");
    return `${dia}/${mes}/${ano}`;
  }

  function periodosSeSobrepoem(
    inicioA: string,
    fimA: string,
    inicioB: string,
    fimB: string
  ) {
    return inicioA <= fimB && fimA >= inicioB;
  }

  function calcularStatusAutomatico(
    item: Pick<Ferias, "data_inicio" | "data_fim" | "data_retorno" | "status">
  ): Ferias["status"] {
    if (item.status === "Canceladas") return "Canceladas";

    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = String(hoje.getMonth() + 1).padStart(2, "0");
    const dia = String(hoje.getDate()).padStart(2, "0");
    const hojeIso = `${ano}-${mes}-${dia}`;

    if (hojeIso < item.data_inicio) return "Programadas";
    if (hojeIso >= item.data_inicio && hojeIso <= item.data_fim) {
      return "Em andamento";
    }
    if (hojeIso >= item.data_retorno) return "Concluídas";

    return item.status;
  }

  function obterNovaSituacao(
    statusFerias: Ferias["status"],
    situacaoAtual: string
  ) {
    if (statusFerias === "Em andamento") return "Férias";
    if (statusFerias === "Concluídas") return "Ativo";
    if (statusFerias === "Programadas") return situacaoAtual;
    if (statusFerias === "Canceladas") return situacaoAtual;
    return situacaoAtual;
  }

  async function validarConflitos() {
    if (!funcionarioSelecionado) {
      return { ok: false, mensagem: "Funcionário inválido." };
    }

    if (funcionarioSelecionado.situacao === "Inativo") {
      return {
        ok: false,
        mensagem: "Não é permitido manter férias para funcionário inativo.",
      };
    }

    const { data, error } = await supabase
      .from("ferias")
      .select("*")
      .eq("funcionario_id", funcionarioSelecionado.id);

    if (error) throw error;

    const registros = ((data as Ferias[]) || []).filter((item) => item.id !== id);

    const registrosValidos = registros.filter((item) => {
      const statusCalculado = calcularStatusAutomatico(item);
      return statusCalculado !== "Canceladas";
    });

    const possuiSobreposicao = registrosValidos.some((item) =>
      periodosSeSobrepoem(dataInicio, dataFim, item.data_inicio, item.data_fim)
    );

    if (possuiSobreposicao) {
      return {
        ok: false,
        mensagem:
          "Já existe um período de férias cadastrado para este funcionário que entra em conflito com as datas informadas.",
      };
    }

    return { ok: true, mensagem: "" };
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!funcionarioId) {
      alert("Selecione um funcionário.");
      return;
    }

    if (!dataInicio) {
      alert("Informe a data de início.");
      return;
    }

    if (!dataFim) {
      alert("Informe a data de fim.");
      return;
    }

    if (dataFim < dataInicio) {
      alert("A data final não pode ser menor que a data inicial.");
      return;
    }

    if (!funcionarioSelecionado) {
      alert("Funcionário inválido.");
      return;
    }

    setSaving(true);

    try {
      const validacao = await validarConflitos();

      if (!validacao.ok) {
        alert(validacao.mensagem);
        setSaving(false);
        return;
      }

      const novaSituacao = obterNovaSituacao(
        status,
        funcionarioSelecionado.situacao
      );

      const { error: updateFeriasError } = await supabase
        .from("ferias")
        .update({
          funcionario_id: funcionarioSelecionado.id,
          funcionario_nome: funcionarioSelecionado.nome,
          data_inicio: dataInicio,
          data_fim: dataFim,
          data_retorno: dataRetorno,
          status,
          observacao: observacao.trim() || null,
        })
        .eq("id", id);

      if (updateFeriasError) throw updateFeriasError;

      if (novaSituacao !== funcionarioSelecionado.situacao) {
        const { error: updateFuncionarioError } = await supabase
          .from("funcionarios")
          .update({ situacao: novaSituacao })
          .eq("id", funcionarioSelecionado.id);

        if (updateFuncionarioError) throw updateFuncionarioError;
      }

      alert("Férias atualizadas com sucesso!");
      router.push("/ferias");
    } catch (error) {
      console.error("Erro ao atualizar férias:", error);
      alert("Erro ao atualizar férias.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-slate-900">Editar Férias</h1>
        <div className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-gray-200">
          <p className="text-sm text-slate-500">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Editar Férias</h1>
          <p className="mt-1 text-sm text-slate-600">
            Atualize o período e as informações do registro de férias
          </p>
        </div>

        <Link
          href="/ferias"
          className="inline-flex items-center rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-gray-50"
        >
          Voltar
        </Link>
      </div>

      <form
        onSubmit={handleSubmit}
        className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-gray-200"
      >
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Funcionário
            </label>

            <select
              value={funcionarioId}
              onChange={(e) => setFuncionarioId(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
              required
            >
              <option value="">Selecione um funcionário</option>

              {funcionarios.map((funcionario) => (
                <option key={funcionario.id} value={funcionario.id}>
                  {funcionario.nome} — {funcionario.cargo}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Data de início
            </label>
            <input
              type="date"
              value={dataInicio}
              onChange={(e) => setDataInicio(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Data de fim
            </label>
            <input
              type="date"
              value={dataFim}
              onChange={(e) => setDataFim(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Data de retorno
            </label>
            <input
              type="text"
              value={dataRetorno ? formatarData(dataRetorno) : ""}
              readOnly
              className="w-full rounded-xl border border-gray-100 bg-slate-50 px-4 py-3 text-sm text-slate-700"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as Ferias["status"])}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
            >
              <option value="Programadas">Programadas</option>
              <option value="Em andamento">Em andamento</option>
              <option value="Concluídas">Concluídas</option>
              <option value="Canceladas">Canceladas</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Observação
            </label>
            <textarea
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              placeholder="Ex.: Ajuste de período de férias"
              className="min-h-[120px] w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
            />
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-4 rounded-2xl bg-slate-50 p-5 md:grid-cols-4">
          <ResumoItem
            label="Funcionário"
            value={funcionarioSelecionado?.nome || "-"}
          />
          <ResumoItem
            label="Situação atual"
            value={funcionarioSelecionado?.situacao || "-"}
          />
          <ResumoItem
            label="Dias de férias"
            value={diasFerias > 0 ? `${diasFerias} dia(s)` : "-"}
          />
          <ResumoItem
            label="Retorno"
            value={dataRetorno ? formatarData(dataRetorno) : "-"}
          />
        </div>

        <div className="mt-8 flex justify-end gap-3">
          <Link
            href="/ferias"
            className="rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-medium text-slate-700 transition hover:bg-gray-50"
          >
            Cancelar
          </Link>

          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
          >
            {saving ? "Salvando..." : "Salvar alterações"}
          </button>
        </div>
      </form>
    </div>
  );
}

function ResumoItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 font-semibold text-slate-900">{value}</p>
    </div>
  );
}