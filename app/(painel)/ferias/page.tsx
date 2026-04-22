"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { sincronizarSituacaoFuncionario } from "@/utils/recalcularSituacaoFuncionario";
import {
  AlertTriangle,
  CalendarDays,
  Plane,
  CheckCircle,
  XCircle,
  Eye,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/ui/stat-card";
import { SectionCard } from "@/components/ui/section-card";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { TableContainer } from "@/components/ui/table-container";
import { ActionsMenu } from "@/components/ui/actions-menu";
import { useToast } from "@/components/ui/toast";
import { ConfirmModal } from "@/components/ui/confirm-modal";

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

type StatusFeriasCalculado =
  | "Programadas"
  | "Em andamento"
  | "Concluídas"
  | "Canceladas";

type FeriasComStatus = Ferias & {
  statusCalculado: StatusFeriasCalculado;
};

type AcaoFerias = "concluir" | "cancelar" | "excluir";

export default function FeriasPage() {
  const { showToast } = useToast();

  const [ferias, setFerias] = useState<Ferias[]>([]);
  const [loading, setLoading] = useState(true);
  const [acaoLoadingId, setAcaoLoadingId] = useState<string | null>(null);

  const [buscaNome, setBuscaNome] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("");
  const [filtroDataInicio, setFiltroDataInicio] = useState("");
  const [filtroDataFim, setFiltroDataFim] = useState("");

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [acaoPendente, setAcaoPendente] = useState<{
    tipo: AcaoFerias;
    item: FeriasComStatus;
  } | null>(null);

  useEffect(() => {
    carregarFerias();
  }, []);

  async function carregarFerias() {
    setLoading(true);

    const { data, error } = await supabase
      .from("ferias")
      .select("*")
      .order("data_inicio", { ascending: false });

    if (error) {
      console.error(error);
      showToast("Erro ao carregar férias.", "error");
    } else {
      setFerias((data as Ferias[]) || []);
    }

    setLoading(false);
  }

  function hojeISO() {
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = String(hoje.getMonth() + 1).padStart(2, "0");
    const dia = String(hoje.getDate()).padStart(2, "0");
    return `${ano}-${mes}-${dia}`;
  }

  function calcularStatus(item: Ferias): StatusFeriasCalculado {
    if (item.status === "Canceladas") return "Canceladas";

    const hoje = hojeISO();

    if (hoje < item.data_inicio) return "Programadas";
    if (hoje >= item.data_inicio && hoje <= item.data_fim) {
      return "Em andamento";
    }
    if (hoje >= item.data_retorno) return "Concluídas";

    return item.status;
  }

  const feriasComStatus = useMemo<FeriasComStatus[]>(() => {
    return ferias.map((item) => ({
      ...item,
      statusCalculado: calcularStatus(item),
    }));
  }, [ferias]);

  const registrosFiltrados = useMemo(() => {
    return feriasComStatus.filter((item) => {
      const matchNome = buscaNome
        ? item.funcionario_nome.toLowerCase().includes(buscaNome.toLowerCase())
        : true;

      const matchStatus = filtroStatus
        ? item.statusCalculado === filtroStatus
        : true;

      const matchDataInicial = filtroDataInicio
        ? item.data_inicio >= filtroDataInicio
        : true;

      const matchDataFinal = filtroDataFim
        ? item.data_inicio <= filtroDataFim
        : true;

      return matchNome && matchStatus && matchDataInicial && matchDataFinal;
    });
  }, [feriasComStatus, buscaNome, filtroStatus, filtroDataInicio, filtroDataFim]);

  const emAndamento = feriasComStatus.filter(
    (f) => f.statusCalculado === "Em andamento"
  ).length;

  const programadas = feriasComStatus.filter(
    (f) => f.statusCalculado === "Programadas"
  ).length;

  const concluidas = feriasComStatus.filter(
    (f) => f.statusCalculado === "Concluídas"
  ).length;

  const canceladas = feriasComStatus.filter(
    (f) => f.statusCalculado === "Canceladas"
  ).length;

  const alertas = useMemo(() => {
    const lista: string[] = [];

    if (emAndamento > 0) {
      lista.push(`${emAndamento} funcionário(s) estão em férias atualmente`);
    }

    if (programadas > 0) {
      lista.push(`${programadas} férias programadas`);
    }

    if (concluidas > 0) {
      lista.push(`${concluidas} férias concluídas`);
    }

    if (canceladas > 0) {
      lista.push(`${canceladas} férias canceladas`);
    }

    if (feriasComStatus.length === 0) {
      lista.push("Nenhum registro de férias cadastrado no sistema");
    }

    return lista.slice(0, 4);
  }, [emAndamento, programadas, concluidas, canceladas, feriasComStatus.length]);

  function limparFiltros() {
    setBuscaNome("");
    setFiltroStatus("");
    setFiltroDataInicio("");
    setFiltroDataFim("");
  }

  function formatarData(data: string) {
    if (!data) return "-";
    const [ano, mes, dia] = data.split("-");
    return `${dia}/${mes}/${ano}`;
  }

  function badgeTone(status: string) {
    if (status === "Em andamento") return "blue" as const;
    if (status === "Programadas") return "amber" as const;
    if (status === "Concluídas") return "green" as const;
    if (status === "Canceladas") return "red" as const;
    return "gray" as const;
  }

  function abrirConfirmacao(tipo: AcaoFerias, item: FeriasComStatus) {
    setAcaoPendente({ tipo, item });
    setConfirmOpen(true);
  }

  async function concluirFerias(item: FeriasComStatus) {
    setAcaoLoadingId(item.id);

    try {
      const { error: updateFeriasError } = await supabase
        .from("ferias")
        .update({ status: "Concluídas" })
        .eq("id", item.id);

      if (updateFeriasError) throw updateFeriasError;

      await sincronizarSituacaoFuncionario(item.funcionario_id);

      showToast("Férias concluídas com sucesso!", "success");
      await carregarFerias();
    } catch (error) {
      console.error("Erro ao concluir férias:", error);
      showToast("Erro ao concluir férias.", "error");
    } finally {
      setAcaoLoadingId(null);
      setConfirmOpen(false);
      setAcaoPendente(null);
    }
  }

  async function cancelarFerias(item: FeriasComStatus) {
    setAcaoLoadingId(item.id);

    try {
      const { error: updateFeriasError } = await supabase
        .from("ferias")
        .update({ status: "Canceladas" })
        .eq("id", item.id);

      if (updateFeriasError) throw updateFeriasError;

      await sincronizarSituacaoFuncionario(item.funcionario_id);

      showToast("Férias canceladas com sucesso!", "success");
      await carregarFerias();
    } catch (error) {
      console.error("Erro ao cancelar férias:", error);
      showToast("Erro ao cancelar férias.", "error");
    } finally {
      setAcaoLoadingId(null);
      setConfirmOpen(false);
      setAcaoPendente(null);
    }
  }

  async function excluirFerias(item: FeriasComStatus) {
    setAcaoLoadingId(item.id);

    try {
      const { error: deleteFeriasError } = await supabase
        .from("ferias")
        .delete()
        .eq("id", item.id);

      if (deleteFeriasError) throw deleteFeriasError;

      const { error: deleteMovError } = await supabase
        .from("movimentacoes")
        .delete()
        .eq("ferias_id", item.id);

      if (deleteMovError) throw deleteMovError;

      await sincronizarSituacaoFuncionario(item.funcionario_id);

      showToast("Registro de férias excluído com sucesso!", "success");
      await carregarFerias();
    } catch (error) {
      console.error("Erro ao excluir férias:", error);
      showToast("Erro ao excluir férias.", "error");
    } finally {
      setAcaoLoadingId(null);
      setConfirmOpen(false);
      setAcaoPendente(null);
    }
  }

  function getConfirmContent() {
    if (!acaoPendente) {
      return {
        title: "",
        description: "",
        confirmText: "Confirmar",
      };
    }

    const nome = acaoPendente.item.funcionario_nome;

    if (acaoPendente.tipo === "concluir") {
      return {
        title: "Concluir férias",
        description: `Deseja concluir as férias de ${nome}?`,
        confirmText: "Concluir",
      };
    }

    if (acaoPendente.tipo === "cancelar") {
      return {
        title: "Cancelar férias",
        description: `Deseja cancelar as férias de ${nome}?`,
        confirmText: "Cancelar férias",
      };
    }

    return {
      title: "Excluir registro de férias",
      description: `Deseja realmente excluir o registro de férias de ${nome}? Essa ação não poderá ser desfeita.`,
      confirmText: "Excluir",
    };
  }

  async function handleConfirmAction() {
    if (!acaoPendente) return;

    if (acaoPendente.tipo === "concluir") {
      await concluirFerias(acaoPendente.item);
      return;
    }

    if (acaoPendente.tipo === "cancelar") {
      await cancelarFerias(acaoPendente.item);
      return;
    }

    await excluirFerias(acaoPendente.item);
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Férias"
          description="Controle de férias dos funcionários"
        />

        <Card className="p-8">
          <p className="text-sm text-slate-500">Carregando...</p>
        </Card>
      </div>
    );
  }

  const confirmContent = getConfirmContent();

  return (
    <div className="space-y-8">
      <PageHeader
        title="Férias"
        description="Controle de férias dos funcionários"
        actions={
          <Button href="/ferias/nova" variant="outline">
            + Registrar férias
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Em andamento"
          value={emAndamento}
          subtitle="Férias em curso"
          icon={<Plane size={18} />}
          tone="blue"
        />
        <StatCard
          title="Programadas"
          value={programadas}
          subtitle="Agendadas"
          icon={<CalendarDays size={18} />}
          tone="amber"
        />
        <StatCard
          title="Concluídas"
          value={concluidas}
          subtitle="Finalizadas"
          icon={<CheckCircle size={18} />}
          tone="green"
        />
        <StatCard
          title="Canceladas"
          value={canceladas}
          subtitle="Registros cancelados"
          icon={<XCircle size={18} />}
          tone="gray"
        />
      </div>

      <Card className="border-yellow-200 bg-yellow-50/25 p-5">
        <div className="flex items-center gap-2 text-yellow-900">
          <AlertTriangle size={18} />
          <p className="font-semibold">Atenções</p>
        </div>

        <div className="mt-3 space-y-1 text-sm text-slate-700">
          {alertas.length === 0 ? (
            <p>Nenhum alerta</p>
          ) : (
            alertas.map((a, i) => <p key={i}>{a}</p>)
          )}
        </div>
      </Card>

      <SectionCard title="Buscar e filtrar férias">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="xl:col-span-2">
            <Input
              label="Buscar por funcionário"
              type="text"
              value={buscaNome}
              onChange={(e) => setBuscaNome(e.target.value)}
              placeholder="Digite o nome do funcionário"
            />
          </div>

          <Select
            label="Status"
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value)}
            options={[
              { label: "Todos", value: "" },
              { label: "Programadas", value: "Programadas" },
              { label: "Em andamento", value: "Em andamento" },
              { label: "Concluídas", value: "Concluídas" },
              { label: "Canceladas", value: "Canceladas" },
            ]}
          />

          <Input
            label="Data inicial"
            type="date"
            value={filtroDataInicio}
            onChange={(e) => setFiltroDataInicio(e.target.value)}
          />

          <Input
            label="Data final"
            type="date"
            value={filtroDataFim}
            onChange={(e) => setFiltroDataFim(e.target.value)}
          />
        </div>

        <div className="mt-4 flex flex-col gap-3 rounded-2xl bg-slate-50 p-4 md:flex-row md:items-center md:justify-between">
          <div className="text-sm text-slate-600">
            Exibindo{" "}
            <span className="font-semibold text-slate-900">
              {registrosFiltrados.length}
            </span>{" "}
            registro(s)
          </div>

          <Button onClick={limparFiltros} variant="outline">
            Limpar filtros
          </Button>
        </div>
      </SectionCard>

      <TableContainer
        title="Histórico de férias"
        description="Registros cadastrados no módulo de férias"
      >
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-left text-sm text-slate-500">
                <th className="px-6 py-4 font-medium">Funcionário</th>
                <th className="px-6 py-4 font-medium">Início</th>
                <th className="px-6 py-4 font-medium">Fim</th>
                <th className="px-6 py-4 font-medium">Retorno</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Observação</th>
                <th className="px-6 py-4 font-medium">Ações</th>
              </tr>
            </thead>

            <tbody>
              {registrosFiltrados.map((f) => (
                <tr
                  key={f.id}
                  className="border-b border-slate-100 transition hover:bg-slate-50"
                >
                  <td className="px-6 py-4 font-medium text-slate-900">
                    {f.funcionario_nome}
                  </td>

                  <td className="px-6 py-4 text-slate-700">
                    {formatarData(f.data_inicio)}
                  </td>

                  <td className="px-6 py-4 text-slate-700">
                    {formatarData(f.data_fim)}
                  </td>

                  <td className="px-6 py-4 text-slate-700">
                    {formatarData(f.data_retorno)}
                  </td>

                  <td className="px-6 py-4">
                    <StatusBadge
                      tone={badgeTone(f.statusCalculado)}
                      className="whitespace-nowrap"
                    >
                      {f.statusCalculado}
                    </StatusBadge>
                  </td>

                  <td className="px-6 py-4 text-slate-700">
                    {f.observacao || "-"}
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Button
                        href={`/funcionarios/${f.funcionario_id}`}
                        variant="outline"
                        size="sm"
                        icon={<Eye size={14} />}
                        className="whitespace-nowrap"
                      >
                        Ver
                      </Button>

                      <ActionsMenu
                        actions={[
                          {
                            label: "Editar",
                            href: `/ferias/editar/${f.id}`,
                          },
                          f.statusCalculado === "Em andamento"
                            ? {
                                label:
                                  acaoLoadingId === f.id
                                    ? "Processando..."
                                    : "Concluir",
                                onClick: () => abrirConfirmacao("concluir", f),
                                disabled: acaoLoadingId === f.id,
                              }
                            : null,
                          f.statusCalculado === "Programadas"
                            ? {
                                label:
                                  acaoLoadingId === f.id
                                    ? "Processando..."
                                    : "Cancelar",
                                onClick: () => abrirConfirmacao("cancelar", f),
                                danger: true,
                                disabled: acaoLoadingId === f.id,
                              }
                            : null,
                          {
                            label:
                              acaoLoadingId === f.id
                                ? "Processando..."
                                : "Excluir",
                            onClick: () => abrirConfirmacao("excluir", f),
                            danger: true,
                            disabled: acaoLoadingId === f.id,
                          },
                        ].filter(Boolean) as {
                          label: string;
                          onClick?: () => void;
                          href?: string;
                          danger?: boolean;
                          disabled?: boolean;
                        }[]}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {registrosFiltrados.length === 0 && (
          <div className="px-6 py-8">
            <EmptyState
              title="Nenhum registro de férias encontrado"
              description="Cadastre férias ou ajuste os filtros para visualizar resultados."
            />
          </div>
        )}
      </TableContainer>

      <ConfirmModal
        open={confirmOpen}
        title={confirmContent.title}
        description={confirmContent.description}
        confirmText={confirmContent.confirmText}
        loading={acaoLoadingId === acaoPendente?.item.id}
        onCancel={() => {
          if (!acaoLoadingId) {
            setConfirmOpen(false);
            setAcaoPendente(null);
          }
        }}
        onConfirm={handleConfirmAction}
      />
    </div>
  );
}