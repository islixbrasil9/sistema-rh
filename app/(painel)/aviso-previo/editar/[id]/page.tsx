"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { SectionCard } from "@/components/ui/section-card";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

type Funcionario = {
  id: string;
  nome: string;
  cargo: string;
  situacao: string;
};

type Aviso = {
  id: string;
  funcionario_id: string;
  funcionario_nome: string;
  data_inicio: string;
  data_fim: string;
  tipo: "Trabalhado" | "Indenizado";
  status: "Ativo" | "Concluído" | "Cancelado";
  observacao?: string | null;
};

export default function EditarAvisoPrevioPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [loading, setLoading] = useState(true);
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

      const { data: avisoData, error: avisoError } = await supabase
        .from("aviso_previo")
        .select("*")
        .eq("id", id)
        .single();

      if (avisoError) throw avisoError;

      setFuncionarios((funcionariosData as Funcionario[]) || []);

      const registro = avisoData as Aviso;

      setFuncionarioId(registro.funcionario_id);
      setDataInicio(registro.data_inicio);
      setDataFim(registro.data_fim);
      setTipo(registro.tipo);
      setStatus(registro.status);
      setObservacao(registro.observacao || "");
    } catch (error) {
      console.error("Erro ao carregar aviso prévio:", error);
      alert("Erro ao carregar dados do aviso prévio.");
    } finally {
      setLoading(false);
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

    const { data, error } = await supabase
      .from("aviso_previo")
      .select("*")
      .eq("funcionario_id", funcionarioSelecionado.id);

    if (error) throw error;

    const registros = ((data as Aviso[]) || []).filter((item) => item.id !== id);
    const registrosValidos = registros.filter((item) => item.status !== "Cancelado");

    const possuiSobreposicao = registrosValidos.some((item) =>
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

      const { error: updateAvisoError } = await supabase
        .from("aviso_previo")
        .update({
          funcionario_id: funcionarioSelecionado.id,
          funcionario_nome: funcionarioSelecionado.nome,
          data_inicio: dataInicio,
          data_fim: dataFim,
          tipo,
          status,
          observacao: observacao.trim() || null,
        })
        .eq("id", id);

      if (updateAvisoError) throw updateAvisoError;

      if (status !== "Cancelado") {
        const { error: updateFuncionarioError } = await supabase
          .from("funcionarios")
          .update({ situacao: "Inativo" })
          .eq("id", funcionarioSelecionado.id);

        if (updateFuncionarioError) throw updateFuncionarioError;
      }

      alert("Aviso prévio atualizado com sucesso!");
      router.push("/aviso-previo");
    } catch (error) {
      console.error("Erro ao atualizar aviso prévio:", error);
      alert("Erro ao atualizar aviso prévio.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Editar Aviso Prévio"
          description="Atualize as informações do registro de aviso prévio"
        />

        <Card className="p-8">
          <p className="text-sm text-slate-500">Carregando...</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Editar Aviso Prévio"
        description="Atualize as informações do registro de aviso prévio"
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
                required
                options={[
                  { label: "Selecione um funcionário", value: "" },
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
                placeholder="Ex.: Ajuste de período ou tipo do aviso"
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

          <div className="flex justify-end gap-3">
            <Button href="/aviso-previo" variant="outline">
              Cancelar
            </Button>

            <Button type="submit" disabled={saving} variant="primary">
              {saving ? "Salvando..." : "Salvar alterações"}
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