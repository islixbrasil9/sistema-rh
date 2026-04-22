"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { sincronizarSituacaoFuncionario } from "@/utils/recalcularSituacaoFuncionario";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { SectionCard } from "@/components/ui/section-card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card } from "@/components/ui/card";

type Funcionario = {
  id: string;
  nome: string;
  cargo: string;
  situacao: string;
};

type FeriasExistente = {
  id: string;
  funcionario_id: string;
  funcionario_nome: string;
  data_inicio: string;
  data_fim: string;
  data_retorno: string;
  status: "Programadas" | "Em andamento" | "Concluídas" | "Canceladas";
};

type StatusFerias =
  | "Programadas"
  | "Em andamento"
  | "Concluídas"
  | "Canceladas";

export default function NovaFeriasPage() {
  const router = useRouter();

  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [loadingFuncionarios, setLoadingFuncionarios] = useState(true);
  const [saving, setSaving] = useState(false);

  const [funcionarioId, setFuncionarioId] = useState("");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [status, setStatus] = useState<StatusFerias>("Programadas");
  const [observacao, setObservacao] = useState("");

  useEffect(() => {
    carregarFuncionarios();
  }, []);

  async function carregarFuncionarios() {
    setLoadingFuncionarios(true);

    try {
      const { data, error } = await supabase
        .from("funcionarios")
        .select("id, nome, cargo, situacao")
        .order("nome", { ascending: true });

      if (error) throw error;

      setFuncionarios((data as Funcionario[]) || []);
    } catch (error) {
      console.error("Erro ao carregar funcionários:", error);
      alert("Erro ao carregar funcionários.");
    } finally {
      setLoadingFuncionarios(false);
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

  function montarDescricaoMovimentacao() {
    const periodo =
      dataInicio && dataFim
        ? `Período de férias de ${formatarData(dataInicio)} até ${formatarData(
            dataFim
          )}`
        : "Registro de férias";

    const retorno = dataRetorno
      ? `. Retorno previsto em ${formatarData(dataRetorno)}`
      : "";

    const obs = observacao.trim()
      ? `. Observação: ${observacao.trim()}`
      : "";

    return `${periodo}${retorno}${obs}`;
  }

  function formatarData(data: string) {
    if (!data) return "-";
    const [ano, mes, dia] = data.split("-");
    return `${dia}/${mes}/${ano}`;
  }

  function hojeISO() {
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = String(hoje.getMonth() + 1).padStart(2, "0");
    const dia = String(hoje.getDate()).padStart(2, "0");
    return `${ano}-${mes}-${dia}`;
  }

  function periodosSeSobrepoem(
    inicioA: string,
    fimA: string,
    inicioB: string,
    fimB: string
  ) {
    return inicioA <= fimB && fimA >= inicioB;
  }

  function calcularStatusAutomatico(item: {
    data_inicio: string;
    data_fim: string;
    data_retorno: string;
    status?: StatusFerias;
  }): StatusFerias {
    if (item.status === "Canceladas") return "Canceladas";

    const hojeIso = hojeISO();

    if (hojeIso < item.data_inicio) return "Programadas";
    if (hojeIso >= item.data_inicio && hojeIso <= item.data_fim) {
      return "Em andamento";
    }
    if (hojeIso >= item.data_retorno) return "Concluídas";

    return "Programadas";
  }

  async function validarConflitos() {
    if (!funcionarioSelecionado) {
      return { ok: false, mensagem: "Funcionário inválido." };
    }

    if (funcionarioSelecionado.situacao === "Inativo") {
      return {
        ok: false,
        mensagem: "Não é permitido cadastrar férias para funcionário inativo.",
      };
    }

    if (funcionarioSelecionado.situacao === "Afastado") {
      return {
        ok: false,
        mensagem: "Não é permitido cadastrar férias para funcionário afastado.",
      };
    }

    if (funcionarioSelecionado.situacao === "Suspenso") {
      return {
        ok: false,
        mensagem: "Não é permitido cadastrar férias para funcionário suspenso.",
      };
    }

    const { data, error } = await supabase
      .from("ferias")
      .select(
        "id, funcionario_id, funcionario_nome, data_inicio, data_fim, data_retorno, status"
      )
      .eq("funcionario_id", funcionarioSelecionado.id);

    if (error) throw error;

    const feriasExistentes = (data as FeriasExistente[]) || [];

    const feriasAtivasOuProgramadas = feriasExistentes.filter((item) => {
      const statusCalculado = calcularStatusAutomatico(item);
      return statusCalculado !== "Canceladas";
    });

    const possuiFeriasEmAndamento = feriasAtivasOuProgramadas.some((item) => {
      const statusCalculado = calcularStatusAutomatico(item);
      return statusCalculado === "Em andamento";
    });

    if (possuiFeriasEmAndamento) {
      return {
        ok: false,
        mensagem:
          "Este funcionário já possui férias em andamento e não pode receber um novo lançamento agora.",
      };
    }

    const possuiSobreposicao = feriasAtivasOuProgramadas.some((item) =>
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

      const statusCalculado =
        status === "Canceladas"
          ? "Canceladas"
          : calcularStatusAutomatico({
              data_inicio: dataInicio,
              data_fim: dataFim,
              data_retorno: dataRetorno,
            });

      const { data: feriasCriadas, error: feriasError } = await supabase
        .from("ferias")
        .insert([
          {
            funcionario_id: funcionarioSelecionado.id,
            funcionario_nome: funcionarioSelecionado.nome,
            data_inicio: dataInicio,
            data_fim: dataFim,
            data_retorno: dataRetorno,
            status: statusCalculado,
            observacao: observacao.trim() || null,
          },
        ])
        .select("id")
        .single();

      if (feriasError) throw feriasError;

      const { error: movimentacaoError } = await supabase
        .from("movimentacoes")
        .insert([
          {
            funcionario_id: funcionarioSelecionado.id,
            funcionario_nome: funcionarioSelecionado.nome,
            ferias_id: feriasCriadas.id,
            tipo: "Férias",
            descricao: montarDescricaoMovimentacao(),
            data: dataInicio,
          },
        ]);

      if (movimentacaoError) throw movimentacaoError;

      await sincronizarSituacaoFuncionario(funcionarioSelecionado.id);

      alert("Férias cadastradas com sucesso!");
      router.push("/ferias");
    } catch (error) {
      console.error("Erro ao salvar férias:", error);
      alert("Erro ao cadastrar férias.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Nova Férias"
        description="Cadastre um novo período de férias para o funcionário"
        actions={
          <Button href="/ferias" variant="outline">
            Voltar
          </Button>
        }
      />

      <SectionCard title="Dados das férias">
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="md:col-span-2">
              <Select
                label="Funcionário"
                value={funcionarioId}
                onChange={(e) => setFuncionarioId(e.target.value)}
                disabled={loadingFuncionarios}
                required
                options={[
                  {
                    label: loadingFuncionarios
                      ? "Carregando funcionários..."
                      : "Selecione um funcionário",
                    value: "",
                  },
                  ...funcionarios.map((funcionario) => ({
                    label: `${funcionario.nome} — ${funcionario.cargo}`,
                    value: funcionario.id,
                  })),
                ]}
              />
            </div>

            <Input
              label="Data de início"
              type="date"
              value={dataInicio}
              onChange={(e) => setDataInicio(e.target.value)}
              required
            />

            <Input
              label="Data de fim"
              type="date"
              value={dataFim}
              onChange={(e) => setDataFim(e.target.value)}
              required
            />

            <Input
              label="Data de retorno"
              type="text"
              value={dataRetorno ? formatarData(dataRetorno) : ""}
              readOnly
              placeholder="Calculada automaticamente"
              className="border-slate-100 bg-slate-50 text-slate-700"
            />

            <Select
              label="Status"
              value={status}
              onChange={(e) => setStatus(e.target.value as StatusFerias)}
              options={[
                { label: "Programadas", value: "Programadas" },
                { label: "Em andamento", value: "Em andamento" },
                { label: "Concluídas", value: "Concluídas" },
                { label: "Canceladas", value: "Canceladas" },
              ]}
            />

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Observação
              </label>
              <textarea
                value={observacao}
                onChange={(e) => setObservacao(e.target.value)}
                placeholder="Ex.: Férias referentes ao período aquisitivo 2025/2026"
                className="min-h-[120px] w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 rounded-2xl bg-slate-50 p-5 md:grid-cols-4">
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

          <Card className="border-blue-100 bg-blue-50/50 p-4">
            <p className="text-sm text-slate-700">
              O sistema bloqueia cadastro de férias para funcionário inativo,
              afastado, suspenso ou com período já conflitante.
            </p>
          </Card>

          <div className="flex justify-end gap-3">
            <Button href="/ferias" variant="outline">
              Cancelar
            </Button>

            <Button type="submit" disabled={saving} variant="primary">
              {saving ? "Salvando..." : "Salvar férias"}
            </Button>
          </div>
        </form>
      </SectionCard>
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