"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  CAMPOS_RELATORIO,
  baixarRelatorioPDF,
  exportarFuncionariosCSV,
  imprimirRelatorioPDF,
  type CampoRelatorio,
} from "@/utils/gerarRelatorio";
import type { Funcionario } from "@/types/funcionarios";
import { supabase } from "@/lib/supabase";
import {
  Users,
  CheckCircle2,
  Plane,
  ShieldAlert,
  UserX,
  Search,
  FileText,
  PlusCircle,
  CalendarDays,
  Pencil,
  Eye,
  Trash2,
  MoreHorizontal,
  Printer,
  FileSpreadsheet,
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
import { useToast } from "@/components/ui/toast";
import { ConfirmModal } from "@/components/ui/confirm-modal";

export default function FuncionariosPage() {
  const { showToast } = useToast();

  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [busca, setBusca] = useState("");
  const [filtroCargo, setFiltroCargo] = useState("");
  const [filtroSituacao, setFiltroSituacao] = useState("");
  const [filtroAdmissaoInicial, setFiltroAdmissaoInicial] = useState("");
  const [filtroAdmissaoFinal, setFiltroAdmissaoFinal] = useState("");
  const [loading, setLoading] = useState(true);

  const [paginaAtual, setPaginaAtual] = useState(1);
  const [itensPorPagina, setItensPorPagina] = useState(10);

  const [camposSelecionados, setCamposSelecionados] = useState<CampoRelatorio[]>(
    ["nome", "setor", "situacao", "admissao"]
  );

  const [funcionarioParaExcluir, setFuncionarioParaExcluir] =
    useState<Funcionario | null>(null);
  const [excluindoId, setExcluindoId] = useState<string | null>(null);

  useEffect(() => {
    carregarFuncionarios();
  }, []);

  useEffect(() => {
    setPaginaAtual(1);
  }, [
    busca,
    filtroCargo,
    filtroSituacao,
    filtroAdmissaoInicial,
    filtroAdmissaoFinal,
    itensPorPagina,
  ]);

  async function carregarFuncionarios() {
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from("funcionarios")
        .select("*")
        .order("nome", { ascending: true });

      if (error) throw error;

      setFuncionarios((data as Funcionario[]) || []);
    } catch (error) {
      console.error("Erro ao carregar funcionários:", error);
      showToast("Erro ao carregar funcionários.", "error");
    } finally {
      setLoading(false);
    }
  }

  async function excluirFuncionario(id: string) {
    setExcluindoId(id);

    try {
      const { error } = await supabase.from("funcionarios").delete().eq("id", id);

      if (error) throw error;

      setFuncionarios((estadoAnterior) =>
        estadoAnterior.filter((f) => f.id !== id)
      );

      showToast("Funcionário excluído com sucesso.", "success");
    } catch (error) {
      console.error("Erro ao excluir funcionário:", error);
      showToast("Erro ao excluir funcionário.", "error");
    } finally {
      setExcluindoId(null);
      setFuncionarioParaExcluir(null);
    }
  }

  function limparFiltros() {
    setBusca("");
    setFiltroCargo("");
    setFiltroSituacao("");
    setFiltroAdmissaoInicial("");
    setFiltroAdmissaoFinal("");
  }

  function aplicarFiltroSituacaoRapido(situacao: string) {
    setFiltroSituacao((atual) => (atual === situacao ? "" : situacao));
  }

  function toggleCampo(campo: CampoRelatorio) {
    setCamposSelecionados((estadoAnterior) =>
      estadoAnterior.includes(campo)
        ? estadoAnterior.filter((item) => item !== campo)
        : [...estadoAnterior, campo]
    );
  }

  function marcarTodosCampos() {
    setCamposSelecionados(CAMPOS_RELATORIO.map((campo) => campo.key));
  }

  function limparTodosCampos() {
    setCamposSelecionados([]);
  }

  function aplicarPadraoCampos() {
    setCamposSelecionados(["nome", "setor", "situacao", "admissao"]);
  }

  const cargosUnicos = useMemo(() => {
    return [...new Set(funcionarios.map((f) => f.cargo).filter(Boolean))].sort(
      (a, b) => a.localeCompare(b)
    );
  }, [funcionarios]);

  const totais = useMemo(() => {
    return {
      total: funcionarios.length,
      ativos: funcionarios.filter((f) => f.situacao === "Ativo").length,
      ferias: funcionarios.filter((f) => f.situacao === "Férias").length,
      afastados: funcionarios.filter((f) => f.situacao === "Afastado").length,
      inativos: funcionarios.filter((f) => f.situacao === "Inativo").length,
    };
  }, [funcionarios]);

  const funcionariosFiltrados = useMemo(() => {
    const textoBusca = busca.toLowerCase().trim();
    const buscaNumerica = busca.replace(/\D/g, "");

    return funcionarios.filter((f) => {
      const nomeNormalizado = (f.nome || "").toLowerCase();
      const cpfNumerico = (f.cpf || "").replace(/\D/g, "");
      const cargoNormalizado = (f.cargo || "").toLowerCase();
      const setorNormalizado = (f.setor || "").toLowerCase();

      const matchBusca = textoBusca
        ? nomeNormalizado.includes(textoBusca) ||
          cargoNormalizado.includes(textoBusca) ||
          setorNormalizado.includes(textoBusca) ||
          (buscaNumerica ? cpfNumerico.includes(buscaNumerica) : false)
        : true;

      const matchCargo = filtroCargo ? f.cargo === filtroCargo : true;
      const matchSituacao = filtroSituacao
        ? f.situacao === filtroSituacao
        : true;
      const matchAdmissaoInicial = filtroAdmissaoInicial
        ? normalizarData(f.admissao) >= filtroAdmissaoInicial
        : true;
      const matchAdmissaoFinal = filtroAdmissaoFinal
        ? normalizarData(f.admissao) <= filtroAdmissaoFinal
        : true;

      return (
        matchBusca &&
        matchCargo &&
        matchSituacao &&
        matchAdmissaoInicial &&
        matchAdmissaoFinal
      );
    });
  }, [
    funcionarios,
    busca,
    filtroCargo,
    filtroSituacao,
    filtroAdmissaoInicial,
    filtroAdmissaoFinal,
  ]);

  const totalPaginas = Math.max(
    1,
    Math.ceil(funcionariosFiltrados.length / itensPorPagina)
  );

  const funcionariosPaginados = useMemo(() => {
    const inicio = (paginaAtual - 1) * itensPorPagina;
    const fim = inicio + itensPorPagina;
    return funcionariosFiltrados.slice(inicio, fim);
  }, [funcionariosFiltrados, paginaAtual, itensPorPagina]);

  const colunasVisiveis = useMemo(() => {
    return CAMPOS_RELATORIO.filter((campo) =>
      camposSelecionados.includes(campo.key)
    );
  }, [camposSelecionados]);

  const paginasVisiveis = useMemo(() => {
    const paginas: number[] = [];
    const inicio = Math.max(1, paginaAtual - 2);
    const fim = Math.min(totalPaginas, paginaAtual + 2);

    for (let i = inicio; i <= fim; i++) paginas.push(i);
    return paginas;
  }, [paginaAtual, totalPaginas]);

  function getTituloRelatorio() {
    const partes: string[] = ["Relatório de Funcionários"];

    if (busca.trim()) partes.push(`Busca: ${busca.trim()}`);
    if (filtroCargo) partes.push(`Cargo: ${filtroCargo}`);
    if (filtroSituacao) partes.push(`Situação: ${filtroSituacao}`);

    if (filtroAdmissaoInicial && filtroAdmissaoFinal) {
      partes.push(
        `Admissão: ${formatarDataBR(filtroAdmissaoInicial)} até ${formatarDataBR(
          filtroAdmissaoFinal
        )}`
      );
    } else if (filtroAdmissaoInicial) {
      partes.push(
        `Admitidos a partir de ${formatarDataBR(filtroAdmissaoInicial)}`
      );
    } else if (filtroAdmissaoFinal) {
      partes.push(`Admitidos até ${formatarDataBR(filtroAdmissaoFinal)}`);
    }

    return partes.join(" | ");
  }

  function badgeSituacaoTone(situacao: string) {
    if (situacao === "Ativo") return "green" as const;
    if (situacao === "Férias") return "blue" as const;
    if (situacao === "Afastado") return "amber" as const;
    if (situacao === "Suspenso") return "red" as const;
    if (situacao === "Inativo") return "gray" as const;
    return "gray" as const;
  }

  function formatarSalario(valor?: number | null) {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(valor ?? 0);
  }

  function formatarCPF(cpf?: string | null) {
    if (!cpf) return "-";

    const numeros = cpf.replace(/\D/g, "");

    if (numeros.length !== 11) return cpf;

    return `${numeros.slice(0, 3)}.${numeros.slice(3, 6)}.${numeros.slice(
      6,
      9
    )}-${numeros.slice(9, 11)}`;
  }

  function formatarPIS(pis?: string | null) {
    if (!pis) return "-";

    const numeros = pis.replace(/\D/g, "");

    if (numeros.length !== 11) return pis;

    return `${numeros.slice(0, 3)}.${numeros.slice(3, 8)}.${numeros.slice(
      8,
      10
    )}-${numeros.slice(10)}`;
  }

  function renderValorColuna(
    funcionario: Funcionario,
    campo: CampoRelatorio
  ) {
    switch (campo) {
      case "nome":
        return (
          <div className="min-w-[280px]">
            <p className="font-semibold text-slate-900">{funcionario.nome || "-"}</p>
            <p className="mt-1 text-sm text-slate-500">{funcionario.cargo || "-"}</p>
          </div>
        );

      case "cpf":
        return formatarCPF(funcionario.cpf);

      case "pis":
        return formatarPIS(funcionario.pis);

      case "data_nascimento":
        return funcionario.data_nascimento
          ? formatarDataBR(normalizarData(funcionario.data_nascimento))
          : "-";

      case "telefone":
        return funcionario.telefone || "-";

      case "cargo":
        return funcionario.cargo || "-";

      case "setor":
        return funcionario.setor || "-";

      case "salario":
        return formatarSalario(funcionario.salario);

      case "situacao":
        return (
          <StatusBadge tone={badgeSituacaoTone(funcionario.situacao)}>
            {funcionario.situacao}
          </StatusBadge>
        );

      case "admissao":
        return funcionario.admissao
          ? formatarDataBR(normalizarData(funcionario.admissao))
          : "-";

      default:
        return "-";
    }
  }

  function handleBaixarPDF() {
    baixarRelatorioPDF(
      funcionariosFiltrados,
      getTituloRelatorio(),
      camposSelecionados
    );
    showToast("PDF gerado com sucesso.", "success");
  }

  function handleImprimirPDF() {
    imprimirRelatorioPDF(
      funcionariosFiltrados,
      getTituloRelatorio(),
      camposSelecionados
    );
    showToast("Preparando impressão do relatório.", "info");
  }

  function handleExportarExcel() {
    exportarFuncionariosCSV(funcionariosFiltrados, camposSelecionados);
    showToast("Arquivo CSV exportado com sucesso.", "success");
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Funcionários"
          description="Gestão completa do quadro de funcionários"
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
        title="Funcionários"
        description="Gestão completa do quadro de funcionários"
        actions={
          <>
            <Button
              onClick={handleBaixarPDF}
              variant="success"
              icon={<FileText size={16} />}
            >
              PDF
            </Button>

            <Button
              onClick={handleImprimirPDF}
              variant="outline"
              icon={<Printer size={16} />}
            >
              Imprimir
            </Button>

            <Button
              onClick={handleExportarExcel}
              variant="outline"
              className="border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
              icon={<FileSpreadsheet size={16} />}
            >
              Excel
            </Button>

            <Button
              href="/funcionarios/novo"
              variant="primary"
              icon={<PlusCircle size={16} />}
            >
              + Novo Funcionário
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
        <StatCard
          title="Funcionários"
          value={totais.total}
          subtitle="Quadro geral"
          icon={<Users size={18} />}
        />
        <StatCard
          title="Ativos"
          value={totais.ativos}
          subtitle="Em atividade"
          icon={<CheckCircle2 size={18} />}
          tone="green"
        />
        <StatCard
          title="Férias"
          value={totais.ferias}
          subtitle="Em gozo"
          icon={<Plane size={18} />}
          tone="blue"
        />
        <StatCard
          title="Afastados"
          value={totais.afastados}
          subtitle="Exigem atenção"
          icon={<ShieldAlert size={18} />}
          tone="amber"
        />
        <StatCard
          title="Inativos"
          value={totais.inativos}
          subtitle="Cadastro inativo"
          icon={<UserX size={18} />}
          tone="gray"
        />
      </div>

      <SectionCard title="Buscar e filtrar funcionários">
        <div className="mb-5">
          <div className="relative">
            <Search
              size={18}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <Input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por nome, CPF, cargo ou setor..."
              className="pl-11"
            />
          </div>
        </div>

        <div className="mb-5 flex flex-wrap gap-2">
          <FiltroRapido
            ativo={filtroSituacao === "Ativo"}
            label="Ativos"
            onClick={() => aplicarFiltroSituacaoRapido("Ativo")}
          />
          <FiltroRapido
            ativo={filtroSituacao === "Férias"}
            label="Férias"
            onClick={() => aplicarFiltroSituacaoRapido("Férias")}
          />
          <FiltroRapido
            ativo={filtroSituacao === "Afastado"}
            label="Afastados"
            onClick={() => aplicarFiltroSituacaoRapido("Afastado")}
          />
          <FiltroRapido
            ativo={filtroSituacao === "Suspenso"}
            label="Suspensos"
            onClick={() => aplicarFiltroSituacaoRapido("Suspenso")}
          />
          <FiltroRapido
            ativo={filtroSituacao === "Inativo"}
            label="Inativos"
            onClick={() => aplicarFiltroSituacaoRapido("Inativo")}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
          <Select
            label="Filtrar por função"
            value={filtroCargo}
            onChange={(e) => setFiltroCargo(e.target.value)}
            options={[
              { label: "Todas", value: "" },
              ...cargosUnicos.map((cargo) => ({
                label: cargo,
                value: cargo,
              })),
            ]}
          />

          <Select
            label="Filtrar por situação"
            value={filtroSituacao}
            onChange={(e) => setFiltroSituacao(e.target.value)}
            options={[
              { label: "Todas", value: "" },
              { label: "Ativos", value: "Ativo" },
              { label: "Férias", value: "Férias" },
              { label: "Afastados", value: "Afastado" },
              { label: "Suspensos", value: "Suspenso" },
              { label: "Inativos", value: "Inativo" },
            ]}
          />

          <Input
            label="Admissão inicial"
            type="date"
            value={filtroAdmissaoInicial}
            onChange={(e) => setFiltroAdmissaoInicial(e.target.value)}
          />

          <Input
            label="Admissão final"
            type="date"
            value={filtroAdmissaoFinal}
            onChange={(e) => setFiltroAdmissaoFinal(e.target.value)}
          />

          <div className="flex items-end">
            <Button
              onClick={limparFiltros}
              variant="outline"
              className="w-full"
            >
              Limpar filtros
            </Button>
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title="Campos do relatório PDF"
        description="Escolha quais colunas deseja exibir no relatório."
        action={
          <div className="flex flex-wrap gap-2">
            <Button onClick={marcarTodosCampos} variant="outline" size="sm">
              Marcar todos
            </Button>

            <Button onClick={limparTodosCampos} variant="outline" size="sm">
              Limpar
            </Button>

            <Button
              onClick={aplicarPadraoCampos}
              variant="outline"
              size="sm"
              className="bg-slate-50"
            >
              Padrão RH
            </Button>
          </div>
        }
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {CAMPOS_RELATORIO.map((campo) => {
            const selecionado = camposSelecionados.includes(campo.key);

            return (
              <label
                key={campo.key}
                className={`flex cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3 text-sm transition ${
                  selecionado
                    ? "border-slate-900 bg-slate-50 text-slate-900"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                <input
                  type="checkbox"
                  checked={selecionado}
                  onChange={() => toggleCampo(campo.key)}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <span className="font-medium">{campo.label}</span>
              </label>
            );
          })}
        </div>

        <div className="mt-4 text-sm text-slate-500">
          {camposSelecionados.length} campo(s) selecionado(s)
        </div>
      </SectionCard>

      <TableContainer
        title="Lista de funcionários"
        description={`Exibindo ${funcionariosPaginados.length} de ${funcionariosFiltrados.length} funcionário(s)`}
      >
        <div className="flex flex-col gap-3 border-b border-slate-200 px-6 py-4 md:flex-row md:items-center md:justify-between">
          <div className="text-sm text-slate-600">
            Total filtrado:{" "}
            <span className="font-semibold text-slate-900">
              {funcionariosFiltrados.length}
            </span>
          </div>

          <div className="flex items-center gap-2 text-sm text-slate-600">
            <span>Itens por página:</span>
            <select
              value={itensPorPagina}
              onChange={(e) => setItensPorPagina(Number(e.target.value))}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-left text-sm text-slate-500">
                {colunasVisiveis.map((coluna) => (
                  <th
                    key={coluna.key}
                    className="whitespace-nowrap px-6 py-4 font-medium"
                  >
                    {coluna.label}
                  </th>
                ))}
                <th className="whitespace-nowrap px-6 py-4 font-medium">Ações</th>
              </tr>
            </thead>

            <tbody>
              {funcionariosPaginados.map((funcionario) => (
                <tr
                  key={funcionario.id}
                  className="border-b border-slate-100 hover:bg-slate-50"
                >
                  {colunasVisiveis.map((coluna) => (
                    <td
                      key={coluna.key}
                      className="whitespace-nowrap px-6 py-4 text-slate-700"
                    >
                      {renderValorColuna(funcionario, coluna.key)}
                    </td>
                  ))}

                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Button
                        href={`/funcionarios/${funcionario.id}`}
                        variant="outline"
                        size="sm"
                        icon={<Eye size={14} />}
                      >
                        Ver
                      </Button>

                      <Button
                        href={`/funcionarios/editar/${funcionario.id}`}
                        variant="outline"
                        size="sm"
                        icon={<Pencil size={14} />}
                      >
                        Editar
                      </Button>

                      <ActionsMenu
                        funcionarioId={funcionario.id}
                        onExcluir={() => setFuncionarioParaExcluir(funcionario)}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {funcionariosPaginados.length === 0 && (
          <div className="px-6 py-8">
            <EmptyState
              title="Nenhum funcionário encontrado"
              description="Tente ajustar os filtros aplicados para localizar resultados."
            />
          </div>
        )}

        <div className="flex flex-col gap-3 border-t border-slate-200 px-6 py-4 md:flex-row md:items-center md:justify-between">
          <div className="text-sm text-slate-500">
            Página {paginaAtual} de {totalPaginas}
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={() => setPaginaAtual((p) => Math.max(1, p - 1))}
              disabled={paginaAtual === 1}
              variant="outline"
              size="sm"
            >
              Anterior
            </Button>

            {paginasVisiveis.map((pagina) => (
              <button
                key={pagina}
                onClick={() => setPaginaAtual(pagina)}
                className={`rounded-xl px-3 py-2 text-sm transition ${
                  pagina === paginaAtual
                    ? "bg-slate-900 text-white"
                    : "border border-slate-200 text-slate-700 hover:bg-slate-50"
                }`}
              >
                {pagina}
              </button>
            ))}

            <Button
              onClick={() =>
                setPaginaAtual((p) => Math.min(totalPaginas, p + 1))
              }
              disabled={paginaAtual === totalPaginas}
              variant="outline"
              size="sm"
            >
              Próxima
            </Button>
          </div>
        </div>
      </TableContainer>

      <ConfirmModal
        open={!!funcionarioParaExcluir}
        title="Excluir funcionário"
        description="Tem certeza que deseja excluir este funcionário? Essa ação não poderá ser desfeita."
        confirmText="Excluir"
        loading={excluindoId === funcionarioParaExcluir?.id}
        onCancel={() => {
          if (!excluindoId) {
            setFuncionarioParaExcluir(null);
          }
        }}
        onConfirm={() => {
          if (funcionarioParaExcluir) {
            excluirFuncionario(funcionarioParaExcluir.id);
          }
        }}
      />
    </div>
  );
}

function FiltroRapido({
  ativo,
  label,
  onClick,
}: {
  ativo: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-4 py-2 text-sm font-medium transition ${
        ativo
          ? "bg-slate-900 text-white"
          : "bg-slate-100 text-slate-700 hover:bg-slate-200"
      }`}
    >
      {label}
    </button>
  );
}

function ActionsMenu({
  funcionarioId,
  onExcluir,
}: {
  funcionarioId: string;
  onExcluir: () => void;
}) {
  const [aberto, setAberto] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setAberto(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setAberto((v) => !v)}
        className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-3 py-2 text-slate-700 transition hover:bg-slate-50"
      >
        <MoreHorizontal size={16} />
      </button>

      {aberto && (
        <div className="absolute right-0 z-20 mt-2 w-52 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg">
          <Link
            href={`/movimentacoes?funcionario=${funcionarioId}`}
            className="flex items-center gap-2 px-4 py-3 text-sm text-slate-700 transition hover:bg-slate-50"
            onClick={() => setAberto(false)}
          >
            <PlusCircle size={15} />
            Movimentação
          </Link>

          <Link
            href={`/ferias/nova?funcionario=${funcionarioId}`}
            className="flex items-center gap-2 px-4 py-3 text-sm text-slate-700 transition hover:bg-slate-50"
            onClick={() => setAberto(false)}
          >
            <CalendarDays size={15} />
            Lançar férias
          </Link>

          <button
            onClick={() => {
              setAberto(false);
              onExcluir();
            }}
            className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm text-red-600 transition hover:bg-red-50"
          >
            <Trash2 size={15} />
            Excluir
          </button>
        </div>
      )}
    </div>
  );
}

function normalizarData(data: string) {
  if (!data) return "";

  if (/^\d{4}-\d{2}-\d{2}$/.test(data)) {
    return data;
  }

  if (/^\d{2}\/\d{2}\/\d{4}$/.test(data)) {
    const [dia, mes, ano] = data.split("/");
    return `${ano}-${mes}-${dia}`;
  }

  const d = new Date(data);
  if (isNaN(d.getTime())) return "";

  return d.toISOString().split("T")[0];
}

function formatarDataBR(data: string) {
  if (!data) return "-";
  const [ano, mes, dia] = data.split("-");
  return `${dia}/${mes}/${ano}`;
}