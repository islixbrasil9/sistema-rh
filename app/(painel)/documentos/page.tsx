"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  BadgeCheck,
  FileWarning,
  Search,
  ShieldAlert,
  Users,
} from "lucide-react";

type StatusDocumento = "Entregue" | "Pendente" | "Vencido" | "Nao se aplica";
type StatusAso = "Válido" | "Pendente" | "Vencido";
type StatusGeral = "Completo" | "Pendências" | "Em atraso";

type DocumentoItem = {
  nome: string;
  status: StatusDocumento;
};

type ControleDocumental = {
  id: string;
  funcionario: string;
  cargo: string;
  setor: string;
  aso: StatusAso;
  documentos: DocumentoItem[];
};

const documentosMock: ControleDocumental[] = [
  {
    id: "1",
    funcionario: "Cláudio Régis Tavares dos Santos",
    cargo: "Servente",
    setor: "Obras",
    aso: "Válido",
    documentos: [
      { nome: "RG", status: "Entregue" },
      { nome: "CPF", status: "Entregue" },
      { nome: "PIS", status: "Entregue" },
      { nome: "CTPS", status: "Pendente" },
      { nome: "Comprovante de residência", status: "Entregue" },
      { nome: "Dados bancários", status: "Entregue" },
      { nome: "Foto 3x4", status: "Pendente" },
      { nome: "ASO", status: "Entregue" },
      { nome: "Contrato assinado", status: "Entregue" },
      { nome: "Ficha de EPI", status: "Entregue" },
    ],
  },
  {
    id: "2",
    funcionario: "Luciano dos Santos Farias",
    cargo: "Mecânico",
    setor: "Manutenção",
    aso: "Vencido",
    documentos: [
      { nome: "RG", status: "Entregue" },
      { nome: "CPF", status: "Entregue" },
      { nome: "PIS", status: "Pendente" },
      { nome: "CTPS", status: "Entregue" },
      { nome: "Comprovante de residência", status: "Entregue" },
      { nome: "Dados bancários", status: "Entregue" },
      { nome: "Foto 3x4", status: "Entregue" },
      { nome: "ASO", status: "Vencido" },
      { nome: "Contrato assinado", status: "Entregue" },
      { nome: "Ficha de EPI", status: "Pendente" },
    ],
  },
  {
    id: "3",
    funcionario: "Renata Oliveira",
    cargo: "Assistente",
    setor: "RH",
    aso: "Válido",
    documentos: [
      { nome: "RG", status: "Entregue" },
      { nome: "CPF", status: "Entregue" },
      { nome: "PIS", status: "Entregue" },
      { nome: "CTPS", status: "Entregue" },
      { nome: "Comprovante de residência", status: "Entregue" },
      { nome: "Dados bancários", status: "Entregue" },
      { nome: "Foto 3x4", status: "Entregue" },
      { nome: "ASO", status: "Entregue" },
      { nome: "Contrato assinado", status: "Entregue" },
      { nome: "Ficha de EPI", status: "Nao se aplica" },
    ],
  },
  {
    id: "4",
    funcionario: "Marcos Antônio",
    cargo: "Motorista",
    setor: "Transporte",
    aso: "Pendente",
    documentos: [
      { nome: "RG", status: "Entregue" },
      { nome: "CPF", status: "Entregue" },
      { nome: "PIS", status: "Entregue" },
      { nome: "CTPS", status: "Pendente" },
      { nome: "Comprovante de residência", status: "Pendente" },
      { nome: "Dados bancários", status: "Entregue" },
      { nome: "Foto 3x4", status: "Entregue" },
      { nome: "ASO", status: "Pendente" },
      { nome: "Contrato assinado", status: "Entregue" },
      { nome: "Ficha de EPI", status: "Entregue" },
    ],
  },
];

function normalizarTexto(valor: string) {
  return valor
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function calcularPendencias(item: ControleDocumental) {
  return item.documentos.filter(
    (doc) => doc.status === "Pendente" || doc.status === "Vencido"
  );
}

function calcularEntregues(item: ControleDocumental) {
  return item.documentos.filter((doc) => doc.status === "Entregue").length;
}

function calcularAplicaveis(item: ControleDocumental) {
  return item.documentos.filter((doc) => doc.status !== "Nao se aplica").length;
}

function calcularPercentual(item: ControleDocumental) {
  const entregues = calcularEntregues(item);
  const aplicaveis = calcularAplicaveis(item);

  if (aplicaveis === 0) return 0;
  return Math.round((entregues / aplicaveis) * 100);
}

function calcularStatusGeral(item: ControleDocumental): StatusGeral {
  const possuiVencido =
    item.aso === "Vencido" ||
    item.documentos.some((doc) => doc.status === "Vencido");

  if (possuiVencido) return "Em atraso";

  const pendencias = calcularPendencias(item);
  if (item.aso === "Pendente" || pendencias.length > 0) return "Pendências";

  return "Completo";
}

function badgeClasseStatusDocumento(status: StatusDocumento) {
  if (status === "Entregue") return "bg-green-100 text-green-700";
  if (status === "Pendente") return "bg-yellow-100 text-yellow-700";
  if (status === "Vencido") return "bg-red-100 text-red-700";
  return "bg-slate-100 text-slate-600";
}

function badgeClasseAso(status: StatusAso) {
  if (status === "Válido") return "bg-green-100 text-green-700";
  if (status === "Pendente") return "bg-yellow-100 text-yellow-700";
  if (status === "Vencido") return "bg-red-100 text-red-700";
  return "bg-slate-100 text-slate-700";
}

function badgeClasseStatusGeral(status: StatusGeral) {
  if (status === "Completo") return "bg-green-100 text-green-700";
  if (status === "Pendências") return "bg-yellow-100 text-yellow-700";
  if (status === "Em atraso") return "bg-red-100 text-red-700";
  return "bg-slate-100 text-slate-700";
}

function corBarraProgresso(percentual: number) {
  if (percentual >= 100) return "bg-green-500";
  if (percentual >= 70) return "bg-emerald-500";
  if (percentual >= 40) return "bg-yellow-500";
  return "bg-red-500";
}

function traduzirStatusDocumento(status: StatusDocumento) {
  if (status === "Nao se aplica") return "Não se aplica";
  return status;
}

export default function DocumentosPage() {
  const [busca, setBusca] = useState("");
  const [filtroSetor, setFiltroSetor] = useState("Todos");
  const [filtroStatusGeral, setFiltroStatusGeral] = useState("Todos");
  const [somentePendencias, setSomentePendencias] = useState(false);
  const [funcionarioExpandido, setFuncionarioExpandido] = useState<string | null>(
    null
  );

  const setores = useMemo(() => {
    return [
      "Todos",
      ...Array.from(new Set(documentosMock.map((item) => item.setor))).sort(),
    ];
  }, []);

  const dadosFiltrados = useMemo(() => {
    return documentosMock.filter((item) => {
      const textoBusca = normalizarTexto(busca);
      const correspondeBusca =
        !textoBusca ||
        normalizarTexto(item.funcionario).includes(textoBusca) ||
        normalizarTexto(item.cargo).includes(textoBusca) ||
        normalizarTexto(item.setor).includes(textoBusca);

      const statusGeral = calcularStatusGeral(item);

      const correspondeSetor =
        filtroSetor === "Todos" || item.setor === filtroSetor;

      const correspondeStatus =
        filtroStatusGeral === "Todos" || statusGeral === filtroStatusGeral;

      const possuiPendencias =
        calcularPendencias(item).length > 0 || item.aso !== "Válido";

      const correspondePendencia =
        !somentePendencias || possuiPendencias;

      return (
        correspondeBusca &&
        correspondeSetor &&
        correspondeStatus &&
        correspondePendencia
      );
    });
  }, [busca, filtroSetor, filtroStatusGeral, somentePendencias]);

  const resumo = useMemo(() => {
    const total = documentosMock.length;

    const completos = documentosMock.filter(
      (item) => calcularStatusGeral(item) === "Completo"
    ).length;

    const comPendencias = documentosMock.filter(
      (item) => calcularStatusGeral(item) === "Pendências"
    ).length;

    const emAtraso = documentosMock.filter(
      (item) => calcularStatusGeral(item) === "Em atraso"
    ).length;

    const asoPendentesOuVencidos = documentosMock.filter(
      (item) => item.aso === "Pendente" || item.aso === "Vencido"
    ).length;

    return {
      total,
      completos,
      comPendencias,
      emAtraso,
      asoPendentesOuVencidos,
    };
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Documentos</h1>
          <p className="mt-1 text-sm text-slate-600">
            Controle e acompanhamento documental dos funcionários
          </p>
        </div>

        <button
          type="button"
          className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          Novo controle documental
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <ResumoCard
          titulo="Total de funcionários"
          valor={String(resumo.total)}
          icon={<Users className="h-5 w-5" />}
          iconeClasse="bg-blue-100 text-blue-700"
        />

        <ResumoCard
          titulo="Documentação completa"
          valor={String(resumo.completos)}
          icon={<BadgeCheck className="h-5 w-5" />}
          iconeClasse="bg-green-100 text-green-700"
        />

        <ResumoCard
          titulo="Com pendências"
          valor={String(resumo.comPendencias)}
          icon={<AlertTriangle className="h-5 w-5" />}
          iconeClasse="bg-yellow-100 text-yellow-700"
        />

        <ResumoCard
          titulo="Em atraso"
          valor={String(resumo.emAtraso)}
          icon={<ShieldAlert className="h-5 w-5" />}
          iconeClasse="bg-red-100 text-red-700"
        />

        <ResumoCard
          titulo="ASO pendente/vencido"
          valor={String(resumo.asoPendentesOuVencidos)}
          icon={<FileWarning className="h-5 w-5" />}
          iconeClasse="bg-rose-100 text-rose-700"
        />
      </div>

      <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-200">
        <div className="grid gap-3 lg:grid-cols-4">
          <div className="relative lg:col-span-2">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por funcionário, cargo ou setor..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full rounded-xl border border-gray-200 py-3 pl-11 pr-4 text-sm outline-none transition focus:border-blue-400"
            />
          </div>

          <select
            value={filtroSetor}
            onChange={(e) => setFiltroSetor(e.target.value)}
            className="rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-blue-400"
          >
            {setores.map((setor) => (
              <option key={setor} value={setor}>
                {setor}
              </option>
            ))}
          </select>

          <select
            value={filtroStatusGeral}
            onChange={(e) => setFiltroStatusGeral(e.target.value)}
            className="rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-blue-400"
          >
            <option value="Todos">Todos os status</option>
            <option value="Completo">Completo</option>
            <option value="Pendências">Pendências</option>
            <option value="Em atraso">Em atraso</option>
          </select>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm text-slate-700 hover:bg-gray-50">
            <input
              type="checkbox"
              checked={somentePendencias}
              onChange={(e) => setSomentePendencias(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300"
            />
            Somente pendências
          </label>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] border-collapse">
            <thead>
              <tr className="border-b border-gray-200 bg-slate-50 text-left text-sm text-slate-500">
                <th className="px-6 py-4 font-medium">Funcionário</th>
                <th className="px-6 py-4 font-medium">Cargo / Setor</th>
                <th className="px-6 py-4 font-medium">Progresso</th>
                <th className="px-6 py-4 font-medium">Pendências</th>
                <th className="px-6 py-4 font-medium">ASO</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Ações</th>
              </tr>
            </thead>

            <tbody>
              {dadosFiltrados.map((item) => {
                const pendencias = calcularPendencias(item);
                const entregues = calcularEntregues(item);
                const aplicaveis = calcularAplicaveis(item);
                const percentual = calcularPercentual(item);
                const statusGeral = calcularStatusGeral(item);
                const expandido = funcionarioExpandido === item.id;

                return (
                  <>
                    <tr
                      key={item.id}
                      className="border-b border-gray-100 align-top transition hover:bg-slate-50"
                    >
                      <td className="px-6 py-5">
                        <div>
                          <p className="font-semibold text-slate-900">
                            {item.funcionario}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            ID interno: {item.id}
                          </p>
                        </div>
                      </td>

                      <td className="px-6 py-5 text-sm text-slate-700">
                        <div className="font-medium text-slate-900">
                          {item.cargo}
                        </div>
                        <div className="mt-1 text-slate-500">{item.setor}</div>
                      </td>

                      <td className="px-6 py-5">
                        <div className="space-y-2">
                          <div className="h-2.5 w-44 overflow-hidden rounded-full bg-slate-100">
                            <div
                              className={`h-full rounded-full ${corBarraProgresso(
                                percentual
                              )}`}
                              style={{ width: `${percentual}%` }}
                            />
                          </div>
                          <p className="text-sm font-medium text-slate-800">
                            {entregues} / {aplicaveis} documentos
                          </p>
                          <p className="text-xs text-slate-500">
                            {percentual}% concluído
                          </p>
                        </div>
                      </td>

                      <td className="px-6 py-5 text-sm text-slate-700">
                        {pendencias.length > 0 ? (
                          <div className="max-w-xs">
                            <p className="line-clamp-2">
                              {pendencias
                                .slice(0, 3)
                                .map((doc) => doc.nome)
                                .join(", ")}
                              {pendencias.length > 3 ? "..." : ""}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                              {pendencias.length} pendência(s)
                            </p>
                          </div>
                        ) : (
                          <span className="text-slate-400">Nenhuma</span>
                        )}
                      </td>

                      <td className="px-6 py-5">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${badgeClasseAso(
                            item.aso
                          )}`}
                        >
                          {item.aso}
                        </span>
                      </td>

                      <td className="px-6 py-5">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${badgeClasseStatusGeral(
                            statusGeral
                          )}`}
                        >
                          {statusGeral}
                        </span>
                      </td>

                      <td className="px-6 py-5 text-right">
                        <button
                          type="button"
                          onClick={() =>
                            setFuncionarioExpandido(expandido ? null : item.id)
                          }
                          className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-gray-50"
                        >
                          {expandido ? "Ocultar detalhes" : "Ver detalhes"}
                        </button>
                      </td>
                    </tr>

                    {expandido && (
                      <tr className="border-b border-gray-100 bg-slate-50/70">
                        <td colSpan={7} className="px-6 py-5">
                          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                            {item.documentos.map((doc, index) => (
                              <div
                                key={`${item.id}-${doc.nome}-${index}`}
                                className="rounded-xl bg-white p-4 ring-1 ring-gray-200"
                              >
                                <div className="flex items-center justify-between gap-3">
                                  <p className="text-sm font-medium text-slate-900">
                                    {doc.nome}
                                  </p>
                                  <span
                                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${badgeClasseStatusDocumento(
                                      doc.status
                                    )}`}
                                  >
                                    {traduzirStatusDocumento(doc.status)}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}

              {dadosFiltrados.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-10 text-center text-sm text-slate-500"
                  >
                    Nenhum registro encontrado para os filtros aplicados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function ResumoCard({
  titulo,
  valor,
  icon,
  iconeClasse,
}: {
  titulo: string;
  valor: string;
  icon: React.ReactNode;
  iconeClasse: string;
}) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
      <div className="flex items-start gap-4">
        <div
          className={`flex h-11 w-11 items-center justify-center rounded-xl ${iconeClasse}`}
        >
          {icon}
        </div>

        <div>
          <p className="text-sm text-slate-500">{titulo}</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{valor}</p>
        </div>
      </div>
    </div>
  );
}