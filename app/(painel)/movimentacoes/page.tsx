"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { sincronizarSituacaoFuncionario } from "@/utils/recalcularSituacaoFuncionario";
import { FileText, PlusCircle } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { SectionCard } from "@/components/ui/section-card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { TableContainer } from "@/components/ui/table-container";
import { ActionsMenu } from "@/components/ui/actions-menu";
import { useToast } from "@/components/ui/toast";
import { ConfirmModal } from "@/components/ui/confirm-modal";

type Funcionario = {
  id: string;
  nome: string;
  cargo: string;
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

const TIPOS_MOVIMENTACAO = [
  "Advertência",
  "Suspensão",
  "Férias",
  "Afastamento",
  "Retorno",
  "Demissão",
  "Observação",
  "Acidente de Trabalho",
] as const;

export default function MovimentacoesPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-slate-500">Carregando movimentações...</div>}>
      <MovimentacoesContent />
    </Suspense>
  );
}

function MovimentacoesContent() {
  const searchParams = useSearchParams();
  const { showToast } = useToast();

  const [movimentacoes, setMovimentacoes] = useState<Movimentacao[]>([]);
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);

  const [funcionarioId, setFuncionarioId] = useState("");
  const [tipo, setTipo] = useState("Advertência");
  const [descricao, setDescricao] = useState("");
  const [data, setData] = useState("");

  const [loading, setLoading] = useState(false);
  const [movimentacaoParaExcluir, setMovimentacaoParaExcluir] =
    useState<Movimentacao | null>(null);
  const [excluindoId, setExcluindoId] = useState<string | null>(null);

  const [filtroNome, setFiltroNome] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("");
  const [filtroCargo, setFiltroCargo] = useState("");
  const [filtroSituacao, setFiltroSituacao] = useState("");
  const [filtroDataInicial, setFiltroDataInicial] = useState("");
  const [filtroDataFinal, setFiltroDataFinal] = useState("");

  useEffect(() => {
    carregarDados();
  }, [searchParams]);

  async function carregarDados() {
    const { data: funcs, error: funcsError } = await supabase
      .from("funcionarios")
      .select("*")
      .order("nome", { ascending: true });

    const { data: movs, error: movsError } = await supabase
      .from("movimentacoes")
      .select("*")
      .order("data", { ascending: false });

    if (funcsError) {
      console.error("Erro ao carregar funcionários:", funcsError);
      showToast("Erro ao carregar funcionários.", "error");
    }

    if (movsError) {
      console.error("Erro ao carregar movimentações:", movsError);
      showToast("Erro ao carregar movimentações.", "error");
    }

    if (funcs) setFuncionarios(funcs);
    if (movs) setMovimentacoes(movs);

    const funcionarioParam =
      searchParams.get("funcionarioId") || searchParams.get("funcionario");

    if (funcionarioParam) {
      setFuncionarioId(funcionarioParam);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!descricao.trim()) {
      showToast("Preencha a descrição.", "info");
      return;
    }

    if (!data) {
      showToast("Informe a data.", "info");
      return;
    }

    const funcionarioSelecionado = funcionarios.find(
      (f) => f.id === funcionarioId
    );

    if (!funcionarioSelecionado) {
      showToast("Selecione um funcionário.", "info");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.from("movimentacoes").insert([
        {
          funcionario_id: funcionarioSelecionado.id,
          funcionario_nome: funcionarioSelecionado.nome,
          tipo,
          descricao,
          data,
        },
      ]);

      if (error) throw error;

      await sincronizarSituacaoFuncionario(funcionarioSelecionado.id);

      showToast("Movimentação registrada com sucesso!", "success");

      setTipo("Advertência");
      setDescricao("");
      setData("");
      setFuncionarioId("");

      await carregarDados();
    } catch (err) {
      console.error(err);
      showToast("Erro ao salvar movimentação.", "error");
    } finally {
      setLoading(false);
    }
  }

  async function excluirMovimentacao(mov: Movimentacao) {
    setExcluindoId(mov.id);

    try {
      const { error: deleteError } = await supabase
        .from("movimentacoes")
        .delete()
        .eq("id", mov.id);

      if (deleteError) throw deleteError;

      await sincronizarSituacaoFuncionario(mov.funcionario_id);

      showToast("Movimentação excluída com sucesso!", "success");

      await carregarDados();
    } catch (err) {
      console.error(err);
      showToast("Erro ao excluir movimentação.", "error");
    } finally {
      setExcluindoId(null);
      setMovimentacaoParaExcluir(null);
    }
  }

  function formatarData(valor: string) {
    if (!valor) return "-";
    const [ano, mes, dia] = valor.split("-");
    return `${dia}/${mes}/${ano}`;
  }

  function badgeTone(tipoMov: string) {
    if (tipoMov === "Férias") return "blue" as const;
    if (tipoMov === "Afastamento") return "amber" as const;
    if (tipoMov === "Retorno") return "green" as const;
    if (tipoMov === "Suspensão") return "red" as const;
    if (tipoMov === "Advertência") return "orange" as const;
    if (tipoMov === "Demissão") return "gray" as const;
    if (tipoMov === "Acidente de Trabalho") return "red" as const;
    return "gray" as const;
  }

  const movimentacoesFiltradas = useMemo(() => {
    return movimentacoes.filter((mov) => {
      const funcionario = funcionarios.find((f) => f.id === mov.funcionario_id);

      const nomeOk = filtroNome
        ? mov.funcionario_nome.toLowerCase().includes(filtroNome.toLowerCase())
        : true;

      const tipoOk = filtroTipo ? mov.tipo === filtroTipo : true;
      const cargoOk = filtroCargo ? funcionario?.cargo === filtroCargo : true;
      const situacaoOk = filtroSituacao
        ? funcionario?.situacao === filtroSituacao
        : true;
      const dataInicialOk = filtroDataInicial
        ? mov.data >= filtroDataInicial
        : true;
      const dataFinalOk = filtroDataFinal ? mov.data <= filtroDataFinal : true;

      return (
        nomeOk &&
        tipoOk &&
        cargoOk &&
        situacaoOk &&
        dataInicialOk &&
        dataFinalOk
      );
    });
  }, [
    movimentacoes,
    funcionarios,
    filtroNome,
    filtroTipo,
    filtroCargo,
    filtroSituacao,
    filtroDataInicial,
    filtroDataFinal,
  ]);

  const cargosUnicos = useMemo(() => {
    return [...new Set(funcionarios.map((f) => f.cargo).filter(Boolean))].sort();
  }, [funcionarios]);

  const situacoesUnicas = useMemo(() => {
    return [...new Set(funcionarios.map((f) => f.situacao).filter(Boolean))].sort();
  }, [funcionarios]);

  function limparFiltros() {
    setFiltroNome("");
    setFiltroTipo("");
    setFiltroCargo("");
    setFiltroSituacao("");
    setFiltroDataInicial("");
    setFiltroDataFinal("");
  }

  function gerarPDF() {
    if (movimentacoesFiltradas.length === 0) {
      showToast("Não há movimentações para gerar o PDF.", "info");
      return;
    }

    const doc = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
    });

    const titulo = "Relatório de Movimentações";
    const dataGeracao = new Date().toLocaleDateString("pt-BR");

    doc.setFontSize(16);
    doc.text(titulo, 14, 14);

    doc.setFontSize(10);
    doc.text(`Gerado em: ${dataGeracao}`, 14, 21);

    const filtrosAplicados = [
      filtroNome ? `Funcionário: ${filtroNome}` : null,
      filtroTipo ? `Tipo: ${filtroTipo}` : null,
      filtroCargo ? `Cargo: ${filtroCargo}` : null,
      filtroSituacao ? `Situação: ${filtroSituacao}` : null,
      filtroDataInicial ? `Data inicial: ${formatarData(filtroDataInicial)}` : null,
      filtroDataFinal ? `Data final: ${formatarData(filtroDataFinal)}` : null,
    ].filter(Boolean);

    doc.setFontSize(9);
    doc.text(
      `Total de registros: ${movimentacoesFiltradas.length}`,
      14,
      filtrosAplicados.length > 0 ? 35 : 28
    );

    if (filtrosAplicados.length > 0) {
      const textoFiltros = `Filtros: ${filtrosAplicados.join(" | ")}`;
      const linhas = doc.splitTextToSize(textoFiltros, 260);
      doc.text(linhas, 14, 28);
    }

    const body = movimentacoesFiltradas.map((mov) => {
      const funcionario = funcionarios.find((f) => f.id === mov.funcionario_id);

      return [
        mov.funcionario_nome || "-",
        funcionario?.cargo || "-",
        funcionario?.situacao || "-",
        mov.tipo,
        mov.descricao || "-",
        formatarData(mov.data),
      ];
    });

    autoTable(doc, {
      startY: filtrosAplicados.length > 0 ? 40 : 32,
      head: [["Funcionário", "Cargo", "Situação", "Tipo", "Descrição", "Data"]],
      body,
      styles: {
        fontSize: 9,
        cellPadding: 2.5,
        valign: "middle",
      },
      headStyles: {
        fillColor: [15, 23, 42],
      },
      columnStyles: {
        0: { cellWidth: 48 },
        1: { cellWidth: 38 },
        2: { cellWidth: 28 },
        3: { cellWidth: 34 },
        4: { cellWidth: 95 },
        5: { cellWidth: 22 },
      },
      margin: { top: 14, right: 14, bottom: 14, left: 14 },
      didDrawPage: () => {
        const pagina = doc.getNumberOfPages();
        const largura = doc.internal.pageSize.getWidth();
        const altura = doc.internal.pageSize.getHeight();

        doc.setFontSize(9);
        doc.text(`Página ${pagina}`, largura - 30, altura - 6);
      },
    });

    doc.save("relatorio-movimentacoes.pdf");
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Movimentações"
        description="Registre eventos dos funcionários"
        actions={
          <Button
            onClick={gerarPDF}
            variant="success"
            icon={<FileText size={16} />}
          >
            Gerar PDF
          </Button>
        }
      />

      <SectionCard title="Registrar movimentação">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <Select
              label="Funcionário"
              value={funcionarioId}
              onChange={(e) => setFuncionarioId(e.target.value)}
              required
              options={[
                { label: "Selecione", value: "" },
                ...funcionarios.map((f) => ({
                  label: f.nome,
                  value: f.id,
                })),
              ]}
            />

            <Select
              label="Tipo"
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
              options={TIPOS_MOVIMENTACAO.map((item) => ({
                label: item,
                value: item,
              }))}
            />

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Descrição
              </label>
              <textarea
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="Descreva a movimentação"
                className="min-h-[110px] w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
              />
            </div>

            <div className="md:max-w-sm">
              <Input
                label="Data"
                type="date"
                value={data}
                onChange={(e) => setData(e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={loading}
              variant="primary"
              icon={<PlusCircle size={16} />}
            >
              {loading ? "Salvando..." : "Registrar Movimentação"}
            </Button>
          </div>
        </form>
      </SectionCard>

      <SectionCard
        title="Filtros do relatório e histórico"
        description="Use os filtros para visualizar e exportar apenas o que precisar."
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-6">
          <div className="xl:col-span-2">
            <Input
              label="Funcionário"
              type="text"
              value={filtroNome}
              onChange={(e) => setFiltroNome(e.target.value)}
              placeholder="Digite o nome"
            />
          </div>

          <Select
            label="Tipo"
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value)}
            options={[
              { label: "Todos", value: "" },
              ...TIPOS_MOVIMENTACAO.map((item) => ({
                label: item,
                value: item,
              })),
            ]}
          />

          <Select
            label="Cargo"
            value={filtroCargo}
            onChange={(e) => setFiltroCargo(e.target.value)}
            options={[
              { label: "Todos", value: "" },
              ...cargosUnicos.map((cargo) => ({
                label: cargo,
                value: cargo,
              })),
            ]}
          />

          <Select
            label="Situação"
            value={filtroSituacao}
            onChange={(e) => setFiltroSituacao(e.target.value)}
            options={[
              { label: "Todas", value: "" },
              ...situacoesUnicas.map((situacao) => ({
                label: situacao,
                value: situacao,
              })),
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
          <p className="text-sm text-slate-600">
            <span className="font-semibold text-slate-900">
              {movimentacoesFiltradas.length}
            </span>{" "}
            registro(s) encontrado(s)
          </p>

          <Button onClick={limparFiltros} variant="outline">
            Limpar filtros
          </Button>
        </div>
      </SectionCard>

      <TableContainer title="Histórico de movimentações">
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-left text-sm text-slate-500">
                <th className="px-6 py-4 font-medium">Funcionário</th>
                <th className="px-6 py-4 font-medium">Cargo</th>
                <th className="px-6 py-4 font-medium">Situação</th>
                <th className="px-6 py-4 font-medium">Tipo</th>
                <th className="px-6 py-4 font-medium">Descrição</th>
                <th className="px-6 py-4 font-medium">Data</th>
                <th className="px-6 py-4 font-medium">Ações</th>
              </tr>
            </thead>

            <tbody>
              {movimentacoesFiltradas.map((mov) => {
                const funcionario = funcionarios.find(
                  (f) => f.id === mov.funcionario_id
                );

                return (
                  <tr
                    key={mov.id}
                    className="border-b border-slate-100 transition hover:bg-slate-50"
                  >
                    <td className="px-6 py-4 font-medium text-slate-900">
                      {mov.funcionario_nome || "-"}
                    </td>

                    <td className="px-6 py-4 text-slate-700">
                      {funcionario?.cargo || "-"}
                    </td>

                    <td className="px-6 py-4 text-slate-700">
                      {funcionario?.situacao || "-"}
                    </td>

                    <td className="px-6 py-4">
                      <StatusBadge
                        tone={badgeTone(mov.tipo)}
                        className="whitespace-nowrap"
                      >
                        {mov.tipo}
                      </StatusBadge>
                    </td>

                    <td className="px-6 py-4 text-slate-700">
                      {mov.descricao}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-slate-600">
                      {formatarData(mov.data)}
                    </td>

                    <td className="px-6 py-4">
                      <ActionsMenu
                        actions={[
                          {
                            label: "Excluir",
                            onClick: () => setMovimentacaoParaExcluir(mov),
                            danger: true,
                          },
                        ]}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {movimentacoesFiltradas.length === 0 && (
          <div className="px-6 py-8">
            <EmptyState
              title="Nenhuma movimentação encontrada"
              description="Ajuste os filtros ou registre uma nova movimentação."
            />
          </div>
        )}
      </TableContainer>

      <ConfirmModal
        open={!!movimentacaoParaExcluir}
        title="Excluir movimentação"
        description="Tem certeza que deseja excluir esta movimentação? Essa ação não poderá ser desfeita."
        confirmText="Excluir"
        loading={excluindoId === movimentacaoParaExcluir?.id}
        onCancel={() => {
          if (!excluindoId) {
            setMovimentacaoParaExcluir(null);
          }
        }}
        onConfirm={() => {
          if (movimentacaoParaExcluir) {
            excluirMovimentacao(movimentacaoParaExcluir);
          }
        }}
      />
    </div>
  );
}