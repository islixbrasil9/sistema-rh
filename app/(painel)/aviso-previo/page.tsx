"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { sincronizarSituacaoFuncionario } from "@/utils/recalcularSituacaoFuncionario";
import {
  AlertTriangle,
  Clock,
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

type StatusCalculado = "Ativo" | "Concluído" | "Cancelado";

type AvisoComStatus = Aviso & {
  statusCalculado: StatusCalculado;
};

type AcaoAviso = "concluir" | "cancelar" | "excluir";

export default function AvisoPrevioPage() {
  const { showToast } = useToast();

  const [avisos, setAvisos] = useState<Aviso[]>([]);
  const [loading, setLoading] = useState(true);
  const [acaoLoadingId, setAcaoLoadingId] = useState<string | null>(null);

  const [buscaNome, setBuscaNome] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("");
  const [filtroDataInicial, setFiltroDataInicial] = useState("");
  const [filtroDataFinal, setFiltroDataFinal] = useState("");

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [acaoPendente, setAcaoPendente] = useState<{
    tipo: AcaoAviso;
    item: AvisoComStatus;
  } | null>(null);

  useEffect(() => {
    carregarAvisos();
  }, []);

  async function carregarAvisos() {
    setLoading(true);

    const { data, error } = await supabase
      .from("aviso_previo")
      .select("*")
      .order("data_inicio", { ascending: false });

    if (error) {
      console.error(error);
      showToast("Erro ao carregar aviso prévio.", "error");
    } else {
      setAvisos((data as Aviso[]) || []);
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

  function calcularStatus(item: Aviso): StatusCalculado {
    if (item.status === "Cancelado") return "Cancelado";
    if (hojeISO() <= item.data_fim) return "Ativo";
    return "Concluído";
  }

  const avisosComStatus = useMemo<AvisoComStatus[]>(() => {
    return avisos.map((item) => ({
      ...item,
      statusCalculado: calcularStatus(item),
    }));
  }, [avisos]);

  const registrosFiltrados = useMemo(() => {
    return avisosComStatus.filter((item) => {
      const matchNome = buscaNome
        ? item.funcionario_nome.toLowerCase().includes(buscaNome.toLowerCase())
        : true;

      const matchStatus = filtroStatus
        ? item.statusCalculado === filtroStatus
        : true;

      const matchTipo = filtroTipo ? item.tipo === filtroTipo : true;

      const matchDataInicial = filtroDataInicial
        ? item.data_inicio >= filtroDataInicial
        : true;

      const matchDataFinal = filtroDataFinal
        ? item.data_inicio <= filtroDataFinal
        : true;

      return (
        matchNome &&
        matchStatus &&
        matchTipo &&
        matchDataInicial &&
        matchDataFinal
      );
    });
  }, [
    avisosComStatus,
    buscaNome,
    filtroStatus,
    filtroTipo,
    filtroDataInicial,
    filtroDataFinal,
  ]);

  const ativos = avisosComStatus.filter(
    (item) => item.statusCalculado === "Ativo"
  ).length;

  const concluidos = avisosComStatus.filter(
    (item) => item.statusCalculado === "Concluído"
  ).length;

  const cancelados = avisosComStatus.filter(
    (item) => item.statusCalculado === "Cancelado"
  ).length;

  const alertas = useMemo(() => {
    const lista: string[] = [];

    if (ativos > 0) lista.push(`${ativos} aviso(s) prévio(s) em andamento`);
    if (concluidos > 0) lista.push(`${concluidos} aviso(s) concluído(s)`);
    if (cancelados > 0) lista.push(`${cancelados} aviso(s) cancelado(s)`);
    if (avisosComStatus.length === 0) {
      lista.push("Nenhum aviso prévio cadastrado no sistema");
    }

    return lista.slice(0, 4);
  }, [ativos, concluidos, cancelados, avisosComStatus.length]);

  function limparFiltros() {
    setBuscaNome("");
    setFiltroStatus("");
    setFiltroTipo("");
    setFiltroDataInicial("");
    setFiltroDataFinal("");
  }

  function formatarData(data: string) {
    if (!data) return "-";
    const [ano, mes, dia] = data.split("-");
    return `${dia}/${mes}/${ano}`;
  }

  function badgeTone(status: string) {
    if (status === "Ativo") return "blue" as const;
    if (status === "Concluído") return "green" as const;
    if (status === "Cancelado") return "red" as const;
    return "gray" as const;
  }

  function abrirConfirmacao(tipo: AcaoAviso, item: AvisoComStatus) {
    setAcaoPendente({ tipo, item });
    setConfirmOpen(true);
  }

  async function concluirAviso(item: AvisoComStatus) {
    setAcaoLoadingId(item.id);

    try {
      const { error: updateAvisoError } = await supabase
        .from("aviso_previo")
        .update({ status: "Concluído" })
        .eq("id", item.id);

      if (updateAvisoError) throw updateAvisoError;

      const { error: movimentacaoError } = await supabase
        .from("movimentacoes")
        .insert([
          {
            funcionario_id: item.funcionario_id,
            funcionario_nome: item.funcionario_nome,
            aviso_previo_id: item.id,
            tipo: "Demissão",
            descricao: `Desligamento efetivado após aviso prévio ${item.tipo.toLowerCase()} de ${formatarData(
              item.data_inicio
            )} até ${formatarData(item.data_fim)}${
              item.observacao ? `. Observação: ${item.observacao}` : ""
            }`,
            data: item.data_fim,
          },
        ]);

      if (movimentacaoError) throw movimentacaoError;

      await sincronizarSituacaoFuncionario(item.funcionario_id);

      showToast("Aviso prévio concluído com sucesso!", "success");
      await carregarAvisos();
    } catch (error) {
      console.error("Erro ao concluir aviso prévio:", error);
      showToast("Erro ao concluir aviso prévio.", "error");
    } finally {
      setAcaoLoadingId(null);
      setConfirmOpen(false);
      setAcaoPendente(null);
    }
  }

  async function cancelarAviso(item: AvisoComStatus) {
    setAcaoLoadingId(item.id);

    try {
      const { error: updateAvisoError } = await supabase
        .from("aviso_previo")
        .update({ status: "Cancelado" })
        .eq("id", item.id);

      if (updateAvisoError) throw updateAvisoError;

      await sincronizarSituacaoFuncionario(item.funcionario_id);

      showToast("Aviso prévio cancelado com sucesso!", "success");
      await carregarAvisos();
    } catch (error) {
      console.error("Erro ao cancelar aviso prévio:", error);
      showToast("Erro ao cancelar aviso prévio.", "error");
    } finally {
      setAcaoLoadingId(null);
      setConfirmOpen(false);
      setAcaoPendente(null);
    }
  }

  async function excluirAviso(item: AvisoComStatus) {
    setAcaoLoadingId(item.id);

    try {
      const { error: deleteAvisoError } = await supabase
        .from("aviso_previo")
        .delete()
        .eq("id", item.id);

      if (deleteAvisoError) throw deleteAvisoError;

      const { error: deleteMovError } = await supabase
        .from("movimentacoes")
        .delete()
        .eq("aviso_previo_id", item.id);

      if (deleteMovError) throw deleteMovError;

      await sincronizarSituacaoFuncionario(item.funcionario_id);

      showToast("Aviso prévio excluído com sucesso!", "success");
      await carregarAvisos();
    } catch (error) {
      console.error("Erro ao excluir aviso prévio:", error);
      showToast("Erro ao excluir aviso prévio.", "error");
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
        title: "Concluir aviso prévio",
        description: `Deseja concluir o aviso prévio de ${nome}?`,
        confirmText: "Concluir",
      };
    }

    if (acaoPendente.tipo === "cancelar") {
      return {
        title: "Cancelar aviso prévio",
        description: `Deseja cancelar o aviso prévio de ${nome}?`,
        confirmText: "Cancelar aviso",
      };
    }

    return {
      title: "Excluir aviso prévio",
      description: `Deseja realmente excluir o aviso prévio de ${nome}? Essa ação não poderá ser desfeita.`,
      confirmText: "Excluir",
    };
  }

  async function handleConfirmAction() {
    if (!acaoPendente) return;

    if (acaoPendente.tipo === "concluir") {
      await concluirAviso(acaoPendente.item);
      return;
    }

    if (acaoPendente.tipo === "cancelar") {
      await cancelarAviso(acaoPendente.item);
      return;
    }

    await excluirAviso(acaoPendente.item);
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Aviso Prévio"
          description="Controle de desligamentos"
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
        title="Aviso Prévio"
        description="Controle de desligamentos"
        actions={
          <Button href="/aviso-previo/novo" variant="outline">
            + Novo aviso
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        <StatCard
          title="Ativos"
          value={ativos}
          subtitle="Em andamento"
          icon={<Clock size={18} />}
          tone="blue"
        />
        <StatCard
          title="Concluídos"
          value={concluidos}
          subtitle="Finalizados"
          icon={<CheckCircle size={18} />}
          tone="green"
        />
        <StatCard
          title="Cancelados"
          value={cancelados}
          subtitle="Encerrados sem conclusão"
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
            alertas.map((item, index) => <p key={index}>{item}</p>)
          )}
        </div>
      </Card>

      <SectionCard title="Buscar e filtrar avisos">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
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
              { label: "Ativo", value: "Ativo" },
              { label: "Concluído", value: "Concluído" },
              { label: "Cancelado", value: "Cancelado" },
            ]}
          />

          <Select
            label="Tipo"
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value)}
            options={[
              { label: "Todos", value: "" },
              { label: "Trabalhado", value: "Trabalhado" },
              { label: "Indenizado", value: "Indenizado" },
            ]}
          />

          <Input
            label="Data inicial"
            type="date"
            value={filtroDataInicial}
            onChange={(e) => setFiltroDataInicial(e.target.value)}
          />

          <Input
            label="Data final"
            type="date"
            value={filtroDataFinal}
            onChange={(e) => setFiltroDataFinal(e.target.value)}
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
        title="Histórico de aviso prévio"
        description="Registros cadastrados no módulo de aviso prévio"
      >
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-left text-sm text-slate-500">
                <th className="px-6 py-4 font-medium">Funcionário</th>
                <th className="px-6 py-4 font-medium">Tipo</th>
                <th className="px-6 py-4 font-medium">Início</th>
                <th className="px-6 py-4 font-medium">Fim</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Observação</th>
                <th className="px-6 py-4 font-medium">Ações</th>
              </tr>
            </thead>

            <tbody>
              {registrosFiltrados.map((item) => (
                <tr
                  key={item.id}
                  className="border-b border-slate-100 transition hover:bg-slate-50"
                >
                  <td className="px-6 py-4 font-medium text-slate-900">
                    {item.funcionario_nome}
                  </td>

                  <td className="px-6 py-4 text-slate-700">{item.tipo}</td>

                  <td className="px-6 py-4 text-slate-700">
                    {formatarData(item.data_inicio)}
                  </td>

                  <td className="px-6 py-4 text-slate-700">
                    {formatarData(item.data_fim)}
                  </td>

                  <td className="px-6 py-4">
                    <StatusBadge
                      tone={badgeTone(item.statusCalculado)}
                      className="whitespace-nowrap"
                    >
                      {item.statusCalculado}
                    </StatusBadge>
                  </td>

                  <td className="px-6 py-4 text-slate-700">
                    {item.observacao || "-"}
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Button
                        href={`/funcionarios/${item.funcionario_id}`}
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
                            href: `/aviso-previo/editar/${item.id}`,
                          },
                          item.statusCalculado === "Ativo"
                            ? {
                                label:
                                  acaoLoadingId === item.id
                                    ? "Processando..."
                                    : "Concluir",
                                onClick: () => abrirConfirmacao("concluir", item),
                                disabled: acaoLoadingId === item.id,
                              }
                            : null,
                          item.statusCalculado === "Ativo"
                            ? {
                                label:
                                  acaoLoadingId === item.id
                                    ? "Processando..."
                                    : "Cancelar",
                                onClick: () => abrirConfirmacao("cancelar", item),
                                danger: true,
                                disabled: acaoLoadingId === item.id,
                              }
                            : null,
                          {
                            label:
                              acaoLoadingId === item.id
                                ? "Processando..."
                                : "Excluir",
                            onClick: () => abrirConfirmacao("excluir", item),
                            danger: true,
                            disabled: acaoLoadingId === item.id,
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
              title="Nenhum aviso prévio encontrado"
              description="Cadastre avisos prévios ou ajuste os filtros para visualizar resultados."
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