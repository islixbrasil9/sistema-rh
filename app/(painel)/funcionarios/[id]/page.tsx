"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { sincronizarSituacaoFuncionario } from "@/utils/recalcularSituacaoFuncionario";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { SectionCard } from "@/components/ui/section-card";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { TableContainer } from "@/components/ui/table-container";

type Funcionario = {
  id: string;
  nome: string;
  cpf?: string | null;
  pis?: string | null;
  data_nascimento?: string | null;
  telefone?: string | null;
  cargo: string;
  setor?: string | null;
  salario?: number | string | null;
  situacao: string;
  admissao: string;
};

type Movimentacao = {
  id: string;
  funcionario_id: string;
  funcionario_nome: string;
  tipo: string;
  descricao: string;
  data: string;
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

type AvisoPrevio = {
  id: string;
  funcionario_id: string;
  funcionario_nome: string;
  data_inicio: string;
  data_fim: string;
  tipo: "Trabalhado" | "Indenizado";
  status: "Ativo" | "Concluído" | "Cancelado";
  observacao?: string | null;
};

type StatusFeriasCalculado =
  | "Programadas"
  | "Em andamento"
  | "Concluídas"
  | "Canceladas";

type StatusAvisoCalculado = "Ativo" | "Concluído" | "Cancelado";

export default function VisualizarFuncionarioPage() {
  const params = useParams();
  const id = params.id as string;

  const [funcionario, setFuncionario] = useState<Funcionario | null>(null);
  const [movimentacoes, setMovimentacoes] = useState<Movimentacao[]>([]);
  const [ferias, setFerias] = useState<Ferias[]>([]);
  const [avisosPrevios, setAvisosPrevios] = useState<AvisoPrevio[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      carregarDados();
    }
  }, [id]);

  async function carregarDados() {
    setLoading(true);

    try {
      await sincronizarSituacaoFuncionario(id);

      const [
        funcionarioResponse,
        movimentacoesResponse,
        feriasResponse,
        avisosResponse,
      ] = await Promise.all([
        supabase.from("funcionarios").select("*").eq("id", id).single(),
        supabase
          .from("movimentacoes")
          .select("*")
          .eq("funcionario_id", id)
          .order("data", { ascending: false }),
        supabase
          .from("ferias")
          .select("*")
          .eq("funcionario_id", id)
          .order("data_inicio", { ascending: false }),
        supabase
          .from("aviso_previo")
          .select("*")
          .eq("funcionario_id", id)
          .order("data_inicio", { ascending: false }),
      ]);

      if (funcionarioResponse.error) throw funcionarioResponse.error;
      if (movimentacoesResponse.error) throw movimentacoesResponse.error;
      if (feriasResponse.error) throw feriasResponse.error;
      if (avisosResponse.error) throw avisosResponse.error;

      setFuncionario(funcionarioResponse.data as Funcionario);
      setMovimentacoes((movimentacoesResponse.data as Movimentacao[]) || []);
      setFerias((feriasResponse.data as Ferias[]) || []);
      setAvisosPrevios((avisosResponse.data as AvisoPrevio[]) || []);
    } catch (error) {
      console.error("Erro ao carregar funcionário:", error);
      alert("Erro ao carregar dados do funcionário.");
    } finally {
      setLoading(false);
    }
  }

  function formatarDataBR(data: string) {
    if (!data) return "-";

    if (/^\d{4}-\d{2}-\d{2}$/.test(data)) {
      const [ano, mes, dia] = data.split("-");
      return `${dia}/${mes}/${ano}`;
    }

    return data;
  }

  function formatarSalario(valor?: number | string | null) {
    const numero = Number(valor ?? 0);

    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(numero);
  }

  function badgeSituacaoTone(situacao: string) {
    if (situacao === "Ativo") return "green" as const;
    if (situacao === "Férias") return "blue" as const;
    if (situacao === "Afastado") return "amber" as const;
    if (situacao === "Suspenso") return "red" as const;
    if (situacao === "Inativo") return "gray" as const;
    return "gray" as const;
  }

  function badgeMovTone(tipo: string) {
    if (tipo === "Férias") return "blue" as const;
    if (tipo === "Afastamento") return "amber" as const;
    if (tipo === "Retorno") return "green" as const;
    if (tipo === "Suspensão") return "red" as const;
    if (tipo === "Advertência") return "orange" as const;
    if (tipo === "Demissão") return "gray" as const;
    if (tipo === "Acidente de Trabalho") return "red" as const;
    if (tipo === "Observação") return "gray" as const;
    if (tipo === "Aviso Prévio") return "blue" as const;
    return "gray" as const;
  }

  function hojeISO() {
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = String(hoje.getMonth() + 1).padStart(2, "0");
    const dia = String(hoje.getDate()).padStart(2, "0");
    return `${ano}-${mes}-${dia}`;
  }

  function calcularStatusFerias(item: Ferias): StatusFeriasCalculado {
    if (item.status === "Canceladas") return "Canceladas";

    const hoje = hojeISO();

    if (hoje < item.data_inicio) return "Programadas";
    if (hoje >= item.data_inicio && hoje <= item.data_fim) {
      return "Em andamento";
    }
    if (hoje >= item.data_retorno) return "Concluídas";

    return item.status;
  }

  function calcularStatusAviso(item: AvisoPrevio): StatusAvisoCalculado {
    if (item.status === "Cancelado") return "Cancelado";
    if (hojeISO() <= item.data_fim) return "Ativo";
    return "Concluído";
  }

  function badgeFeriasTone(status: string) {
    if (status === "Programadas") return "amber" as const;
    if (status === "Em andamento") return "blue" as const;
    if (status === "Concluídas") return "green" as const;
    if (status === "Canceladas") return "red" as const;
    return "gray" as const;
  }

  function badgeAvisoTone(status: string) {
    if (status === "Ativo") return "blue" as const;
    if (status === "Concluído") return "green" as const;
    if (status === "Cancelado") return "red" as const;
    return "gray" as const;
  }

  const feriasComStatus = useMemo(() => {
    return ferias.map((item) => ({
      ...item,
      statusCalculado: calcularStatusFerias(item),
    }));
  }, [ferias]);

  const avisosComStatus = useMemo(() => {
    return avisosPrevios.map((item) => ({
      ...item,
      statusCalculado: calcularStatusAviso(item),
    }));
  }, [avisosPrevios]);

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Funcionário"
          description="Dados cadastrais e histórico completo"
        />
        <Card className="p-8">
          <p className="text-sm text-slate-500">Carregando...</p>
        </Card>
      </div>
    );
  }

  if (!funcionario) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Funcionário não encontrado"
          description="Não foi possível localizar este cadastro."
          actions={
            <Button href="/funcionarios" variant="outline">
              Voltar
            </Button>
          }
        />
        <EmptyState
          title="Funcionário não encontrado"
          description="Verifique se o registro ainda existe ou volte para a listagem."
        />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title={funcionario.nome}
        description="Dados cadastrais e histórico completo do funcionário"
        actions={
          <>
            <Button
              href={`/movimentacoes?funcionarioId=${funcionario.id}`}
              variant="outline"
            >
              Nova movimentação
            </Button>

            <Button
              href={`/funcionarios/editar/${funcionario.id}`}
              variant="primary"
            >
              Editar
            </Button>

            <Button href="/funcionarios" variant="outline">
              Voltar
            </Button>
          </>
        }
      />

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <InfoCard label="CPF" value={funcionario.cpf || "-"} />
        <InfoCard label="PIS" value={funcionario.pis || "-"} />
        <InfoCard
          label="Data de nascimento"
          value={formatarDataBR(funcionario.data_nascimento || "")}
        />
        <InfoCard label="Telefone" value={funcionario.telefone || "-"} />
        <InfoCard label="Cargo" value={funcionario.cargo} />
        <InfoCard label="Setor" value={funcionario.setor || "-"} />
        <InfoCard
          label="Salário"
          value={formatarSalario(funcionario.salario)}
        />

        <Card className="p-6">
          <p className="text-sm text-slate-500">Situação</p>
          <div className="mt-3">
            <StatusBadge tone={badgeSituacaoTone(funcionario.situacao)}>
              {funcionario.situacao}
            </StatusBadge>
          </div>
        </Card>

        <InfoCard
          label="Admissão"
          value={formatarDataBR(funcionario.admissao)}
        />
        <InfoCard
          label="Total de movimentações"
          value={String(movimentacoes.length)}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <TableContainer
          title="Férias"
          description="Histórico de períodos de férias"
        >
          <div className="flex justify-end border-b border-slate-200 px-6 py-4">
            <Button href="/ferias" variant="outline" size="sm">
              Ver módulo
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-left text-sm text-slate-500">
                  <th className="px-6 py-4 font-medium">Início</th>
                  <th className="px-6 py-4 font-medium">Fim</th>
                  <th className="px-6 py-4 font-medium">Retorno</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                </tr>
              </thead>

              <tbody>
                {feriasComStatus.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-slate-100 transition hover:bg-slate-50"
                  >
                    <td className="px-6 py-4 text-slate-700">
                      {formatarDataBR(item.data_inicio)}
                    </td>
                    <td className="px-6 py-4 text-slate-700">
                      {formatarDataBR(item.data_fim)}
                    </td>
                    <td className="px-6 py-4 text-slate-700">
                      {formatarDataBR(item.data_retorno)}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge
                        tone={badgeFeriasTone(item.statusCalculado)}
                        className="whitespace-nowrap"
                      >
                        {item.statusCalculado}
                      </StatusBadge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {feriasComStatus.length === 0 && (
            <div className="px-6 py-8">
              <EmptyState
                title="Nenhum registro de férias"
                description="Este funcionário ainda não possui férias cadastradas."
              />
            </div>
          )}
        </TableContainer>

        <TableContainer
          title="Aviso prévio"
          description="Histórico de avisos prévios"
        >
          <div className="flex justify-end border-b border-slate-200 px-6 py-4">
            <Button href="/aviso-previo" variant="outline" size="sm">
              Ver módulo
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-left text-sm text-slate-500">
                  <th className="px-6 py-4 font-medium">Tipo</th>
                  <th className="px-6 py-4 font-medium">Início</th>
                  <th className="px-6 py-4 font-medium">Fim</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                </tr>
              </thead>

              <tbody>
                {avisosComStatus.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-slate-100 transition hover:bg-slate-50"
                  >
                    <td className="px-6 py-4 text-slate-700">{item.tipo}</td>
                    <td className="px-6 py-4 text-slate-700">
                      {formatarDataBR(item.data_inicio)}
                    </td>
                    <td className="px-6 py-4 text-slate-700">
                      {formatarDataBR(item.data_fim)}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge
                        tone={badgeAvisoTone(item.statusCalculado)}
                        className="whitespace-nowrap"
                      >
                        {item.statusCalculado}
                      </StatusBadge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {avisosComStatus.length === 0 && (
            <div className="px-6 py-8">
              <EmptyState
                title="Nenhum aviso prévio"
                description="Este funcionário ainda não possui aviso prévio cadastrado."
              />
            </div>
          )}
        </TableContainer>
      </div>

      <TableContainer
        title="Histórico de movimentações"
        description="Eventos gerais registrados para este funcionário"
      >
        <div className="flex justify-end border-b border-slate-200 px-6 py-4">
          <Button
            href={`/movimentacoes?funcionarioId=${funcionario.id}`}
            variant="outline"
            size="sm"
          >
            Registrar movimentação
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-left text-sm text-slate-500">
                <th className="px-6 py-4 font-medium">Tipo</th>
                <th className="px-6 py-4 font-medium">Descrição</th>
                <th className="px-6 py-4 font-medium">Data</th>
              </tr>
            </thead>

            <tbody>
              {movimentacoes.map((mov) => (
                <tr
                  key={mov.id}
                  className="border-b border-slate-100 transition hover:bg-slate-50"
                >
                  <td className="px-6 py-4">
                    <StatusBadge
                      tone={badgeMovTone(mov.tipo)}
                      className="whitespace-nowrap"
                    >
                      {mov.tipo}
                    </StatusBadge>
                  </td>
                  <td className="px-6 py-4 text-slate-700">{mov.descricao}</td>
                  <td className="px-6 py-4 text-slate-600 whitespace-nowrap">
                    {formatarDataBR(mov.data)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {movimentacoes.length === 0 && (
          <div className="px-6 py-8">
            <EmptyState
              title="Nenhuma movimentação encontrada"
              description="Ainda não há eventos registrados para este funcionário."
            />
          </div>
        )}
      </TableContainer>
    </div>
  );
}

function InfoCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <Card className="p-6">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-3 text-lg font-semibold text-slate-900">{value}</p>
    </Card>
  );
}