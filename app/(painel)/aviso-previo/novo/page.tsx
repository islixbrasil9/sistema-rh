"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { sincronizarSituacaoFuncionario } from "@/utils/recalcularSituacaoFuncionario";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { SectionCard } from "@/components/ui/section-card";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

type Funcionario = {
  id: string;
  nome: string;
  cargo: string;
  situacao: string;
};

type AvisoExistente = {
  id: string;
  funcionario_id: string;
  data_inicio: string;
  data_fim: string;
  tipo: "Trabalhado" | "Indenizado";
  status: "Ativo" | "Concluído" | "Cancelado";
};

export default function NovoAvisoPrevioPage() {
  const router = useRouter();

  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [loadingFuncionarios, setLoadingFuncionarios] = useState(true);
  const [saving, setSaving] = useState(false);

  const [funcionarioId, setFuncionarioId] = useState("");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [tipo, setTipo] = useState<"Trabalhado" | "Indenizado">("Trabalhado");
  const [status, setStatus] = useState<"Ativo" | "Concluído" | "Cancelado">(
    "Ativo"
  );
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

  const diasAviso = useMemo(() => {
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

  async function validarConflitos() {
    if (!funcionarioSelecionado) {
      return { ok: false, mensagem: "Funcionário inválido." };
    }

    if (funcionarioSelecionado.situacao === "Inativo") {
      return {
        ok: false,
        mensagem:
          "Não é permitido cadastrar aviso prévio para funcionário inativo.",
      };
    }

    const { data, error } = await supabase
      .from("aviso_previo")
      .select("*")
      .eq("funcionario_id", funcionarioSelecionado.id);

    if (error) throw error;

    const avisos = (data as AvisoExistente[]) || [];
    const avisosValidos = avisos.filter((item) => item.status !== "Cancelado");

    const possuiAtivo = avisosValidos.some((item) => item.status === "Ativo");

    if (possuiAtivo) {
      return {
        ok: false,
        mensagem:
          "Este funcionário já possui um aviso prévio ativo cadastrado.",
      };
    }

    const possuiSobreposicao = avisosValidos.some((item) =>
      periodosSeSobrepoem(dataInicio, dataFim, item.data_inicio, item.data_fim)
    );

    if (possuiSobreposicao) {
      return {
        ok: false,
        mensagem:
          "Já existe um período de aviso prévio cadastrado para este funcionário que entra em conflito com as datas informadas.",
      };
    }

    return { ok: true, mensagem: "" };
  }

  function montarDescricaoAviso() {
    const periodo =
      dataInicio && dataFim
        ? `Aviso prévio ${tipo.toLowerCase()} de ${formatarData(
            dataInicio
          )} até ${formatarData(dataFim)}`
        : `Aviso prévio ${tipo.toLowerCase()}`;

    const obs = observacao.trim() ? `. Observação: ${observacao.trim()}` : "";

    return `${periodo}${obs}`;
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

      const { data: avisoCriado, error: avisoError } = await supabase
        .from("aviso_previo")
        .insert([
          {
            funcionario_id: funcionarioSelecionado.id,
            funcionario_nome: funcionarioSelecionado.nome,
            data_inicio: dataInicio,
            data_fim: dataFim,
            tipo,
            status,
            observacao: observacao.trim() || null,
          },
        ])
        .select("id")
        .single();

      if (avisoError) throw avisoError;

      const { error: movimentacaoError } = await supabase
        .from("movimentacoes")
        .insert([
          {
            funcionario_id: funcionarioSelecionado.id,
            funcionario_nome: funcionarioSelecionado.nome,
            aviso_previo_id: avisoCriado.id,
            tipo: "Aviso Prévio",
            descricao: montarDescricaoAviso(),
            data: dataInicio,
          },
        ]);

      if (movimentacaoError) throw movimentacaoError;

      await sincronizarSituacaoFuncionario(funcionarioSelecionado.id);

      alert("Aviso prévio cadastrado com sucesso!");
      router.push("/aviso-previo");
    } catch (error) {
      console.error("Erro ao salvar aviso prévio:", error);
      alert("Erro ao cadastrar aviso prévio.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Novo Aviso Prévio"
        description="Cadastre um novo aviso prévio para o funcionário"
        actions={
          <Button href="/aviso-previo" variant="outline">
            Voltar
          </Button>
        }
      />

      <SectionCard title="Dados do aviso prévio">
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

            <Select
              label="Tipo"
              value={tipo}
              onChange={(e) =>
                setTipo(e.target.value as "Trabalhado" | "Indenizado")
              }
              options={[
                { label: "Trabalhado", value: "Trabalhado" },
                { label: "Indenizado", value: "Indenizado" },
              ]}
            />

            <Select
              label="Status"
              value={status}
              onChange={(e) =>
                setStatus(e.target.value as "Ativo" | "Concluído" | "Cancelado")
              }
              options={[
                { label: "Ativo", value: "Ativo" },
                { label: "Concluído", value: "Concluído" },
                { label: "Cancelado", value: "Cancelado" },
              ]}
            />

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Observação
              </label>
              <textarea
                value={observacao}
                onChange={(e) => setObservacao(e.target.value)}
                placeholder="Ex.: Aviso prévio referente ao desligamento por iniciativa da empresa"
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
              label="Dias de aviso"
              value={diasAviso > 0 ? `${diasAviso} dia(s)` : "-"}
            />
            <ResumoItem label="Tipo" value={tipo} />
          </div>

          <Card className="border-blue-100 bg-blue-50/50 p-4">
            <p className="text-sm text-slate-700">
              O sistema bloqueia cadastro duplicado ou sobreposição de períodos
              para o mesmo funcionário.
            </p>
          </Card>

          <div className="flex justify-end gap-3">
            <Button href="/aviso-previo" variant="outline">
              Cancelar
            </Button>

            <Button type="submit" disabled={saving} variant="primary">
              {saving ? "Salvando..." : "Salvar aviso"}
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