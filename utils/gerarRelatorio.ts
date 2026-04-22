import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { Funcionario } from "@/types/funcionarios";

export type CampoRelatorio =
  | "nome"
  | "cpf"
  | "pis"
  | "data_nascimento"
  | "telefone"
  | "cargo"
  | "setor"
  | "salario"
  | "situacao"
  | "admissao";

export const CAMPOS_RELATORIO: { key: CampoRelatorio; label: string }[] = [
  { key: "nome", label: "Nome" },
  { key: "cpf", label: "CPF" },
  { key: "pis", label: "PIS" },
  { key: "data_nascimento", label: "Data de Nascimento" },
  { key: "telefone", label: "Telefone" },
  { key: "cargo", label: "Cargo" },
  { key: "setor", label: "Setor" },
  { key: "salario", label: "Salário" },
  { key: "situacao", label: "Situação" },
  { key: "admissao", label: "Admissão" },
];

function formatarData(data?: string | null) {
  if (!data) return "-";

  if (/^\d{4}-\d{2}-\d{2}$/.test(data)) {
    const [ano, mes, dia] = data.split("-");
    return `${dia}/${mes}/${ano}`;
  }

  const date = new Date(data);
  if (!isNaN(date.getTime())) {
    return date.toLocaleDateString("pt-BR");
  }

  return data;
}

function formatarSalario(salario?: number | null) {
  if (salario === undefined || salario === null || Number.isNaN(Number(salario))) {
    return "-";
  }

  return Number(salario).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
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

function formatarCPF(cpf?: string | null) {
  if (!cpf) return "-";

  const numeros = cpf.replace(/\D/g, "");

  if (numeros.length !== 11) return cpf;

  return `${numeros.slice(0, 3)}.${numeros.slice(3, 6)}.${numeros.slice(
    6,
    9
  )}-${numeros.slice(9, 11)}`;
}

function formatarValor(funcionario: Funcionario, campo: CampoRelatorio) {
  switch (campo) {
    case "nome":
      return funcionario.nome || "-";
    case "cpf":
      return formatarCPF(funcionario.cpf);
    case "pis":
      return formatarPIS(funcionario.pis);
    case "data_nascimento":
      return formatarData(funcionario.data_nascimento);
    case "telefone":
      return funcionario.telefone || "-";
    case "cargo":
      return funcionario.cargo || "-";
    case "setor":
      return funcionario.setor || "-";
    case "salario":
      return formatarSalario(funcionario.salario);
    case "situacao":
      return funcionario.situacao || "-";
    case "admissao":
      return formatarData(funcionario.admissao);
    default:
      return "-";
  }
}

function escaparCSV(valor: string) {
  const texto = String(valor ?? "");
  const precisaAspas =
    texto.includes(";") || texto.includes('"') || texto.includes("\n");

  if (!precisaAspas) return texto;

  return `"${texto.replace(/"/g, '""')}"`;
}

function criarDocumentoPDF(
  funcionarios: Funcionario[],
  titulo: string,
  camposSelecionados: CampoRelatorio[]
) {
  if (!camposSelecionados.length) {
    alert("Selecione pelo menos um campo para gerar o relatório.");
    return null;
  }

  const colunas = CAMPOS_RELATORIO.filter((campo) =>
    camposSelecionados.includes(campo.key)
  );

  const doc = new jsPDF({
    orientation: colunas.length > 6 ? "landscape" : "portrait",
    unit: "mm",
    format: "a4",
  });

  doc.setFontSize(16);
  doc.text(titulo, 14, 20);

  doc.setFontSize(10);
  doc.text(`Gerado em: ${new Date().toLocaleString("pt-BR")}`, 14, 28);

  autoTable(doc, {
    startY: 35,
    head: [colunas.map((coluna) => coluna.label)],
    body: funcionarios.map((funcionario) =>
      colunas.map((coluna) => formatarValor(funcionario, coluna.key))
    ),
    styles: {
      fontSize: colunas.length > 6 ? 8 : 9,
      cellPadding: 3,
      valign: "middle",
      overflow: "linebreak",
    },
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: 255,
      fontStyle: "bold",
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    margin: {
      top: 35,
      left: 10,
      right: 10,
    },
  });

  return doc;
}

export function baixarRelatorioPDF(
  funcionarios: Funcionario[],
  titulo: string,
  camposSelecionados: CampoRelatorio[]
) {
  const doc = criarDocumentoPDF(funcionarios, titulo, camposSelecionados);
  if (!doc) return;

  doc.save("relatorio-funcionarios.pdf");
}

export function imprimirRelatorioPDF(
  funcionarios: Funcionario[],
  titulo: string,
  camposSelecionados: CampoRelatorio[]
) {
  const doc = criarDocumentoPDF(funcionarios, titulo, camposSelecionados);
  if (!doc) return;

  const blobUrl = doc.output("bloburl");
  const janela = window.open(blobUrl, "_blank");

  if (!janela) {
    alert("Não foi possível abrir a visualização para impressão.");
    return;
  }
}

export function exportarFuncionariosCSV(
  funcionarios: Funcionario[],
  camposSelecionados: CampoRelatorio[]
) {
  if (!camposSelecionados.length) {
    alert("Selecione pelo menos um campo para exportar.");
    return;
  }

  const colunas = CAMPOS_RELATORIO.filter((campo) =>
    camposSelecionados.includes(campo.key)
  );

  const cabecalho = colunas.map((coluna) => escaparCSV(coluna.label)).join(";");

  const linhas = funcionarios.map((funcionario) =>
    colunas
      .map((coluna) => escaparCSV(formatarValor(funcionario, coluna.key)))
      .join(";")
  );

  const conteudo = [cabecalho, ...linhas].join("\n");
  const blob = new Blob(["\uFEFF" + conteudo], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "relatorio-funcionarios.csv";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}